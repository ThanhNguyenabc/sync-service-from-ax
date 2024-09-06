// ---------------------------------------------------------------------------
// ----------------------------Class API--------------------------------------
// ---------------------------------------------------------------------------

import { Class } from "@/models/_index";
import { fetcher } from "./baseApi";
import { TeacherSchedulingEntry } from "@/models/teacher_scheduling";

export type RollOutClassParams = {
  id: string;
  center_id: string;
  lesson_duration: number;
  program: string;
  level: string;
  teacher_config: string;
  date_start: string;
  schedule: { time: string; day: string }[];
  teacherSchedule: {
    [key: string]: TeacherSchedulingEntry;
  };
};
export const rolloutClasses = async (
  data: RollOutClassParams
): Promise<Array<Class> | null | undefined> => {
  const response = await fetcher<Array<Class>>("Courses_Classes_Rollout", {
    course: data,
  });

  return response.data;
};

export const createClass = async (
  data: Class
): Promise<string | null | undefined> => {
  const res = await fetcher<string>("Class_Create", {
    data,
    utc: true,
  });
  return res.data;
};

export const updateClassFields = async ({
  id,
  data,
}: {
  id: string;
  data: Class;
}): Promise<boolean | null | undefined> => {
  const res = await fetcher<string>("Class_Update_Fields", {
    id,
    data,
  });
  return res.data ? true : false;
};

export const updateMultipleClass = async (
  classes: Class[]
): Promise<boolean | null | undefined> => {
  const res = await fetcher("Class_Update", { classes });
  return res.data ? true : false;
};
