import { createLogger, format, transports } from "winston";
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
    new transports.File({
      filename: "logs/xml-sync-service.log",
    }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(new transports.Console({}));
}

export default logger;
