import { ClassSeat } from "@/models/class_seat.model";
import { fetcher } from "./baseApi";

export const createClassSeat = async ({
  classId,
  data,
}: {
  classId: string;
  data: ClassSeat;
}): Promise<string | null | undefined> => {
  try {
    const res = await fetcher<string>("Class_Seat_Add", {
      class_id: classId,
      data,
    });
    return res.data;
  } catch (error) {}
  return null;
};

export const updateClassSeatFieldsByClass = async ({
  classId,
  data,
}: {
  classId: string;
  data: ClassSeat;
}): Promise<boolean | null | undefined> => {
  try {
    await fetcher<string>("Class_Seat_Update_Fields_ByClass", {
      classId,
      data,
    });
    return true;
  } catch (error) {}
  return false;
};
