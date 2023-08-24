import { Class } from "./class.model";

export interface Course {
  id?: string;
  name?: string;
  status?: string;
  center_id?: string;
  program?: string;
  level?: string;
  lesson_duration?: string;
  teacher_config?: string;
  date_start?: number;
  date_end?: number;
  notes?: string;
  seats?: number;
  room?: string;
  schedule?: string;
  classes?: Array<Class>;
  staff?: string;
  students?: string;
}
