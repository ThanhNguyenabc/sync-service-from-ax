import { Request, Response } from "express";
import KafkaManager, { CourseTopic } from "@/lib/message_queue/kafka";
import { parseXMLFile } from "@/utils/xml_parser";
import { Message } from "kafkajs";
import logger, { logMessage } from "@/utils/logger";
import { Course } from "@/models/_index";
import {
  syncClassSeats,
  syncCourse,
  syncStudent,
} from "@/services/_index.service";
import ClassesService from "@/services/classes.service";
import { convertToArray } from "@/utils/array_helper";

const kafkaManager = KafkaManager.getInstance();

kafkaManager.consume(CourseTopic, async (topic: string, message: Message) => {
  try {
    const axData = await parseXMLFile(message.value?.toString() || "");

    const classInfo = axData["ClassInformation"];

    const classSchedules = convertToArray(
      axData["ClassSchedule"]?.["ClassSchedule"]
    );

    const registrations = convertToArray(
      axData["Registrations"]?.["RegistrationInfo"]
    );

    const teachers = convertToArray(axData["Teachers"]?.["TeacherProfile"]);

    const students = convertToArray(
      axData["StudentsInformation"]?.["StudentInformation"]
    );

    const lessonTeachers = convertToArray(
      axData["ClassLessonTeachersTAs"]?.["TeacherTA"]
    );

    const promiseCalls = [];
    if (classInfo) {
      promiseCalls.push(syncCourse(classInfo, teachers));
    }
    if (students.length > 0) {
      promiseCalls.push(syncStudent(students));
    }

    // SYNC COURSE AND USERS
    const results = await Promise.all(promiseCalls);
    const course = results[0] as Course | undefined;

    // SYNC CLASSES
    if (classSchedules && course) {
      const classes = await ClassesService.syncClasses(
        course,
        classSchedules,
        lessonTeachers
      );

      course.classes = classes ?? [];
    }

    // SYNC CLASSE SEATS
    if (
      course &&
      registrations &&
      Array.isArray(registrations) &&
      registrations.length > 0
    ) {
      syncClassSeats({ course, axRegistrations: registrations });
    }
  } catch (error) {
    logger.error(logMessage("error", "course-xml", `${error}`));
  }
});

const handleCourseXMLFromAX = async (req: Request, res: Response) => {
  try {
    const xmlData: string | undefined | null = req.body["data"] || "";

    if (!xmlData || xmlData.length == 0) {
      return res.status(400).json({
        status: 400,
        message: "Data is not valid",
      });
    }

    await kafkaManager.produce(CourseTopic, [
      { key: "xml-data", value: req.body["data"] || "" },
    ]);

    return res.status(200).json({
      status: 200,
      message: "Received data successfully",
    });
  } catch (error) {
    logger.error(`❌ [route controller] --> ${error}`);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
};

export { handleCourseXMLFromAX };
