require('dotenv').config();

const pool = require('../config/db');

const migrate = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company VARCHAR(255) NOT NULL,
        role VARCHAR(255) NOT NULL,
        url TEXT,
        status VARCHAR(50) DEFAULT 'wishlist' CHECK (status IN ('wishlist','applied','screening','interviewing','offer','accepted','rejected','withdrawn')),
        salary_min INTEGER,
        salary_max INTEGER,
        currency VARCHAR(10) DEFAULT 'GBP',
        location VARCHAR(255),
        remote_type VARCHAR(50) CHECK (remote_type IN ('onsite','hybrid','remote')),
        visa_sponsorship BOOLEAN DEFAULT false,
        notes TEXT,
        applied_date DATE,
        response_date DATE,
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(255),
        email VARCHAR(255),
        linkedin_url TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS timeline_events (
        id SERIAL PRIMARY KEY,
        application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
        event_type VARCHAR(100) NOT NULL,
        description TEXT,
        event_date TIMESTAMP DEFAULT NOW()
      );
    `);

    // Indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_applications_company ON applications(company);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_timeline_events_application_id ON timeline_events(application_id);');

    await client.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();
