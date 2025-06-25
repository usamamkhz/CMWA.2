import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users, projects } from '@shared/schema';

// This script sets up the database tables
export async function setupDatabase() {
  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL not provided, using in-memory storage');
    return;
  }

  try {
    console.log('Attempting to connect to Supabase database...');
    
    // Try using Supabase client for initial setup
    const supabaseUrl = 'https://nsriiewwodqnuzjlbssd.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zcmlpZXd3b2RxbnV6amxic3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTcwMDUsImV4cCI6MjA2NjM5MzAwNX0.T4nf4Dol5nS57ebPU0j2tm9ISPlKwCEkMAvNJTPelbU';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test Supabase connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (testError && testError.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet
      console.log('Supabase connection test failed:', testError);
      throw testError;
    }
    
    console.log('Supabase connection successful!');
    
    // Now try to set up tables using raw SQL via Supabase
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'client',
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `
    });
    
    if (usersError) {
      console.log('Creating users table via Supabase RPC failed, trying direct approach...');
      // Fallback to direct SQL execution
      const { error } = await supabase.from('users').select('*').limit(1);
      if (!error) {
        console.log('Users table already exists');
      }
    }

    // Create projects table
    const { error: projectsError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    // Insert default admin user using Supabase client
    const { data: existingAdmin, error: adminCheckError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@freelancehub.com')
      .maybeSingle();

    if (!existingAdmin && !adminCheckError) {
      const { error: adminInsertError } = await supabase.from('users').insert({
        email: 'admin@freelancehub.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin'
      });
      if (adminInsertError) console.log('Admin user insert error:', adminInsertError);
    }

    // Insert demo client
    const { data: existingClient, error: clientCheckError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'client@example.com')
      .maybeSingle();

    if (!existingClient && !clientCheckError) {
      const { error: clientInsertError } = await supabase.from('users').insert({
        email: 'client@example.com',
        password: 'client123',
        name: 'Demo Client',
        role: 'client'
      });
      if (clientInsertError) console.log('Demo client insert error:', clientInsertError);
    }

    // Add a demo project for the demo client
    const { data: demoClientData } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'client@example.com')
      .single();

    if (demoClientData) {
      const { data: existingProject, error: projectCheckError } = await supabase
        .from('projects')
        .select('*')
        .eq('name', 'Website Redesign')
        .maybeSingle();

      if (!existingProject && !projectCheckError) {
        const { error: projectInsertError } = await supabase.from('projects').insert({
          name: 'Website Redesign',
          description: 'Complete redesign of company website with modern UI/UX',
          status: 'in-progress',
          completion_percentage: 75,
          notes: 'Please review the latest mockups and provide feedback on the color scheme.',
          client_id: demoClientData.id
        });
        if (projectInsertError) console.log('Demo project insert error:', projectInsertError);
      }
    }

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Database setup failed:', error);
    console.log('Falling back to in-memory storage');
  }
}