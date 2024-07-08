import { getAppConfig } from "@/config/app_configs";
import { createLogger, format, transports } from "winston";
import "winston-daily-rotate-file";
import LokiTransport from "winston-loki";

const { errors, printf } = format;

const LOKI_URL = "http://host.docker.internal:3100";

const customFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}]  ${level}: ${message}`;
});

const ICONS = {
  error: "❌",
  infor: "👉",
  start: "🚀",
  success: "✅",
};

export const logMessage = (
  type: "error" | "infor" | "start" | "success",
  tag: string,
  message: string = ""
) => {
  return `${ICONS[type as keyof typeof ICONS]} [${tag}] --> ${message}`;
};

const logger = createLogger({
  format: format.combine(
    errors({ stack: true }),
    format.timestamp({
      format: "YYYY-MM-DD HH:mm",
    }),
    format.json(),
    format.colorize()
  ),
  transports: [
    new LokiTransport({
      host: LOKI_URL,
    }),
  ],
});

const configs = getAppConfig();
const env = process.env.NODE_ENV || "development";
switch (env) {
  case "staging":
  case "production":
    logger.add(
      new LokiTransport({
        host: LOKI_URL,
        labels: {
          env: env,
          lms_url: configs.LMS_API_URL,
        },
      })
    );
    logger.add(
      new transports.DailyRotateFile({
        filename: "logs/sync-service.log",
        datePattern: "YYYY-MM-DD",
        maxSize: "20m",
        maxFiles: "7d",
      })
    );
    break;
  default:
    logger.add(
      new LokiTransport({
        host: LOKI_URL,
        labels: {
          env: env,
          lms_url: configs.LMS_API_URL,
        },
      })
    );
    logger.add(new transports.Console({ format: customFormat }));
    break;
}

export default logger;
