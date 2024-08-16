import { getLessonOutcomes, rolloutClasses } from "@/apis/_index";
import { fetchProgramConfig, getTimeOff } from "@/apis/configs.api";
import InMemoryCache from "@/lib/cache_manager";
import { AXClassSchedule, AXTeacherTA, Class, UserRole } from "@/models/_index";
import { Course } from "@/models/courses.model";
import { TeacherScheduling } from "@/models/teacher_scheduling";
import {
  Courses_Classes_Calendar,
  getDurationFromLesson,
} from "@/utils/class_helper";
import logger, { logMessage } from "@/utils/logger";
import moment from "moment";

export default class ClassesService {
  static async getAllTimeoff(centerId: string) {
    // get Time off
    const [globalTimeOff, centerTimeOff] = await Promise.all([
      getTimeOff({ type: "global", value: "global" }),
      getTimeOff({
        type: "center",
        value: centerId ?? "",
      }),
    ]);
    return [...globalTimeOff, ...centerTimeOff];
  }

  static async getProgramConfig(axProgram: string) {
    const programConfig = await fetchProgramConfig();
    const programme = programConfig?.[axProgram as keyof typeof programConfig];
    return programme;
  }

  static syncClasses = async (
    course: Course,
    axClassSchedule: Array<AXClassSchedule>,
    axClassTeachers?: Array<AXTeacherTA>
  ) => {
    logger.info(logMessage("start", "classes", "sync classes"));
    try {
      let {
        id: courseId,
        program = "",
        level = "",
        classes = [],
        schedule,
        lesson_duration,
        center_id = "",
        date_start,
      } = course;

      const programme = await this.getProgramConfig(program);

      let lessons =
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
      const lessonDuration = Number(lesson_duration) / 60;
      const { staffs = null } = InMemoryCache.get(courseId!) as {
        staffs?: { [key: string]: number };
      };
      const timeoff = await this.getAllTimeoff(center_id);

      // Generate calendar
      const now = moment().format("YYYYMMDDHHmm");
      console.log("time now --> ", now);
      const currentClasses = classes;
      let pastClasses: Class[] = [];
      const pastLessonDuration: { [key: string]: number } = {};
      let remainingSession = null;

      //GET ALL PAST CLASSES
      currentClasses?.forEach((item) => {
        const { date_start, lesson_id = "", duration = 0 } = item || {};
        if (`${date_start}` >= now) return;
        pastClasses.push(item);
        pastLessonDuration[lesson_id] =
          Number(pastLessonDuration[lesson_id] ?? 0) + Number(duration / 60);
      });

      if (pastClasses.length > 0) {
        const nextClass = currentClasses[pastClasses.length];
        const pastClass = pastClasses[pastClasses.length - 1];
        let currLessonIdx = lessons.indexOf(pastClass.lesson_id ?? "");
        const isSameLesson =
          nextClass && nextClass["lesson_id"] == pastClass["lesson_id"];

        date_start = nextClass?.["date_start"] ?? parseInt(now, 10);

        if (!isSameLesson) {
          currLessonIdx++;
        }
        lessons = lessons.slice(currLessonIdx);
        const firstLesson = lessons[0];
        remainingSession =
          getDurationFromLesson(firstLesson) -
          (pastLessonDuration[firstLesson] ?? 0);
      }

      const lessonOutcomes = await getLessonOutcomes(program, level);
      const startDate = moment(`${date_start}`, "YYYYMMDD");

      const calendar = Courses_Classes_Calendar(
        startDate,
        JSON.parse(schedule!),
        lessons,
        lessonDuration,
        timeoff,
        lessonOutcomes,
        lessonDuration,
        remainingSession
      );

      // Group each lesson with teacher and ta
      const axTeacherScheduling: TeacherScheduling = {};
      axClassTeachers?.forEach((item) => {
        const { LessonNo = "", StaffCode = "", Role } = item || {};
        const staffId = staffs?.[StaffCode] ?? 0;
        let {
          teacherId = undefined,
          taIds = {},
          taCount = 0,
        } = axTeacherScheduling[LessonNo] || {};

        if (Role == UserRole.Teacher) {
          teacherId = staffId;
        } else if (Role == UserRole.TA) {
          taIds = { ...taIds, [`ta${taCount + 1}_id`]: staffId };
          taCount++;
        }
        axTeacherScheduling[LessonNo] = {
          teacherId,
          taIds,
          taCount: taCount,
        };
      });

      let j = 0;
      const newClasses: any[] = [...pastClasses];

      console.log("calendar");
      console.log(calendar);
      for (const item of calendar) {
        let date = moment(item["date"], "YYYYMMDDHHmm");
        const axClass = axClassSchedule[j];
        if (axClass && axClass.LessonNo) {
          const lessonNo = axClass.LessonNo;
          for (const slot of item["session"]) {
            const { teacherId, taIds } =
              axTeacherScheduling?.[
                lessonNo as keyof typeof axTeacherScheduling
              ] ?? {};
            const lesson_id = slot["lesson"];
            const duration = slot["duration"] * 60;
            const date_start = date;
            const date_end = date_start.clone().add(duration, "minutes");
            newClasses.push({
              date_start: date_start.format("YYYYMMDDHHmm"),
              date_end: date_end.format("YYYYMMDDHHmm"),
              teacher_type: "native",
              classroom_id: course.room,
              outcomes: slot["outcomes"],
              lesson_id,
              duration,
              teacher_id: teacherId ?? null,
              ...taIds,
            });
            date = date_end;
          }
        }
        j++;
      }

      const data = {
        courseId: courseId!,
        center: center_id!,
        classes: newClasses,
      };

      console.log("data");
      console.log(data);
      const res = await rolloutClasses(data);
      res && res!.length > 0
        ? logger.info(logMessage("success", "classes", "sync successfully"))
        : logger.error(logMessage("error", "classes", "sync fail"));

      return res;
    } catch (error) {
      logger.error(
        logMessage("error", "classes", (error as Error).stack || "")
      );
    }
    return [];
  };
}
