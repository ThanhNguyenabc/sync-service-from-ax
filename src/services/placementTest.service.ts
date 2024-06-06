import {
  createClass,
  createUsers,
  getUsers,
  updateClassFields,
} from "@/apis/_index";
import {
  createClassSeat,
  updateClassSeatFieldsByClass,
} from "@/apis/class_seat.api";
import {
  getPlacementTest,
  insertPlacementTest,
  updatePlacementTest,
} from "@/apis/placement_test.api";
import {
  AXPlacementTestInfor,
  AXStudentProfile,
  Class,
  ClassSeat,
  ClassType,
  User,
} from "@/models/_index";
import { Age_Mapping } from "@/utils/constants";
import { LMS_TIME_FORMAT } from "@/utils/date_utils";
import logger, { logMessage } from "@/utils/logger";
import assert from "assert";
import dayjs from "dayjs";

const checkValidPlacementTest = (data: AXPlacementTestInfor) => {
  if (!data.PlacementTest || !data.StudentInformation || !data.TeacherProfile) {
    logger.error(logMessage("error", "placementTest", "MissingData"));
    return false;
  }

  return true;
};

const getProgramPTTest = (student: AXStudentProfile): string => {
  const dateOfBirth = dayjs(student.DOB);

  const now = dayjs();
  const numberOfyears = now.diff(dateOfBirth, "months") / 12;

  const program = Age_Mapping.filter(
    ({ from, to }) => from <= numberOfyears && numberOfyears < to
  )?.at(0);

  return (program && `${program.code}-PT-000`) ?? "";
};

const createClassForTest = async (
  placementTestInfor: AXPlacementTestInfor,
  teacher: User
) => {
  const startTime = dayjs().format(LMS_TIME_FORMAT);
  const endTime = dayjs().add(90, "minutes").format(LMS_TIME_FORMAT);
  const placementTest = placementTestInfor.PlacementTest;

  const programPTTest = placementTestInfor.StudentInformation
    ? getProgramPTTest(placementTestInfor.StudentInformation)
    : "";

  // create class
  const studentClass: Class = {
    duration: 90,
    teacher_type: "native",
    date_start: Number(startTime),
    date_end: Number(endTime),
    type: ClassType.placement,
    center_id: placementTest?.Center,
    seats_taken: 1,
    online: placementTest?.PTStatus,
    notes: placementTest?.Note,
    teacher_id: teacher.id,
    lesson_id: programPTTest,
  };

  const classId = await createClass(studentClass);

  return classId;
};

type Users = {
  teacher?: User;
  student: User;
};
const getStudentAndTeacherInfor = async (
  data: AXPlacementTestInfor
): Promise<Users | null> => {
  const isValidData = checkValidPlacementTest(data);
  if (!isValidData) return null;
  assert(data.PlacementTest);
  assert(data.TeacherProfile);
  assert(data.StudentInformation);

  try {
    // create users if not existing
    const studentCode = data.StudentInformation.StudentCode || "";
    const teacherCode =
      data.TeacherProfile.StaffCode ||
      data.TeacherProfile.PersonnelNumber ||
      "";

    const teacherInfor: User = {
      status: "active",
      role: data.TeacherProfile.Role?.toLowerCase() || "teacher",
      center: data.PlacementTest.Center,
      firstname: data.TeacherProfile.FirstName,
      lastname: data.TeacherProfile.LastName,
      midname: data.TeacherProfile.MiddleName,
      email: data.TeacherProfile.Email,
      mobile: data.TeacherProfile.Phone,
      address: data.TeacherProfile.Address,
      staffcode: teacherCode,
    };

    const studentInfor: User = {
      status: "active",
      role: "student",
      center: data.PlacementTest.Center,
      firstname: data.StudentInformation.FirstName,
      lastname: data.StudentInformation.LastName,
      midname: data.StudentInformation.MiddleName,
      email: data.StudentInformation.Email,
      mobile: data.StudentInformation.MobilePhone,
      address: data.StudentInformation.Address,
      staffcode: studentCode,
    };

    let lmsUsers = await getUsers([studentCode, teacherCode]);

    if (!lmsUsers || lmsUsers.length == 0) {
      lmsUsers = await createUsers([studentInfor, teacherInfor]);
    } else if (lmsUsers.length == 1) {
      const role = lmsUsers[0].role || "";
      if (role === "student") {
        const res = await createUsers([teacherInfor]);
        teacherInfor.id = res?.[0].id;
      } else {
        const res = await createUsers([teacherInfor]);
        studentInfor.id = res?.[0].id;
      }
      lmsUsers = [studentInfor, teacherInfor];
    }

    return (
      lmsUsers?.reduce((res, item) => {
        if (item.role !== "student") res["teacher"] = item;
        else res["student"] = item;
        return res;
      }, {} as Users) || null
    );
  } catch (error) {}
  return null;
};

const createPlacementTest = async (
  placementTest: AXPlacementTestInfor,
  teacher: User,
  student: User
) => {
  try {
    const classId = await createClassForTest(placementTest, teacher);

    if (teacher && student) {
      // create class_seat for student
      if (classId) {
        const classSeat: ClassSeat = {
          class_id: Number(classId),
          student_id: student.id,
        };

        const seatId = await createClassSeat({
          classId: classId,
          data: classSeat,
        });
        seatId &&
          logger.info(
            logMessage("success", "placementTest", "successfully add new test")
          );

        return {
          classId,
        };
      }
    }

    logMessage("error", "placementTest", "can not create new test");
  } catch (error) {
    logger.error(logMessage("error", "placementTest", (error as Error).stack ?? ""));
  }
  return {};
};

export const addOrUpdatePlacementTest = async (data: AXPlacementTestInfor) => {
  if (!data.PlacementTest || !data.StudentInformation || !data.TeacherProfile) {
    logger.error(logMessage("error", "placementTest", "MissingData"));
    return;
  }

  logger.info(
    logMessage("start", "placementTest", "start to sync placementTest")
  );

  const response = await getStudentAndTeacherInfor(data);
  const { teacher, student } = response || {};
  const placementTest = await getPlacementTest(data.PlacementTest.ID);

  try {
    if (!placementTest?.id && teacher && student) {
      const { classId } = await createPlacementTest(data, teacher, student);

      // insert data to placementTest table
      await insertPlacementTest({
        class_id: classId,
        placement_test_id: data.PlacementTest.ID,
        student_code: student.staffcode,
        teacher_code: teacher.staffcode,
        ax_data: JSON.stringify(data),
      });

      classId &&
        logger.info(
          logMessage(
            "success",
            "placementTest",
            `create placementTest successfully - classId:[${classId}]`
          )
        );
    } else {
      const { class_id } = placementTest || {};
      // update class
      if (class_id) {
        const promises = [
          updateClassFields({
            id: class_id,
            data: {
              online: data.PlacementTest.PTStatus,
              teacher_id: teacher?.id,
              notes: data.PlacementTest.Note,
              lesson_id: getProgramPTTest(data.StudentInformation),
            },
          }),

          updateClassSeatFieldsByClass({
            classId: class_id,
            data: {
              student_id: student?.id,
            },
          }),
          updatePlacementTest(`${placementTest?.id}`, {
            ax_data: JSON.stringify(data),
            teacher_code: teacher?.staffcode,
            student_code: student?.staffcode,
          }),
        ];

        await Promise.all(promises);
        logger.info(
          logMessage(
            "success",
            "placementTest",
            `update placementTest successfully - classId:[${class_id}]`
          )
        );
      }
    }
  } catch (error) {
    logger.error(logMessage("error", "placementTest", (error as Error).stack ?? ""));
  }
};
