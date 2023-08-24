import {
  AXClassSchedule,
  AXRegistration,
  Class,
  Course,
  RegistrationType,
} from "../models";
import ProgramConfig from "../assets/programs.json";
import logger from "../utils/logger";
import { addStudentsToCourse, getUsers, rolloutClasses } from "../apis";
import dayjs from "dayjs";

const syncClasses = async (
  course: Course,
  axClassSchedule: Array<AXClassSchedule>
) => {
  logger.info("start sync classes");

  const { id: courseId, program, level, lesson_duration, center_id } = course;
  try {
    const programme = ProgramConfig[program as keyof typeof ProgramConfig];
    const lessons = programme?.[level as keyof typeof programme]?.split(",");
    if (!lessons || (lessons && lessons.length == 0)) {
      logger.warn("missing lesson config");
      return [];
    }

    const classes = [];
    for (let i = 0; i < axClassSchedule.length; i++) {
      const item = axClassSchedule[i];
      classes.push({
        duration: Number(lesson_duration),
        lesson_id: lessons[i],
        teacher_type: "native",
        date_start: `${item["LessonDate"]}${item.From?.replace(":", "")}`,
        date_end: `${item["LessonDate"]}${item.To?.replace(":", "")}`,
      });
    }

    const res = await rolloutClasses({
      courseId: courseId!,
      center: center_id!,
      classes,
    });
    res && res?.length > 0 && logger.info("sync classses successfully");
    logger.info("done sync classes");

    return res;
  } catch (error) {
    logger.error(error);
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
  logger.info("start sync class seats");
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

    logger.info(`The number of seats is ${validSeats.length}`);
    logger.info(`The number of studnet ids is ${studentIds?.length}`);

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
    logger.info("done sync class seats");
    return true;
  } catch (error) {
    logger.error("sync class seats error = ", error);
  }
  return false;
};

export { syncClasses, syncClassSeats };
