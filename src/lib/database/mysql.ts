import { getAppConfig } from "@/config/app_configs";
import mysql2, { Connection } from "mysql2/promise";

export default class MySqlDatabase {
  private static instance?: MySqlDatabase;
  public connection?: Connection;

  private constructor() {
    this.initConnection();
  }

  static async getInstance() {
    if (!MySqlDatabase.instance) {
      const database = new MySqlDatabase();
      MySqlDatabase.instance = database;
    }
    return MySqlDatabase.instance;
  }

  private async initConnection() {
    try {
      const config = getAppConfig();

      this.connection = mysql2.createPool({
        host: config["MYSQL_DATABASE_HOST"],
        user: config["MYSQL_DATABASE_USER"],
        password: config["MYSQL_DATABASE_PASSWORD"],
        database: config["MYSQL_DATABASE_NAME"],
      });
    } catch (error) {
      console.error(error);
    }
  }
}
