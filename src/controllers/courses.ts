import { generateSchedule, getHourMinuteFromString } from "../utils/date_utils";
import { AXCourse, Course } from "../models";
import dayjs from "dayjs";
import { createCourse, getCourseByCondition, updateCourse } from "../apis";
import logger from "../utils/logger";

const createCourseInfo = (axClassInfo: AXCourse) => {
  const startTime = getHourMinuteFromString(axClassInfo.StartTime || "");
  const endTime = getHourMinuteFromString(axClassInfo.EndTime || "");

  const startDate = dayjs(axClassInfo.StartDate);
  const endDate = dayjs(axClassInfo.EndDate);

  const isHaveCambridge =
    axClassInfo.CourseTemplate?.toLowerCase().includes("cam");
  let level = `${axClassInfo.LevelId}-${axClassInfo.Module}`;

  if (isHaveCambridge) {
    level = `${level}-CAM`;
  }
  level.toUpperCase();

  const course: Course = {
    name: axClassInfo.ClassCode,
    center_id: axClassInfo.Center,
    program: axClassInfo.ProgrammeName,
    level: level,
    lesson_duration: (
      dayjs(`${axClassInfo.StartDate} ${endTime.hour}:${endTime.minute}`).diff(
        dayjs(`${axClassInfo.StartDate} ${startTime.hour}:${startTime.minute}`)
      ) / 60000
    ).toString(),
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

  return course;
};

const syncCourse = async (axClassInfo: AXCourse) => {
  logger.info("start sync course");
  try {
    const currentCourse = await getCourseByCondition({
      center_id: axClassInfo.Center,
      name: axClassInfo.ClassCode,
    });

    const course = createCourseInfo(axClassInfo);

    if (currentCourse?.id) {
      // update course information
      course.id = currentCourse.id;
      course.classes = currentCourse.classes;
      const status = await Promise.all([updateCourse(course)]);
      status &&
        logger.info(`update course successfully with course-id: ${course.id}`);
    } else {
      course.status = "desgin";
      const newCourseId = await createCourse(course);
      course.id = newCourseId;
      logger.info(
        `create course successfully with new course-id: ${newCourseId}`
      );
    }
    return course;
  } catch (error) {
    logger.error(`sync course error --> ${error}`);
  }
  logger.info("done sync course");
};

export { syncCourse };
