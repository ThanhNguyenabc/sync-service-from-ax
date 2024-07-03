import { handleCourseXMLFromAX, syncPlacementTest } from "@/controllers/_index";
import logsController from "@/controllers/logs.controller";
import express from "express";

const router = express.Router();
router.post("/parse-xml", handleCourseXMLFromAX);
router.post("/placement-tests", syncPlacementTest);
router.post("/logs", logsController.getLogs);

export default router;
