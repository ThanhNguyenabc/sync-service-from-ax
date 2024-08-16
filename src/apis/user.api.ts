// ---------------------------------------------------------------------------
// ----------------------------User API---------------------------------------
// ---------------------------------------------------------------------------

import { User } from "@/models/_index";
import { fetcher } from "./baseApi";

export const getUsers = async (
  staffcodes: Array<string>
): Promise<Array<User> | null | undefined> => {
  const response = await fetcher<Array<User>>("User_List_By_StaffCode", {
    staffcodes: staffcodes,
  });

  return response.data || [];
};

export const updateUsers = async (
  users: User[]
): Promise<boolean | undefined | null> => {
  const response = await fetcher<boolean>("Users_Update", {
    data: users,
  });
  return response.data || false;
};

export const createUsers = async (
  users: User[]
): Promise<User[] | null | undefined> => {
  const res = await fetcher<User[]>("Users_Create", { data: users });
  return res.data || null;
};
