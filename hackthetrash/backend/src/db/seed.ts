import "dotenv/config";
import fs from "fs";
import path from "path";
import { pool } from "./pool";

async function run() {
  const dir = path.join(__dirname, "seeds");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    const sql = fs.readFileSync(path.join(dir, f), "utf-8");
    console.log(`Seeding ${f}...`);
    await pool.query(sql);
  }
  console.log("Seed complete");
  await pool.end();
}
run().catch((e) => { console.error(e); process.exit(1); });
