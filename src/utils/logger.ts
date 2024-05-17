import { createLogger, format, transports } from "winston";
import "winston-daily-rotate-file";

const { errors, printf } = format;

const customFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}]  ${level}: ${message}`;
});

const logger = createLogger({
  format: format.combine(
    errors({ stack: true }),
    format.timestamp({
      format: "YYYY-MM-DD HH:mm",
    }),
    customFormat,
    format.colorize()
  ),
  transports: [
    new transports.DailyRotateFile({
      filename: "logs/xml-sync-service.log",
      datePattern: "YYYY-MM-DD-HH",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "7d",
    }),
  ],
});

if (process.env.NODE_ENV === "development") {
  logger.add(new transports.Console({}));
}

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

export default logger;
