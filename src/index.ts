import express from "express";
import bodyParser from "body-parser";
import router from "@/routes";
import { getAppConfig } from "@/config/app_configs";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import cluster from "cluster";
import { cpus } from "os";
import logger, { logMessage } from "@/utils/logger";
import KafkaManager from "./lib/message_queue/kafka";
import path from "path";

dayjs.extend(customParseFormat);

const os = cpus().length;

const createApplication = () => {
  const app = express();
  app.use(express.static(path.join(__dirname, "public")));
  app.use(bodyParser.json({ limit: "50mb" }));
  app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
  app.use("/", router);
  const CONFIG = getAppConfig();

  app.listen(CONFIG["PORT"], async () => {
    // init kafaka
    KafkaManager.getInstance();
    console.log(`Server started on host : ${CONFIG["HOST"]}:${CONFIG["PORT"]}`);
  });

  process.on("uncaughtException", (error) => {
    logger.error(logMessage("error", "app error", error.stack));
  });
};

if (cluster.isPrimary && process.env.NODE_ENV === "production") {
  for (let i = 0; i < os; i++) {
    cluster.fork();
  }
  cluster.on("exit", (worker) => {
    console.log(`The Worker number: ${worker.id} has died`);
  });
} else {
  createApplication();
}
