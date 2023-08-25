import winston from "winston";

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      eol: "\r\n",
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),

    new winston.transports.File({
      eol: "\r\n",
      filename: "logs/xml-sync-service.log",
      format: winston.format.combine(
        winston.format.timestamp({
          format: "YYYY-MM-DD HH:mm",
        }),
        winston.format.json()
      ),
    }),
  ],
});

export default logger;
