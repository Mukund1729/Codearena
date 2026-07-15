/**
 * Seeds Kattis problems into PostgreSQL from the curated JSON file.
 * Usage: node fetch-kattis.js
 * Requires: DATABASE_URL or POSTGRES_* env vars (see .env.example)
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'codearena',
  user: process.env.POSTGRES_USER || 'codearena',
  password: process.env.POSTGRES_PASSWORD || 'codearena123',
});

async function main() {
  const jsonPath = path.join(__dirname, '../kattis/kattis-problems.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('Run database/kattis/fetch-problems.js first to generate kattis-problems.json');
    process.exit(1);
  }

  const problems = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Importing ${problems.length} Kattis problems into PostgreSQL...`);

  for (const p of problems) {
    await pool.query(
      `INSERT INTO problems (title, slug, description, difficulty, tags, time_limit, memory_limit, points, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PUBLISHED', 'kattis-import')
       ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         difficulty = EXCLUDED.difficulty,
         tags = EXCLUDED.tags`,
      [p.title, p.slug, p.description, p.difficulty, p.tags, p.time_limit, p.memory_limit, p.points]
    );
  }

  console.log('Done.');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
