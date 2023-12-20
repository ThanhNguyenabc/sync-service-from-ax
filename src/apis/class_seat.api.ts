import { ClassSeat } from "@/models/class_seat.model";
import { fetcher } from "./baseApi";

const createClassSeat = async ({
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

export { createClassSeat };
