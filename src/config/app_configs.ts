import AppConfig from "./configs.json";
import ini from "ini";
import { readFile } from "fs/promises";
export const getAppConfig = () => {
  const ENV = process.env.NODE_ENV || "development";
  return AppConfig[ENV as keyof typeof AppConfig];
};

export const getProgramConfig = async () => {
  try {
    const programFile = await readFile(`${__dirname}/programs.cfg`, {
      encoding: "utf-8",
    });
    const config = ini.parse(programFile);
    return config;
  } catch (error) {}
  return null;
};
