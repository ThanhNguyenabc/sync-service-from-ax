import dayjs from "dayjs";
import InMemoryCache from "@/lib/cache_manager";
import {
  AXClassSchedule,
  AXRegistration,
  AXTeacherTA,
  Class,
  Course,
  RegistrationType,
  Time,
  User,
  UserRole,
} from "@/models/_index";
import {
  addStudentsToCourse,
  fetchProgramConfig,
  getUsers,
  rolloutClasses,
} from "@/apis/_index";
import { formatHour } from "@/utils/_index";
import logger, { logMessage } from "@/utils/logger";
import { child } from "winston";

const getUsersToMap = async (ids: Array<string>) => {
  const users = await getUsers(ids);
  return (
    users?.reduce((result, item) => {
      return {
        ...result,
        [item.staffcode!]: item,
      };
    }, {} as { [key: string]: User }) || null
  );
};

const syncClasses = async (
  course: Course,
  axClassSchedule: Array<AXClassSchedule>,
  axClassTeachers?: Array<AXTeacherTA>
) => {
  logger.info(logMessage("start", "classes", "sync classes"));
  try {
    const { id: courseId, program, level, lesson_duration, center_id } = course;
    const programConfig = await fetchProgramConfig();
    const programme = programConfig?.[program as keyof typeof programConfig];

    const lessons =
      `${programme?.[level as keyof typeof programme]}`.split(",") || [];
    if (!lessons || (lessons && lessons.length == 0)) {
      logger.error(
        logMessage(
          "error",
          "classes",
          "missing lessons from programme file config"
        )
      );
      return [];
    }

    const teacherIds: string[] = [];

    const lessonsMap = axClassTeachers?.reduce((result: any, item) => {
      let data = (result[item.LessonNo] || {}) as { [key: string]: string };

      if (
        item.StaffCode &&
        item.StaffCode.length > 0 &&
        teacherIds.indexOf(item.StaffCode) < 0
      ) {
        teacherIds.push(item.StaffCode);
      }
      let userIds = data[`${item.Role.toLowerCase()}`];

      if (userIds && item.Role === UserRole.TA) {
        userIds += `,${item.StaffCode}`;
      } else {
        userIds = item.StaffCode;
      }
      data[`${item.Role.toLowerCase()}`] = userIds;

      return {
        ...result,
        [item.LessonNo]: data,
      };
    }, {}) as {
      [key: string]: {
        teacher: string;
        ta: string;
      };
    };

    let teachersInfo: { [key: string]: User } | null = null;
    if (teacherIds.length > 0) {
      teachersInfo = await getUsersToMap(teacherIds);
    }

    const courseTime =
      (InMemoryCache.get(course.id || "") as {
        startTime: Time;
        endTime: Time;
      }) || {};

    const promises = [];
    const startTime = formatHour(courseTime["startTime"] || "");
    const endTime = formatHour(courseTime["endTime"] || "");

    for (let i = 0; i < axClassSchedule.length; i++) {
      const item = axClassSchedule[i];
      if (item.LessonStatus !== "Cancelled") {
        promises.push(
          new Promise<Class>((res) => {
            let classData: { [key: string]: any } = {};
            if (teachersInfo && lessonsMap) {
              const users = lessonsMap?.[item.LessonNo];
              classData["teacher_id"] =
                teachersInfo?.[users?.["teacher"]]?.id || null;

              let taNum = 1;

              users?.ta?.split(",").forEach((item) => {
                classData[`ta${taNum}_id`] = teachersInfo?.[item]?.id || null;
              });
            }
            classData = {
              ...classData,
              duration: Number(lesson_duration),
              lesson_id: lessons[item.LessonNo - 1],
              teacher_type: "native",
              date_start: `${item["LessonDate"]}${startTime}`,
              date_end: `${item["LessonDate"]}${endTime}`,
              classroom_id: course.room,
            };
            res(classData);
          })
        );
      }
    }
    const classes = await Promise.all(promises);
    const data = {
      courseId: courseId!,
      center: center_id!,
      classes,
    };

    const res = await rolloutClasses(data);
    res && res?.length > 0
      ? logger.info(logMessage("success", "classes", "sync successfully"))
      : logger.error(logMessage("error", "classes", "sync fail"));

    return res;
  } catch (error) {
    logger.error(logMessage("error", "classes", String(error)));
  }
  return [];
};

const syncClassSeats = async ({
  course,
  axRegistrations,
}: {
  course: Course;
  axRegistrations: Array<AXRegistration>;
}) => {
  logger.info(logMessage("start", "class seats", "sync class seats"));
  try {
    const { classes, id } = course;
    if (!classes || (classes && classes.length == 0)) {
      logger.error(
        logMessage("error", "class seats", `missing classes in course_id ${id}`)
      );

      return;
    }

    // convert xml data to schedules map
    const registrationMap = axRegistrations?.reduce((result, item) => {
      return {
        ...result,
        [item.StudentCode!]: item,
      };
    }, {});

    // get all LMS student user from the above schedule map
    const ids = Object.keys(registrationMap);
    let users: { [key: string]: User } | null = null;

    getUsersToMap(ids).then((res) => {
      users = res;
    });

    const validSeats: { [key: string]: any } = {};
    const validStudents: Array<string> = [];
    let inValidStudents: Array<string> = [];

    for (const key in registrationMap) {
      const {
        StudentCode = "",
        ActualEndDate = "",
        ActualStartDate = "",
        RegistrationStatus,
      } = registrationMap[
        key as keyof typeof registrationMap
      ] as AXRegistration;

      const actualStartDate = dayjs(ActualStartDate, "DD/MM/YYYY").format(
        "YYYYMMDD0000"
      );
      const actualEndDate = dayjs(ActualEndDate, "DD/MM/YYYY").format(
        "YYYYMMDD0000"
      );

      const diff = dayjs(actualEndDate).diff(actualStartDate);
      if (diff >= 0 && RegistrationStatus === RegistrationType.Registered) {
        validSeats[StudentCode] = {
          ActualStartDate: actualStartDate,
          ActualEndDate: actualEndDate,
        };
        validStudents.push(StudentCode!);
      } else {
        inValidStudents.push(StudentCode!);
      }
    }

    if (!users) {
      users = await getUsersToMap(ids);
    }

    // make completely data object to create new class_seat
    const data = {
      id: course.id!,
      students: [] as any[],
    };
    validStudents.forEach((item) => {
      data["students"].push({
        student_id: users?.[item]?.id,
        date_from: validSeats[item]["ActualStartDate"],
      });
    });

    const promises = [addStudentsToCourse(data)];
    if (inValidStudents.length > 0) {
      //TODO: remove student
      // promises.push(
      //   removeStudentsFromCourse({
      //     id: course.id!,
      //     students: inValidStudents.map((item) => `${users![item].id}`),
      //   })
      // );
    }

    await Promise.all(promises);

    logger.info(logMessage("success", "class seats", "sync successfully"));
    logger.info(
      `------------jobs is done - courseID [${course.id}]------------`
    );
    InMemoryCache.del(course.id || "");
    return true;
  } catch (error) {
    logger.error(logMessage("error", "class seats", String(error)));
  }
  return false;
};

export { syncClasses, syncClassSeats };
