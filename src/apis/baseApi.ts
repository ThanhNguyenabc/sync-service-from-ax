import logger from "@/utils/logger";
import { getAppConfig } from "@/config/app_configs";
import axios from "axios";

const BASE_URL = getAppConfig()?.["LMS_API_URL"];
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
      response.data.indexOf("Fatal error") >= 0
    ) {
      logger.error(`❌ [api] f=${fName} error --> ${response.data}`);
      return {
        status: SERVER_CRASH,
      };
    }

    if (typeof response.data == "object") {
      let { message, data: output, error } = response.data;
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
  } catch (error) {
    logger.error(`❌ [api] f=${fName} error --> ${error}`);

    return {
      status: SERVER_CRASH,
    };
  }
};
