// ---------------------------------------------------------------------------
// ----------------------------Configs API---------------------------------------
// ---------------------------------------------------------------------------

import InMemoryCache from "@/lib/cache_manager";
import { fetcher } from "./baseApi";
import { TimeOff } from "@/models/timeoff.model";

export const fetchProgramConfig = async (): Promise<
  object | undefined | null
> => {
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
};

export const getTimeOff = async ({
  type,
  value,
}: {
  type: string;
  value: string;
}): Promise<Array<TimeOff> | []> => {
  const response = await fetcher<Array<TimeOff>>("Timeoff_Read", {
    value,
    type,
  });
  const data = response.data;
  return data || [];
};
