require("dotenv").config();

const bcrypt = require("bcryptjs");
const db = require("../database");

async function setupAdmin() {
  const name = process.env.ADMIN_NAME || "Time Master";
  const email = (process.env.ADMIN_EMAIL || "admin@admin.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "1234567890";
  if (password.length < 10) throw new Error("ADMIN_PASSWORD must contain at least 10 characters");
  const hash = await bcrypt.hash(password, 12);
  await db.execute(
    `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')
     ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash), role = 'admin'`,
    [name, email, hash]
  );
  console.log(`Administrator account ready: ${email}`);
}

setupAdmin().catch((error) => {
  console.error(`Administrator setup failed: ${error.code || error.message}`);
  process.exitCode = 1;
}).finally(() => db.end());
