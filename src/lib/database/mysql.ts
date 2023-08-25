import { getAppConfig } from "../../config/app_configs";
import mysql2, { Connection } from "mysql2/promise";

export default class Database {
  static instance?: Database;
  public connection?: Connection;

  constructor() {
    this.initConnection();
  }

  static async getInstance() {
    if (!Database.instance) {
      console.debug("create database instance");
      const database = new Database();
      Database.instance = database;
    }
    return Database.instance;
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
