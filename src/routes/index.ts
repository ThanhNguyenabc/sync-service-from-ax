import { handleCourseXMLFromAX, syncPlacementTest } from "@/controllers/_index";
import express from "express";

const router = express.Router();
router.post("/parse-xml", handleCourseXMLFromAX);
router.post("/placement-tests", syncPlacementTest);

export default router;
