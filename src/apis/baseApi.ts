import logger from "@/utils/logger";
import { getAppConfig } from "@/config/app_configs";
import axios, { AxiosError } from "axios";

const BASE_URL = getAppConfig()?.["LMS_API_URL"];
const DEFAULT_ERROR = 500;
const SERVER_CRASH = 100;

type ResponseData<T> = {
  status: number;
  data?: T;
  message?: string;
};

axios.interceptors.request.use((config) => {
  logger.info(
    `👉 [api-request] : url - ${BASE_URL}, function: ${config.params["f"]}`
  );
  return config;
});

axios.interceptors.response.use(
  (response) => {
    const customResponse = response;

    if (
      typeof response.data === "string" &&
      response.data.indexOf("Fatal error") > -1
    ) {
      const errorString = response.data;
      logger.error(
        `❌ [api-response] f=${response.config.params["f"]} error --> ${errorString}`
      );

      customResponse.data = {
        status: DEFAULT_ERROR,
        message: "ERROR IS FROM LMS BE",
        data: errorString,
      };
    } else {
      const { message, data: output, error } = customResponse.data ?? {};
      customResponse.data = {
        status: customResponse.status,
        data: output || customResponse.data,
        message: message,
      };
    }

    return customResponse;
  },
  (error) => Promise.reject(error)
);

export const fetcher = async <T>(
  fName: string,
  data: any
): Promise<ResponseData<T>> => {
  try {
    const response = await axios.post(BASE_URL, data, {
      params: {
        f: fName,
        nologin: "true",
        timezone: "Asia/Bangkok",
      },
    });

    return response.data;
  } catch (error: unknown) {
    const errMessage = (error as Error).stack;
    console.log("error---------");
    console.log((error as AxiosError).toJSON());
    console.log("------------------");
    logger.error(`❌ [api-response] f=${fName} error --> ${errMessage}`);
    return {
      status: SERVER_CRASH,
      message: errMessage,
    };
  }
};
