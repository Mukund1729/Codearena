const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`
});

async function seedDatabase() {
  try {
    console.log('Connecting to PostgreSQL...');
    await pool.connect();
    console.log('Connected successfully!');

    // Read the seed SQL file
    const seedSql = fs.readFileSync(
      path.join(__dirname, 'seed.sql'),
      'utf-8'
    );

    // Split by semicolons and execute each statement separately
    const statements = seedSql.split(';').filter(s => s.trim());
    
    console.log('Seeding database with sample problems...');
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.query(statement);
      }
    }
    console.log('Database seeded successfully!');

    // Verify the data
    const result = await pool.query('SELECT COUNT(*) FROM problems');
    console.log(`Total problems in database: ${result.rows[0].count}`);

    const problems = await pool.query('SELECT id, title, difficulty FROM problems');
    console.log('\nSample problems:');
    problems.rows.forEach(p => {
      console.log(`- ${p.title} (${p.difficulty})`);
    });

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\nDatabase connection closed.');
  }
}

seedDatabase();
