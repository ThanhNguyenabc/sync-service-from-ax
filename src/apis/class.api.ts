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
  } catch (error) {}
  return null;
};

export const createClass = async (
  data: Class
): Promise<string | null | undefined> => {
  try {
    const res = await fetcher<string>("Class_Create", {
      data,
      utc: true,
    });
    return res.data;
  } catch (error) {}
  return null;
};

export const updateClassFields = async ({
  id,
  data,
}: {
  id: string;
  data: Class;
}): Promise<boolean | null | undefined> => {
  try {
    await fetcher<string>("Class_Update_Fields", {
      id,
      data,
    });
    return true;
  } catch (error) {}
  return false;
};

export const updateMultipleClass = async (
  classes: Class[]
): Promise<boolean | null | undefined> => {
  try {
    await fetcher("Class_Update", { classes });
    return true;
  } catch (error) {}
  return false;
};
