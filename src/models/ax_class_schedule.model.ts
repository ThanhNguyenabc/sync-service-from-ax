export interface AXClassSchedule {
  LessonDate?: string;
  LessonNo: number;
  From?: string;
  To?: string;
  LessonStatus: "Open" | "Cancelled";
}
