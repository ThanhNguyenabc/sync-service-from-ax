import express from "express";
import { handleXmlFile } from "../controllers";
const router = express.Router();

router.post("/parse-xml", handleXmlFile);
export default router;
