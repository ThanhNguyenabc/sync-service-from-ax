// ---------------------------------------------------------------------------
// ----------------------------Configs API---------------------------------------
// ---------------------------------------------------------------------------

import InMemoryCache from "@/lib/cache_manager";
import { fetcher } from "./baseApi";

export const fetchProgramConfig = async (): Promise<
  object | undefined | null
> => {
  try {
    const programme = InMemoryCache.get("programme");
    if (programme) {
      return programme;
    }
    const response = await fetcher<object>("Ini_File_Read", {
      filename: "partners/default/programs.cfg",
    });
    const data = response.data;
    InMemoryCache.set("programme", data);
    return data;
  } catch (error) {}
  return null;
};
