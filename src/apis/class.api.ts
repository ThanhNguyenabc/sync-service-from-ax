// ---------------------------------------------------------------------------
// ----------------------------Class API--------------------------------------
// ---------------------------------------------------------------------------

import { Class } from "@/models/_index";
import { fetcher } from "./baseApi";

export const rolloutClasses = async ({
  courseId,
  center,
  classes,
}: {
  courseId: string;
  center: string;
  classes: Array<any>;
}): Promise<Array<Class> | null | undefined> => {
  try {
    const response = await fetcher<Array<Class>>("Courses_Rollout", {
      id: courseId,
      center,
      classes,
    });

    return response.data;
  } catch (error) {
    console.log(error);
  }
  return null;
};

export const createClass = async (
  data: Class
): Promise<string | null | undefined> => {
  try {
    const res = await fetcher<string>("Class_Create", data);
    return res.data;
  } catch (error) {}
  return null;
};

export const getClassesByCourse = (courseId: number) => {
  try {
  } catch (error) {}
};