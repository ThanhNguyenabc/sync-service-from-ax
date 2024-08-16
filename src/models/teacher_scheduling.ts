export type TeacherSchedulingEntry = {
  teacherId?: number;
  taIds?: number[];
};

export type TeacherScheduling = {
  [key: string]: TeacherSchedulingEntry;
};
