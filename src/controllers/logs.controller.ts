import { Request, Response } from "express";
import moment from "moment";
import fs from "fs/promises";
import path from "path";

class LogController {
  async getLogs(req: Request, res: Response) {
    const date = req.body["data"] || {};

    try {
      const formattedTime = moment(date, "YYYY-MM-DD").format("YYYY-MM-DD");
      const fileName = `sync-service.log.${formattedTime}`;
      const logs = await fs.readFile(
        path.join(path.resolve("logs"), fileName),
        {
          encoding: "utf8",
        }
      );
      return res.status(200).json({
        date: formattedTime,
        file: fileName,
        data: logs,
      });
    } catch (error) {
      return res.status(500).json({
        error: `No found file on ${date}`,
      });
    }
  }
}

export default new LogController();
