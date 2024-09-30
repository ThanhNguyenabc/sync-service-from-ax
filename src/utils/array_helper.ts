export const convertToArray = (
  data: Array<unknown> | Object | null | undefined
) => {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
};
