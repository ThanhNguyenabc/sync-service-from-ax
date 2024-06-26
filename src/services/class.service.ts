import dayjs from "dayjs";
import InMemoryCache from "@/lib/cache_manager";
import {
  AXClassSchedule,
  AXRegistration,
  AXTeacherTA,
  Course,
  RegistrationType,
  User,
  UserRole,
} from "@/models/_index";
import {
  addStudentsToCourse,
  fetchProgramConfig,
  getTimeOff,
  getUsers,
  rolloutClasses,
} from "@/apis/_index";
import logger, { logMessage } from "@/utils/logger";
import { Courses_Classes_Calendar } from "@/utils/class_helper";
import moment from "moment";

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
    let {
      id: courseId,
      program,
      level,
      schedule,
      lesson_duration,
      staff,
      center_id,
      date_start,
    } = course;

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

    // Get Time off
    const timeoff = await Promise.all([
      getTimeOff({ type: "global", value: "global" }),
      getTimeOff({
        type: "center",
        value: center_id ?? "",
      }),
    ]).then((res) => res.flat());

    // Generate calendar
    const lessonDuration = Number(lesson_duration) / 60;

    staff = staff ? JSON.parse(staff) : null;

    const calendar = Courses_Classes_Calendar(
      moment(`${date_start}`, "YYYYMMDD"),
      JSON.parse(schedule!),
      lessons,
      lessonDuration,
      timeoff,
      lessonDuration
    );

    let classes = [];

    const { staffs = null } = InMemoryCache.get(courseId!) as {
      staffs?: { [key: string]: number };
    };

    let axTeacherScheduling: {
      [key: string]: { teacherId?: number; taIds?: number[] };
    } = {};

    axClassTeachers?.forEach((item) => {
      let { teacherId, taIds = [] } =
        axTeacherScheduling[item["LessonNo"]] ?? {};
      if (item["Role"] === UserRole.Teacher) {
        teacherId = staffs?.[item["StaffCode"]] ?? 0;
      } else {
        const taId = staffs?.[item["StaffCode"]] ?? 0;
        taIds.push(taId);
      }
      axTeacherScheduling[item["LessonNo"]] = { teacherId, taIds };
    });

    let j = 0;
    for (const item of calendar) {
      let date = moment(item["date"], "YYYYMMDDHHmm");
      const axClass = axClassSchedule[j];
      if (axClass && axClass.LessonNo) {
        const lessonNo = axClass.LessonNo;
        for (const slot of item["session"]) {
          const { teacherId, taIds } =
            axTeacherScheduling?.[lessonNo as keyof typeof axTeacherScheduling];
          const listOfTA = taIds?.reduce(
            (result, item, index) => ({
              ...result,
              [`ta${index + 1}_id`]: item,
            }),
            {}
          );
          const lesson_id = slot["lesson"];
          const duration = slot["duration"] * 60;
          const date_start = date;
          const date_end = date_start.clone().add(duration, "minutes");
          classes.push({
            date_start: date_start.format("YYYYMMDDHHmm"),
            date_end: date_end.format("YYYYMMDDHHmm"),
            teacher_type: "native",
            classroom_id: course.room,
            lesson_id,
            duration,
            teacher_id: teacherId ?? null,
            ...listOfTA,
          });
          date = date_end;
        }
      }
      j++;
    }

    const data = {
      courseId: courseId!,
      center: center_id!,
      classes,
    };

    const res = await rolloutClasses(data);
    res && res!.length > 0
      ? logger.info(logMessage("success", "classes", "sync successfully"))
      : logger.error(logMessage("error", "classes", "sync fail"));

    return res;
  } catch (error) {
    logger.error(logMessage("error", "classes",  (error as Error).stack || ""));
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
    logger.error(logMessage("error", "class seats", (error as Error).stack ?? ""));
  }
  return false;
};
export { syncClasses, syncClassSeats };
