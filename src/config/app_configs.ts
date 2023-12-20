import { fetchProgramConfig } from "@/apis/_index";
import AppConfig from "./configs.json";

export const getAppConfig = () => {
  const ENV = process.env.NODE_ENV || "development";
  return AppConfig[ENV as keyof typeof AppConfig];
};

export const getProgramConfig = async () => await fetchProgramConfig();
