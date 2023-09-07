import express from "express";
import { convertXmlFile } from "../controllers";
const router = express.Router();

router.post("/parse-xml", convertXmlFile);
export default router;
