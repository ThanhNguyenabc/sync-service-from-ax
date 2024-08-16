export type TeacherSchedulingEntry = {
  teacherId?: number;
  taIds?: {
    [key: string]: number;
  };
  taCount: number;
};

export type TeacherScheduling = {
  [key: string]: TeacherSchedulingEntry;
};
