import {
  AXClassSchedule,
  AXRegistration,
  Class,
  Course,
  RegistrationType,
  AXTeacherTA,
  UserRole,
  User,
} from "../models";
import ProgramConfig from "../assets/programs.json";
import logger from "../utils/logger";
import { addStudentsToCourse, getUsers, rolloutClasses } from "../apis";
import dayjs from "dayjs";

const syncClasses = async (
  course: Course,
  axClassSchedule: Array<AXClassSchedule>,
  axClassTeachers?: Array<AXTeacherTA>
) => {
  logger.info("[classes]: start sync 🚀");

  try {
    const { id: courseId, program, level, lesson_duration, center_id } = course;

    const programme =
      ProgramConfig[
        `${program} ${
          Number(lesson_duration) / 60
        } hours` as keyof typeof ProgramConfig
      ];
    const lessons = programme?.[level as keyof typeof programme]?.split(",");
    if (!lessons || (lessons && lessons.length == 0)) {
      logger.error("❌ [classes]: missing lessons from programme file config");
      return [];
    }

    const teacherIds: string[] = [];

    const classTeacherMap = axClassTeachers?.reduce((result: any, item) => {
      let data = (result[item.LessonNo] || {}) as { [key: string]: string };

      if (item.StaffCode && teacherIds.indexOf(item.StaffCode) < 0) {
        teacherIds.push(item.StaffCode);
      }
      let ids = data[`${item.Role.toLowerCase()}`];

      if (ids && item.Role === UserRole.TA) {
        ids += `,${item.StaffCode}`;
      } else {
        ids = item.StaffCode;
      }
      data[`${item.Role.toLowerCase()}`] = ids;

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
          data?.reduce(
            (result, item) => ({
              ...result,
              [item.staffcode]: item,
            }),
            {} as { [key: string]: User }
          ) || null
        );
      });
    }

    const promises = [];
    for (let i = 0; i < axClassSchedule.length; i++) {
      promises.push(
        new Promise<Class>((res) => {
          const item = axClassSchedule[i];
          let classData: { [key: string]: any } = {};
          if (teachersInfo && classTeacherMap) {
            const users = classTeacherMap?.[item.LessonNo];
            classData["teacher_id"] =
              teachersInfo?.[users["teacher"]]?.id || null;
            let taNum = 1;

            users.ta.split(",").forEach((item) => {
              classData[`ta${taNum}_id`] = teachersInfo?.[item]?.id || null;
            });
          }
          classData = {
            ...classData,
            duration: Number(lesson_duration),
            lesson_id: lessons[i],
            teacher_type: "native",
            date_start: `${item["LessonDate"]}${item.From?.replace(":", "")}`,
            date_end: `${item["LessonDate"]}${item.To?.replace(":", "")}`,
          };
          res(classData);
        })
      );
    }
    const classes = await Promise.all(promises);
    const data = {
      courseId: courseId!,
      center: center_id!,
      classes,
    };

    const res = await rolloutClasses(data);
    res && res?.length > 0
      ? logger.info("✅ [classes]: sync successfully")
      : logger.info("❌ [classes]: sync fail");
    return res;
  } catch (error) {
    logger.error(`❌ [sync class] error --> ${error}`);
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
  logger.info("[class seats]: start sync 🚀");
  try {
    const { classes, id } = course;
    if (!classes || (classes && classes.length == 0)) {
      logger.warn(`missing classes in course_id ${id}`);
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
        date_from: validSeats[item.staffcode]["ActualStartDate"],
      });
    });

    await addStudentsToCourse(data);
    logger.info("✅ [class seats]: done");
    logger.info("done all processes 🚀 --->>>>");
    return true;
  } catch (error) {
    logger.error(`❌ [class seats] error --> ${error}`);
  }
  return false;
};

export { syncClasses, syncClassSeats };
