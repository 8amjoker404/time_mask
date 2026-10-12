require("dotenv").config();

const fs = require("node:fs/promises");
const path = require("node:path");
const mysql = require("mysql2/promise");

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "",
    charset: process.env.DB_CHARSET || "utf8mb4",
    multipleStatements: false,
  });

  try {
    await connection.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) NOT NULL PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    const migrationDirectory = path.join(__dirname, "..", "migrations");
    const filenames = (await fs.readdir(migrationDirectory))
      .filter((filename) => filename.endsWith(".sql"))
      .sort();

    for (const filename of filenames) {
      const [existing] = await connection.execute(
        "SELECT filename FROM schema_migrations WHERE filename = ? LIMIT 1",
        [filename]
      );
      if (existing.length) {
        console.log(`Already applied: ${filename}`);
        continue;
      }

      const contents = await fs.readFile(path.join(migrationDirectory, filename), "utf8");
      const statements = contents.split(";").map((statement) => statement.trim()).filter(Boolean);
      for (const statement of statements) await connection.query(statement);
      await connection.execute("INSERT INTO schema_migrations (filename) VALUES (?)", [filename]);
      console.log(`Applied: ${filename}`);
    }
  } finally {
    await connection.end();
  }
}

migrate().catch((error) => {
  console.error(`Migration failed: ${error.code || error.message}`);
  process.exitCode = 1;
});
