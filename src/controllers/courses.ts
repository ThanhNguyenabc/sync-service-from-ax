import { generateSchedule, getHourMinuteFromString } from "../utils/date_utils";
import { AXCourse, AXTeacherProfile, Course } from "../models";
import dayjs from "dayjs";
import {
  createCourse,
  getCourseByCondition,
  getUsers,
  updateCourse,
} from "../apis";
import logger from "../utils/logger";

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

  const program = `${axClassInfo.ProgrammeName} ${
    Number(lesson_duration) / 60
  } hours`;

  const course: Course = {
    name: axClassInfo.ClassCode,
    center_id: axClassInfo.Center,
    program: program,
    level: level.toUpperCase(),
    lesson_duration: `${lesson_duration}`,
    seats: Number(axClassInfo.MaxAttendant || 0),
    room: axClassInfo.Room,
    teacher_config: "all native",
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
  if (axTeacherProfile && axTeacherProfile.length > 0) {
    const userIds = axTeacherProfile.reduce((result, item) => {
      if (item.StaffCode) result.push(item.StaffCode);
      return result;
    }, [] as string[]);

    const users = userIds.length > 0 ? await getUsers(userIds) : null;
    if (users) {
      let staff: { [key: string]: any } = {};

      let no = 1;
      users.forEach((item) => {
        let key = "";
        switch (item.role) {
          case "teacher":
            key = "teacher_id";
            break;
          case "ta":
            key = `ta${no}_id`;
            no += 1;
            break;
        }

        staff[key] = item.id;
      });
      course.staff = JSON.stringify({ staff });
    }
  }
  return course;
};

const syncCourse = async (axClassInfo: AXCourse) => {
  logger.info("🚀 [course]: sync course");

  try {
    const res = await Promise.all([
      getCourseByCondition({
        center_id: axClassInfo.Center,
        name: axClassInfo.ClassCode,
      }),
      createCourseInfo(axClassInfo),
    ]);

    const [currentCourse, course] = res;

    if (currentCourse?.id) {
      // update course information
      course.id = currentCourse.id;
      course.classes = currentCourse.classes;
      const status = await Promise.all([updateCourse(course)]);
      status && logger.info(`[course] update successfully`);
    } else {
      course.status = "design";
      const newCourseId = await createCourse(course);
      course.id = newCourseId;
      newCourseId && logger.info(`[course] create new course successfully`);
    }

    logger.info(`✅ [course] done with ${course.id}`);
    return course;
  } catch (error) {
    logger.error(`❌ [course] error --> ${error}`);
  }
};

export { syncCourse };
