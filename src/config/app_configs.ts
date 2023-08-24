const AppConfig = {
  development: {
    HOST: "localhost",
    PORT: 3000,
    LMS_API_URL: "http://localhost/api.php",
    MYSQL_DATABASE_HOST: "localhost",
    MYSQL_DATABASE_USER: "root",
    MYSQL_DATABASE_PASSWORD: "137137137",
    MYSQL_DATABASE_NAME: "lms_lab",
  },
  production: {
    HOST: "",
    PORT: 0,
    LMS_API_URL: "http://localhost/api.php",
    MYSQL_DATABASE_HOST: "localhost",
    MYSQL_DATABASE_USER: "root",
    MYSQL_DATABASE_PASSWORD: "137137137",
    MYSQL_DATABASE_NAME: "lms_lab",
  },
};

export const getAppConfig = () => {
  const ENV = process.env.NODE_ENV || "development";
  return AppConfig[ENV as keyof typeof AppConfig];
};
