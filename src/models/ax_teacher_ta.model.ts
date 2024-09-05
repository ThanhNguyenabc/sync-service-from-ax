import { UserRole } from "./user.model";

export interface AXTeacherTA {
  LessonNo: string;
  Role: UserRole;
  StaffCode: string;
  Duration: string;
  From?: string;
  To?: string;
}
