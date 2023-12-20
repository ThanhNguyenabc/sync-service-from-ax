import { AXStudentProfile } from "./ax_student_profile";
import { AXTeacherProfile } from "./ax_teacher_profile.model";

export type AXPlacementTest = {
  ID: string;
  StudentCode: string;
  PersonnelNumber?: string;
  Center?: string;
  User?: string;
  Name?: string;
  Email?: string;
  Note?: string;
  PTStatus?: number;
};

export type AXPlacementTestInfor = {
  StudentInformation?: AXStudentProfile;
  TeacherProfile?: AXTeacherProfile;
  PlacementTest?: AXPlacementTest;
};
