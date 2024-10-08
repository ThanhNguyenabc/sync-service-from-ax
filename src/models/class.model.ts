export enum ClassType {
  "placement" = "placement",
  "standard" = "standard",
}

export interface Class {
  id?: number;
  type?: string;
  online?: number;
  date_start?: number;
  duration?: number;
  date_end?: number;
  course_id?: number;
  center_id?: string;
  classroom_id?: string;
  classroom_url?: string;
  project_id?: number;
  lesson_id?: string;
  teacher_id?: number | string;
  teacher_type?: string;
  ta1_id?: number;
  ta2_id?: number;
  ta3_id?: number;
  seats_total?: number;
  seats_taken?: number;
  state?: string;
  notes?: string;
  outcomes?: string[];
  classroom_data?: string;
  classroom_currentslide?: number;
}
