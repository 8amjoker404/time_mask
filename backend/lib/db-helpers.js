const db = require("../database");

async function rowsFromQuery(sql, params = []) {
  const result = await db.query(sql, params);
  if (Array.isArray(result?.[0])) return result[0];
  return result;
}

function requiredString(value, field, maxLength = 10000) {
  if (typeof value !== "string" || !value.trim()) {
    const error = new Error(`${field} is required`);
    error.status = 400;
    throw error;
  }
  return value.trim().slice(0, maxLength);
}

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

module.exports = { db, rowsFromQuery, requiredString, asyncRoute };
