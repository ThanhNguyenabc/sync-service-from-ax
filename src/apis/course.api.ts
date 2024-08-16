// --------------------------------------------------------------------------------
// ----------------------------Course API------------------------------------------
// --------------------------------------------------------------------------------

import { Class, Course } from "@/models/_index";
import { fetcher } from "./baseApi";
import { LessonOutcome } from "@/models/lesson_outcome.model";

export const getCourseByCondition = async (condition: {}): Promise<
  Course | null | undefined
> => {
  const response = await fetcher<Course>("Courses_Check_Exist", {
    search: condition,
  });
  return response.data;
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
  const res = await fetcher<boolean>("Courses_MultipleStudents_Add", {
    id,
    students,
    amount: 0,
    options,
  });
  return res.data;
};

export const removeStudentsFromCourse = async ({
  id,
  students,
}: {
  id: string;
  students: Array<string>;
}) => {
  const res = await fetcher("Courses_Students_RemoveList", {
    id,
    student_ids: students,
  });
  return res.data;
};

export const createCourse = async (
  data: Course
): Promise<string | null | undefined> => {
  const response = await fetcher<string>("Courses_New", { data });
  return response.data;
};

export const updateCourse = async (data: Course) => {
  const response = await fetcher("Courses_Update", { course: data });
  return response.data;
};

export const getCourseById = async (
  courseId: string
): Promise<Course | undefined | null> => {
  const res = await fetcher<Course>("Courses_Read", {
    id: courseId,
  });
  return res.data;
};

export const updateClassesByCourse = async (
  courseId: string,
  classes: Class[]
): Promise<boolean | undefined | null> => {
  const res = await fetcher<boolean>("Courses_Update_Classes", {
    id: courseId,
    classes,
  });
  return res.data;
};

export const getLessonOutcomes = async (program: string, level: string) => {
  const res = await fetcher<LessonOutcome>("Course_List_Outcome", {
    program,
    level,
  });
  return res.data;
};
