import {
  AXClassSchedule,
  AXRegistration,
  Class,
  Course,
  RegistrationType,
  AXTeacherTA,
  UserRole,
  User,
  Time,
} from "../models";
import logger from "../utils/logger";
import { addStudentsToCourse, getUsers, rolloutClasses } from "../apis";
import dayjs from "dayjs";
import { getProgramConfig } from "../config/app_configs";
import { formatHour } from "../utils/date_utils";
import InMemoryCache from "../lib/cache_manager";

const syncClasses = async (
  course: Course,
  axClassSchedule: Array<AXClassSchedule>,
  axClassTeachers?: Array<AXTeacherTA>
) => {
  logger.info("🚀 [classes]: sync classes");

  try {
    const { id: courseId, program, level, lesson_duration, center_id } = course;

    const programConfig = await getProgramConfig();
    const programme = programConfig?.[program as keyof typeof programConfig];
    const lessons = programme?.[level as keyof typeof programme]?.split(",");
    if (!lessons || (lessons && lessons.length == 0)) {
      logger.error("❌ [classes]: missing lessons from programme file config");
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
      teachersInfo = await getUsers(teacherIds).then((data) => {
        return (
          data?.reduce((result, item) => {
            if (item.staffcode) {
              result[item.staffcode] = item;
            }
            return result;
          }, {} as { [key: string]: User }) || null
        );
      });
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

    console.log("data----------------");
    console.log(data);
    const res = await rolloutClasses(data);
    res && res?.length > 0
      ? logger.info("✅ [classes]: sync successfully")
      : logger.info("❌ [classes]: sync fail");
    return res;
  } catch (error) {
    logger.error(`❌ [classes] error --> ${error}`);
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
  logger.info("🚀 [class seats]: sync class seats");
  try {
    const { classes, id } = course;
    if (!classes || (classes && classes.length == 0)) {
      logger.error(`❌ [class seats] missing classes in course_id ${id}`);
      return;
    }

    const registrationMap = axRegistrations.reduce((result, item) => {
      return {
        ...result,
        [item.StudentCode!]: item,
      };
    }, {});

    const validSeats: { [key: string]: any } = {};
    const studentCodes: Array<string> = [];

    Object.values(registrationMap).forEach((item: AXRegistration) => {
      const actualStartDate = dayjs(item.ActualStartDate, "DD/MM/YYYY").format(
        "YYYYMMDD0000"
      );
      const actualEndDate = dayjs(item.ActualEndDate, "DD/MM/YYYY").format(
        "YYYYMMDD0000"
      );

      const diff = dayjs(actualEndDate).diff(actualStartDate);
      if (
        diff >= 0 &&
        item.RegistrationStatus === RegistrationType.Registered
      ) {
        validSeats[item.StudentCode!] = {
          ActualStartDate: actualStartDate,
          ActualEndDate: actualEndDate,
        };

        studentCodes.push(item.StudentCode!);
      }
    });

    const studentIds = await getUsers(studentCodes);

    const data = {
      id: course.id!,
      students: [] as any[],
    };
    studentIds?.forEach((item) => {
      data["students"].push({
        student_id: item.id,
        date_from: validSeats[item.staffcode!]["ActualStartDate"],
      });
    });

    await addStudentsToCourse(data);
    logger.info("✅ [class seats]: sync successfully");
    logger.info(
      `------------jobs is done - courseID [${course.id}]------------`
    );
    InMemoryCache.del(course.id || "");
    return true;
  } catch (error) {
    logger.error(`❌ [class seats] error --> ${error}`);
  }
  return false;
};

export { syncClasses, syncClassSeats };
