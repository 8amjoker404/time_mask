require("dotenv").config();

const { connectProject } = require("./diamond-sql");

if (!process.env.SITE_ID || !process.env.API_KEY || !process.env.DBMS_URL) {
  throw new Error("SITE_ID, API_KEY, and DBMS_URL must be configured in backend/.env");
}

const db = connectProject(process.env.SITE_ID, {
  apiKey: process.env.API_KEY,
  dbmsUrl: process.env.DBMS_URL,
  timeoutMs: Number(process.env.DBMS_TIMEOUT_MS || 15000),
});

module.exports = db;
