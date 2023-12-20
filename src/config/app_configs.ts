import AppConfig from "./configs.json";

export const getAppConfig = () => {
  const env = process.env.NODE_ENV || "development";
  return AppConfig[env as keyof typeof AppConfig];
};
