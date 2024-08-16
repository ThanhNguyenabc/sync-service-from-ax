import dayjs from "dayjs";
import InMemoryCache from "@/lib/cache_manager";
import { AXRegistration, Course, User } from "@/models/_index";
import {
  addStudentsToCourse,
  getUsers,
  removeStudentsFromCourse,
} from "@/apis/_index";
import logger, { logMessage } from "@/utils/logger";

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
    let users: { [key: string]: User } | null = await getUsersToMap(ids);

    const validStudents: Array<any> = [];
    let inValidStudents: Array<string> = [];

    for (const registration of axRegistrations) {
      const {
        Registration = "",
        TerminationStatus = "",
        StudentCode = "",
        ActualEndDate = "",
        ActualStartDate = "",
        RegistrationStatus,
      } = registration || {};

      const actualStartDate = dayjs(ActualStartDate, "DD/MM/YYYY").format(
        "YYYYMMDD0000"
      );
      const actualEndDate = dayjs(ActualEndDate, "DD/MM/YYYY").format(
        "YYYYMMDD2359"
      );

      const diff = dayjs(actualEndDate).diff(actualStartDate);
      if (diff >= 0) {
        const { id } = users?.[StudentCode] ?? {};
        if (id) {
          validStudents.push({
            student_id: id,
            reg_id: Registration,
            termination_status: TerminationStatus,
            registration_status: RegistrationStatus,
            date_from: actualStartDate,
            date_to: actualEndDate,
          });
        }
      } else {
        inValidStudents.push(StudentCode!);
      }
    }

    const promises: Promise<any>[] = [];

    if (inValidStudents.length > 0) {
      await removeStudentsFromCourse({
        id: course.id!,
        students: inValidStudents.map((item) => `${users![item].id}`),
      });
    }

    validStudents.length > 0 &&
      promises.push(
        addStudentsToCourse({ id: course.id!, students: validStudents })
      );

    await Promise.all(promises);

    logger.info(logMessage("success", "class seats", "sync successfully"));
    logger.info(
      `------------jobs is done - courseID [${course.id}]------------\r\n`
    );
    InMemoryCache.del(course.id || "");
    return true;
  } catch (error) {
    logger.error(
      logMessage("error", "class seats", (error as Error).stack ?? "")
    );
  }
  return false;
};

export { syncClassSeats };
