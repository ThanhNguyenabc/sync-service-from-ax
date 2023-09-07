export interface AXTeacherProfile {
  FirstName?: string;
  MiddleName?: string;
  LastName?: string;
  Email?: string;
  UserName?: string;
  Role?: "Teacher" | "TA";
  Active: "Yes" | "No";
  StaffCode?: string;
}
