// ---------------------------------------------------------------------------
// ----------------------------User API---------------------------------------
// ---------------------------------------------------------------------------

import { User } from "@/models/_index";
import { fetcher } from "./baseApi";

export const getUsers = async (
  staffcodes: Array<string>
): Promise<Array<User> | null | undefined> => {
  try {
    const response = await fetcher<Array<User>>("User_List_By_StaffCode", {
      staffcodes: staffcodes,
    });

    return response.data;
  } catch (error) {}
  return [];
};

export const updateUsers = async (
  users: User[]
): Promise<boolean | undefined | null> => {
  try {
    const response = await fetcher<boolean>("Users_Update", {
      data: users,
    });
    return response.data;
  } catch (error) {}
  return false;
};

export const createUsers = async (
  users: User[]
): Promise<User[] | null | undefined> => {
  try {
    const res = await fetcher<User[]>("Users_Create", { data: users });
    return res.data;
  } catch (error) {
  }
  return null;
};
