import { handleCourseXMLFromAX, syncPlacementTest } from "@/controllers/_index";
import express from "express";

const router = express.Router();
router.post("/parse-xml", handleCourseXMLFromAX);
router.post("/placement-test", syncPlacementTest);

export default router;
