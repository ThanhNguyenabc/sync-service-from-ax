import { generateSchedule, getHourMinuteFromString } from "@/utils/date_utils";
import {
  AXCourse,
  AXTeacherProfile,
  ClassStatusMapping,
  Course,
} from "@/models/_index";
import dayjs from "dayjs";
import {
  createCourse,
  fetchProgramConfig,
  getCourseByCondition,
  getUsers,
  updateCourse,
} from "@/apis/_index";
import logger, { logMessage } from "@/utils/logger";
import InMemoryCache from "@/lib/cache_manager";
import { MultipleDurationProgram } from "@/utils/constants";

const createCourseInfo = async (
  axClassInfo: AXCourse,
  axTeacherProfile?: Array<AXTeacherProfile>
) => {
  const startTime = getHourMinuteFromString(axClassInfo.StartTime || "");
  const endTime = getHourMinuteFromString(axClassInfo.EndTime || "");

  const startDate = dayjs(axClassInfo.StartDate);
  const endDate = dayjs(axClassInfo.EndDate);

  const isHaveCambridge =
    axClassInfo.CourseTemplate?.toLowerCase().includes("cam");
  let level = `${axClassInfo.LevelId}`;

  if (axClassInfo.Module && axClassInfo.Module.length > 0) {
    level = `${level}-${axClassInfo.Module}`;
  }

  if (isHaveCambridge) {
    level = `${level}-CAM`;
  }

  const lesson_duration =
    dayjs(`${axClassInfo.StartDate} ${endTime.hour}:${endTime.minute}`).diff(
      dayjs(`${axClassInfo.StartDate} ${startTime.hour}:${startTime.minute}`)
    ) / 60000;

  await fetchProgramConfig();

  let axProgram = `${axClassInfo.ProgrammeName}`;

  const program =
    axProgram in MultipleDurationProgram
      ? `${axProgram} ${Number(lesson_duration) / 60} hours`
      : axProgram;

  const course: Course = {
    name: axClassInfo.ClassCode,
    center_id: axClassInfo.Center,
    program: program,
    level: level.toUpperCase(),
    lesson_duration: `${lesson_duration}`,
    course_template: axClassInfo.CourseTemplate,
    seats: Number(axClassInfo.MaxAttendant || 0),
    room: axClassInfo.Room,
    teacher_config: "all native",
    status: axClassInfo.ClassStatus
      ? ClassStatusMapping[
          axClassInfo.ClassStatus as keyof typeof ClassStatusMapping
        ]
      : "",
    date_start: Number(startDate.format("YYYYMMDD")),
    date_end: Number(endDate.format("YYYYMMDD")),
    schedule: JSON.stringify(
      generateSchedule(axClassInfo.Days || "", {
        hour: startTime.hour,
        minute: startTime.minute,
      })
    ),
  };

  //sync teachers to course
  let teachers = {};
  let teacherProfiles = axTeacherProfile;

  if (teacherProfiles && teacherProfiles.length > 0) {
    const staffCodes = teacherProfiles.reduce((result, item) => {
      if (item?.StaffCode) result.push(item.StaffCode);
      return result;
    }, [] as string[]);

    const users = staffCodes.length > 0 ? await getUsers(staffCodes) : null;
    if (users) {
      let staff: { [key: string]: any } = {};

      let taNum = 1;
      let teacherNum = 2;
      users?.forEach((item, index) => {
        let key = "";
        switch (item.role) {
          case "teacher":
            if (!staff["teacher_id"]) key = "teacher_id";
            else key = `teacher${teacherNum++}_id`;
            break;
          case "ta":
            key = `ta${taNum++}_id`;
            break;
        }
        staff[key] = item.id;
        teachers = {
          ...teachers,
          [item.staffcode ?? ""]: item.id,
        };
      });

      course.staff = JSON.stringify(staff);
    }
  }

  return {
    startTime: `${startTime.hour}:${startTime.minute}`,
    endTime: `${endTime.hour}:${endTime.minute}`,
    staffs: teachers,
    data: course,
  };
};

const syncCourse = async (
  axClassInfo: AXCourse,
  axTeacherProfile?: Array<AXTeacherProfile>
) => {
  logger.info(
    logMessage("start", "course", `sync course - [${axClassInfo.ClassCode}]`)
  );
  try {
    const res = await Promise.all([
      getCourseByCondition({
        center_id: axClassInfo.Center,
        name: axClassInfo.ClassCode,
      }),
      createCourseInfo(axClassInfo, axTeacherProfile),
    ]);

    const [currentCourse, courseInfo] = res;

    const course = courseInfo["data"];
    if (currentCourse?.id) {
      // update course information without classes
      course.id = currentCourse.id;
      const status = await Promise.all([updateCourse(course)]);
      if (status) {
        course.classes = currentCourse.classes;
        logger.info(
          logMessage("infor", "course", "successfully update course")
        );
      }
    } else {
      const newCourseId = await createCourse(course);
      if (newCourseId) {
        course.id = newCourseId;
        newCourseId &&
          logger.info(
            logMessage("infor", "course", `successfully create new course`)
          );
      }
    }

    logger.info(logMessage("success", "course", `done with ${course.id}`));
    InMemoryCache.set(`${course.id}`, {
      startTime: courseInfo["startTime"],
      endTime: courseInfo["endTime"],
      staffs: courseInfo["staffs"],
    });
    return course;
  } catch (error) {
    logger.error(logMessage("error", "course", (error as Error).stack ?? ""));
  }
};

export { syncCourse };
