require("dotenv").config();

const mysql = require("mysql2/promise");

const requiredSettings = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"];
const missingSettings = requiredSettings.filter((name) => process.env[name] === undefined || (name !== "DB_PASSWORD" && !process.env[name]));
if (missingSettings.length) {
  throw new Error(`Set these SQL connection settings in backend/.env: ${missingSettings.join(", ")}`);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  charset: process.env.DB_CHARSET || "utf8mb4",
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: Number(process.env.DB_QUEUE_LIMIT || 0),
});

const db = {
  async query(statement, parameters = []) {
    const [rows] = await pool.query(statement, parameters);
    return rows;
  },
  async execute(statement, parameters = []) {
    const [result] = await pool.execute(statement, parameters);
    return result;
  },
  async status() {
    const [rows] = await pool.query("SELECT 1 AS connected");
    return { connected: Boolean(rows[0]?.connected) };
  },
  end() {
    return pool.end();
  },
};

module.exports = db;
