require("dotenv").config();
const db = require("../db");

async function promote() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    throw new Error("Usage: npm run promote-admin -- user@example.com");
  }
  const result = await db.execute("UPDATE users SET role = 'admin' WHERE email = ?", [email]);
  const changed = result?.affectedRows ?? result?.rowCount;
  if (changed === 0) throw new Error(`No account found for ${email}`);
  console.log(`Administrator access granted to ${email}`);
  process.exitCode = 0;
}

promote().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
