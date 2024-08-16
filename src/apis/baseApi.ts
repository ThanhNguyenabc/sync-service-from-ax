import logger from "@/utils/logger";
import { getAppConfig } from "@/config/app_configs";
import axios from "axios";

const BASE_URL = getAppConfig()?.["LMS_API_URL"];
const DEFAULT_ERROR = 500;
const SERVER_CRASH = 100;

export const fetcher = async <T>(
  fName: string,
  data: any
): Promise<{
  status: number;
  data?: T;
  message?: string;
  error?: string;
}> => {
  logger.info(`👉 [api] : url - ${BASE_URL}, function: ${fName}`);
  try {
    const response = await axios.post(BASE_URL, data, {
      params: {
        f: fName,
        nologin: "true",
        timezone: "Asia/Bangkok",
      },
    });

    if (
      typeof response.data === "string" &&
      response.data.indexOf("Fatal error") > -1
    ) {
      logger.error(`❌ [api] f=${fName} error --> ${response.data}`);
      return {
        status: DEFAULT_ERROR,
        error: "LMS Backend Error",
      };
    }

    if (typeof response.data == "object") {
      const { message, data: output, error } = response.data ?? {};
      return {
        status: response.status,
        data: output || response.data,
        error,
        message,
      };
    }

    return {
      status: response.status,
      data: response.data,
    };
  } catch (error: unknown) {
    const errMessage = (error as Error).stack;
    logger.error(`❌ [api] f=${fName} error --> ${errMessage}`);
    return {
      status: SERVER_CRASH,
      error: errMessage,
    };
  }
};
