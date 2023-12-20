import { createClass, createUsers, getUsers } from "@/apis/_index";
import { createClassSeat } from "@/apis/class_seat.api";
import {
  AXPlacementTestInfor,
  Class,
  ClassSeat,
  ClassType,
  User,
} from "@/models/_index";
import { LMS_TIME_FORMAT } from "@/utils/date_utils";
import logger, { logMessage } from "@/utils/logger";
import dayjs from "dayjs";

const addPlacementTest = async (data: AXPlacementTestInfor) => {
  if (!data.PlacementTest || !data.StudentInformation || !data.TeacherProfile) {
    logger.error(logMessage("error", "placementTest", "MissingData"));
    return;
  }

  try {
    // create users if not existing
    const studentCode = data.StudentInformation.StudentCode || "";
    const teacherCode =
      data.TeacherProfile.StaffCode ||
      data.TeacherProfile.PersonnelNumber ||
      "";

    const teacherInfor: User = {
      status: "active",
      role: data.TeacherProfile.Role?.toLowerCase(),
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

    const startTime = dayjs().format(LMS_TIME_FORMAT);
    const endTime = dayjs().add(90, "minutes").format(LMS_TIME_FORMAT);

    // create class
    const studentClass: Class = {
      duration: 90,
      teacher_type: "native",
      date_start: Number(startTime),
      date_end: Number(endTime),
      type: ClassType.placement,
      center_id: data.PlacementTest.Center,
      seats_taken: 1,
      online: data.PlacementTest.PTStatus,
      notes: data.PlacementTest.Note,
      teacher_id: lmsUsers?.[1]?.id,
    };

    const classId = await createClass(studentClass);
    console.log("classss------------");
    console.log(classId);

    // create class_seat for student
    if (classId) {
      const classSeat: ClassSeat = {
        class_id: Number(classId),
        student_id: lmsUsers?.[0]?.id,
      };

      const seatId = await createClassSeat({
        classId: classId,
        data: classSeat,
      });
      seatId &&
        logger.info(
          logMessage("infor", "placementTest", "successfully add new test")
        );
    }
  } catch (error) {
    logger.error(logMessage("error", "placementTest", String(error)));
  }
};

export default addPlacementTest;
