import { rolloutClasses, RollOutClassParams } from "@/apis/_index";
import { fetchProgramConfig, getTimeOff } from "@/apis/configs.api";
import InMemoryCache from "@/lib/cache_manager";
import { AXClassSchedule, AXTeacherTA, UserRole } from "@/models/_index";
import { Course } from "@/models/courses.model";
import {
  TeacherScheduling,
  TeacherSchedulingEntry,
} from "@/models/teacher_scheduling";

import logger, { logMessage } from "@/utils/logger";

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
      // }
      // const lessonDuration = Number(lesson_duration) / 60;
      const {
        staffs = null,
        startTime = "",
        endTime = "",
      } = InMemoryCache.get(courseId!) as {
        staffs?: { [key: string]: number };
        startTime?: string;
        endTime?: string;
      };

      // Group each lesson with teacher and ta
      const axTeacherScheduling: TeacherScheduling = {};

      console.log(staffs);
      let taIndex = 1;
      axClassTeachers?.forEach((item) => {
        const {
          LessonNo = "",
          StaffCode = "",
          Role,
          Duration = "",
          From = "",
          To = "",
        } = item || {};
        const staffId = staffs?.[StaffCode] ?? 0;

        let data = axTeacherScheduling[LessonNo] || {};

        if (Object.keys(data).length == 0) {
          // reset taIndex
          taIndex = 1;
        }

        switch (Role) {
          case UserRole.Teacher:
            const time = [From || startTime, To || endTime];
            if (!data.teacher_id) {
              data.teacher_id = staffId;
              data.teacher_time_slot = time;
            } else {
              data.teacher2_id = staffId;
              data.teacher2_time_slot = time;
            }
            break;
          case UserRole.TA:
            data = {
              ...data,
              [`ta${taIndex++}_id` as keyof TeacherSchedulingEntry]: staffId,
            };
            break;
        }
        axTeacherScheduling[LessonNo] = data;
      });

      const data: RollOutClassParams = {
        id: courseId!,
        center_id: center_id!,
        teacherSchedule: axTeacherScheduling,
        lesson_duration: Number(lesson_duration),
        program,
        level,
        teacher_config: "all native",
        date_start: date_start?.toString() || "",
        schedule: JSON.parse(schedule || ""),
      };

      console.log("send data = ", JSON.stringify(data));

      const res = await rolloutClasses(data);

      console.log("----> classes ");
      console.log(res);
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
