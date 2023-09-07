import { Request, Response } from "express";
import KafkaManager, { kafka_xml_topic } from "../lib/message_queue/kafka";
import { parseXMLFile } from "../utils/xml_parser";
import { Message } from "kafkajs";
import logger from "../utils/logger";
import { syncStudent } from "./users";
import { syncCourse } from "./courses";
import { syncClassSeats, syncClasses } from "./classes";
import { Course } from "models";

const kafka = new KafkaManager();

const handleMessage = async (message: Message) => {
    try {
    const axData = await parseXMLFile(message.value?.toString() || "");

    const classInfo = axData["ClassInformation"];
    const classSchedules = axData["ClassSchedule"]?.["ClassSchedule"];
    const registrations = axData["Registrations"]?.["RegistrationInfo"];
    const lessonTeachers = axData["ClassLessonTeachersTAs"]?.["TeacherTA"];
    const students = axData["StudentsInformation"]?.["StudentInformation"];

    const promiseCalls = [];
    if (classInfo) {
      promiseCalls.push(syncCourse(classInfo));
    }
    if (students) {
      promiseCalls.push(syncStudent(students));
    }

    // SYNC COURSE AND USERS
    const results = await Promise.all(promiseCalls);
    const course = results[0] as Course | undefined;

    // SYNC CLASSES
    if (course && classSchedules) {
      const classes = await syncClasses(course, classSchedules, lessonTeachers);
      course.classes = classes || [];
    }

    // SYNC CLASSE SEATS
    if (course && registrations) {
      syncClassSeats({ course, axRegistrations: registrations });
    }
  } catch (error) {
    logger.error(`❌ [handling message] --> ${error}`);
  }
};

kafka.consume(kafka_xml_topic, handleMessage);

const convertXmlFile = async (req: Request, res: Response) => {
  try {
    const xmlData: string | undefined | null = req.body["data"] || "";
    if (!xmlData || xmlData.length == 0) {
      return res.status(400).json({
        status: 400,
        message: "Data is not valid",
      });
    }
    await kafka.produce(kafka_xml_topic, [
      { key: "xml-data", value: req.body["data"] || "" },
    ]);

    return res.status(200).json({
      status: 200,
      message: "Received xml-data successfully",
    });
  } catch (error) {
    logger.error(`❌ [route controller] --> ${error}`);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
};

export { convertXmlFile };
