import { PlacementTest } from "@/models/placement_test.model";
import { fetcher } from "./baseApi";

export const insertPlacementTest = async (
  data: PlacementTest
): Promise<string | null | undefined> => {
  try {
    const res = await fetcher<string>("PlacementTest_Add", { data });
    return res.data;
  } catch (error) {}
  return null;
};

export const getPlacementTest = async (
  placementTestId: string
): Promise<PlacementTest | null | undefined> => {
  try {
    const res = await fetcher<PlacementTest>("PlacementTest_Get", {
      placementTestId,
    });
    return res.data;
  } catch (error) {}
  return null;
};

export const updatePlacementTest = async (
  placementTestId: string,
  data: PlacementTest
): Promise<string | null | undefined> => {
  try {
    const res = await fetcher<string>("PlacementTest_Update", {
      placementTestId,
      data,
    });
    return res.data;
  } catch (error) {}
  return null;
};
