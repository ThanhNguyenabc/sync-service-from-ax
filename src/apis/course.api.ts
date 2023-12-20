// --------------------------------------------------------------------------------
// ----------------------------Course API------------------------------------------
// --------------------------------------------------------------------------------

import { Course } from "@/models/_index";
import { fetcher } from "./baseApi";

export const getCourseByCondition = async (condition: {}): Promise<
  Course | null | undefined
> => {
  try {
    const response = await fetcher<Course>("Courses_Check_Exist", {
      search: condition,
    });
    return response.data;
  } catch (error) {}
  return null;
};

export const addStudentsToCourse = async ({
  id,
  students,
  options = {
    checkseats: false,
  },
}: {
  id: string;
  students: Array<{ student_id: string; date_from: string }>;
  options?: {};
}) => {
  const data = {
    id,
    students,
    amount: 0,
    options,
  };
  try {
    await fetcher("Courses_MultipleStudents_Add", data);
    return true;
  } catch (error) {}
  return false;
};

export const removeStudentsFromCourse = async ({
  id,
  students,
}: {
  id: string;
  students: Array<string>;
}) => {
  const data = {
    id,
    students,
  };
  try {
    await fetcher("Courses_Students_RemoveList", data);
    return true;
  } catch (error) {
    return false;
  }
};

export const createCourse = async (
  data: Course
): Promise<string | null | undefined> => {
  try {
    const response = await fetcher<string>("Courses_New", { data });
    return response.data;
  } catch (error) {}
  return null;
};

export const updateCourse = async (data: Course) => {
  try {
    const response = await fetcher("Courses_Update", { course: data });
    return response.data;
  } catch (error) {}
  return null;
};
