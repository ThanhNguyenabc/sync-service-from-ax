export interface AXCourse {
  ClassCode?: string;
  ClassName?: string;
  ClassGroup?: string;
  ProgrammeName?: string;
  LevelId?: string;
  Module?: string;
  ClassStatus?: string;
  Days?: string;
  StartTime?: string;
  EndTime?: string;
  MaxAttendant?: string;
  Room?: string;
  StartDate?: string;
  EndDate?: string;
  CourseTemplate?: string;
  Center?: string;
}

export const ClassStatusMapping = {
  "1": "Brand new",
  "2": "Next class",
  "3": "On going",
  "4": "Finished",
  "5": "Cancelled",
};
