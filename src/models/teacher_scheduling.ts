export type TeacherSchedulingEntry = {
  teacher_id: number;
  teacher_time_slot: string[];
  teacher2_id: number;
  teacher2_time_slot: string[];
  ta1_id: number | null;
  ta2_id: number | null;
  ta3_id: number | null;
};

export type TeacherScheduling = {
  [key: string]: TeacherSchedulingEntry;
};
