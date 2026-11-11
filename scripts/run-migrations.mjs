/**
 * One-shot migration runner — runs locally only, never deployed.
 * Reads SUPABASE_DB_URL from environment; falls back to constructing it
 * from NEXT_PUBLIC_SUPABASE_URL + service role credentials.
 *
 * Usage:
 *   node scripts/run-migrations.mjs
 *
 * Requires:
 *   SUPABASE_DB_URL=postgresql://postgres.PROJECT_REF:[DB_PASSWORD]@aws-0-REGION.pooler.supabase.com:6543/postgres
 *   OR individual vars already in .env.local
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local manually
function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error(
    "❌  SUPABASE_DB_URL is not set.\n" +
    "   Add it to .env.local. Format:\n" +
    "   SUPABASE_DB_URL=postgresql://postgres.PROJECT_REF:[DB_PASSWORD]@aws-0-REGION.pooler.supabase.com:6543/postgres\n" +
    "   (Find this in Supabase Dashboard → Settings → Database → Connection string → URI)\n"
  );
  process.exit(1);
}

// Dynamic import of postgres after env check
const { default: postgres } = await import("postgres");
const sql = postgres(dbUrl, { ssl: "require", max: 1 });

const migrationsDir = path.join(__dirname, "..", "supabase", "migrations");
const files = fs.readdirSync(migrationsDir).sort().filter(f => f.endsWith(".sql"));

console.log(`\n🚀 Running ${files.length} migration(s)...\n`);

for (const file of files) {
  const filePath = path.join(migrationsDir, file);
  const sqlText = fs.readFileSync(filePath, "utf-8");
  process.stdout.write(`  ⏳ ${file} ... `);
  try {
    await sql.unsafe(sqlText);
    console.log("✅ OK");
  } catch (err) {
    console.log(`❌ ERROR: ${err.message}`);
  }
}

await sql.end();
console.log("\n✅ Migration run complete.\n");

