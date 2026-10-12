require("dotenv").config();
const db = require("../db");
const { rowsFromQuery } = require("../lib/db-helpers");

async function promote() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    throw new Error("Usage: npm run promote-admin -- user@example.com");
  }
  const users = await rowsFromQuery("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
  if (!users?.length) throw new Error(`No account found for ${email}`);
  await db.execute("UPDATE users SET role = 'admin' WHERE id = ?", [users[0].id]);
  console.log(`Administrator access granted to ${email}`);
  process.exitCode = 0;
}

promote().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
