import logger from "../utils/logger";
import { getAppConfig } from "../config/app_configs";
import { Class, Course, User } from "../models";
import axios from "axios";
import InMemoryCache from "../lib/cache_manager";

const BASE_URL = getAppConfig()["LMS_API_URL"];

const fetcher = async (
  fName: string,
  data: any
): Promise<{
  status: number;
  data: any;
}> => {
  logger.info(`👉 [api] send function's name: ${fName}`);
  try {
    const response = await axios.post(BASE_URL, data, {
      params: {
        f: fName,
        nologin: "true",
        timezone: "Asia/Bangkok",
      },
    });

        if (
      typeof response.data === "string" &&
      response.data.indexOf("Fatal error") >= 0
    ) {
      logger.error(`❌ [api] f=${fName} error --> ${response.data}`);
    }
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
        logger.error(`❌ [api] f=${fName} error --> ${error}`);

    return {
      status: 0,
      data: null,
    };
  }
};

// ---------------------------------------------------------------------------

// ----------------------------Course API-------------------------------------
// ---------------------------------------------------------------------------

export const getCourseByCondition =
  async (condition: {}): Promise<Course | null> => {
    try {
      const response = await fetcher("Courses_Check_Exist", {
        search: condition,
      });
      return response.data;
    } catch (error) {}
    return null;
  };

export const createCourse = async (
  data: Course
): Promise<string | undefined> => {
  try {
    const response = await fetcher("Courses_New", { data });
    return response.data;
  } catch (error) {}
  return undefined;
};

export const updateCourse = async (data: Course) => {
  try {
    const response = await fetcher("Courses_Update", { course: data });
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
    const response = await fetcher("Courses_MultipleStudents_Add", data);
    return true;
  } catch (error) {}
  return false;
};

// ---------------------------------------------------------------------------
// ----------------------------Class API--------------------------------------
// ---------------------------------------------------------------------------

export const rolloutClasses = async ({
  courseId,
  center,
  classes,
}: {
  courseId: string;
  center: string;
  classes: Array<any>;
}): Promise<Array<Class> | null> => {
  try {
    const response = await fetcher("Courses_Rollout", {
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

export const getClassesByCourse = (courseId: number) => {
  try {
  } catch (error) {}
};

// ---------------------------------------------------------------------------
// ----------------------------User API---------------------------------------
// ---------------------------------------------------------------------------

export const getUsers = async (
  staffcodes: Array<string>
): Promise<Array<User> | null> => {
  try {
    const response = await fetcher("User_List_By_StaffCode", {
      staffcodes: staffcodes,
    });

    return response.data;
  } catch (error) {}
  return null;
};

export const updateUsers = async (users: Array<User>): Promise<boolean> => {
  try {
    const response = await fetcher("Users_Update", {
      data: users,
    });
    return response.data;
  } catch (error) {}
  return false;
};

export const createUsers = async (users: Array<User>): Promise<boolean> => {
  try {
    const response = await fetcher("Users_Create", { data: users });
    return response.data;
  } catch (error) {
    console.log(error);
  }
  return false;
};

// ---------------------------------------------------------------------------
// ----------------------------Configs API---------------------------------------
// ---------------------------------------------------------------------------

export const fetchProgramConfig = async () => {
  try {
    const programme = InMemoryCache.get("programme");
    if (programme) {
      return programme;
    }
    const response = await fetcher("Ini_File_Read", {
      filename: "partners/default/programs.cfg",
    });
    const data = response.data;
    InMemoryCache.set("programme", data);
    return data;
  } catch (error) {}
  return null;
};
