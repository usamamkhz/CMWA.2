import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users, projects } from '@shared/schema';

// This script sets up the database tables
export async function setupDatabase() {
  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL not provided, using in-memory storage');
    return;
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql);

    // Create tables
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'client',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'in-progress',
        completion_percentage INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        drive_link TEXT,
        client_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // Insert default admin user
    await sql`
      INSERT INTO users (email, password, name, role) 
      VALUES ('admin@freelancehub.com', 'admin123', 'Admin User', 'admin')
      ON CONFLICT (email) DO NOTHING
    `;

    // Insert demo client
    await sql`
      INSERT INTO users (email, password, name, role) 
      VALUES ('client@example.com', 'client123', 'Demo Client', 'client')
      ON CONFLICT (email) DO NOTHING
    `;

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Database setup failed:', error);
    console.log('Falling back to in-memory storage');
  }
}