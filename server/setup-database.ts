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
    
    // Use Supabase Auth and create custom profile tables
    console.log('='.repeat(80));
    console.log('DATABASE SETUP REQUIRED');
    console.log('='.repeat(80));
    console.log('');
    console.log('To enable signup and full functionality, create these tables:');
    console.log('');
    console.log('1. Open Supabase SQL Editor:');
    console.log('   https://nsriiewwodqnuzjlbssd.supabase.co/project/nsriiewwodqnuzjlbssd/sql/new');
    console.log('');
    console.log('2. Copy and execute this SQL:');
    console.log('');
    console.log('-- Create users table');
    console.log('CREATE TABLE IF NOT EXISTS users (');
    console.log('  id SERIAL PRIMARY KEY,');
    console.log('  email TEXT NOT NULL UNIQUE,');
    console.log('  password TEXT NOT NULL,');
    console.log('  name TEXT NOT NULL,');
    console.log('  role TEXT NOT NULL DEFAULT \'client\',');
    console.log('  created_at TIMESTAMP DEFAULT NOW() NOT NULL');
    console.log(');');
    console.log('');
    console.log('-- Create projects table');
    console.log('CREATE TABLE IF NOT EXISTS projects (');
    console.log('  id SERIAL PRIMARY KEY,');
    console.log('  name TEXT NOT NULL,');
    console.log('  description TEXT NOT NULL,');
    console.log('  status TEXT NOT NULL DEFAULT \'in-progress\',');
    console.log('  completion_percentage INTEGER NOT NULL DEFAULT 0,');
    console.log('  notes TEXT,');
    console.log('  drive_link TEXT,');
    console.log('  client_id INTEGER NOT NULL,');
    console.log('  created_at TIMESTAMP DEFAULT NOW() NOT NULL,');
    console.log('  updated_at TIMESTAMP DEFAULT NOW() NOT NULL');
    console.log(');');
    console.log('');
    console.log('-- Insert demo data');
    console.log('INSERT INTO users (email, password, name, role)');
    console.log('VALUES (\'admin@freelancehub.com\', \'admin123\', \'Admin User\', \'admin\')');
    console.log('ON CONFLICT (email) DO NOTHING;');
    console.log('');
    console.log('INSERT INTO users (email, password, name, role)');
    console.log('VALUES (\'client@example.com\', \'client123\', \'Demo Client\', \'client\')');
    console.log('ON CONFLICT (email) DO NOTHING;');
    console.log('');
    console.log('3. Click "Run" to execute');
    console.log('4. Refresh this app to test signup');
    console.log('');
    console.log('='.repeat(80));
    
    // Check if tables exist and try to create them manually if needed
    const { error: usersCheck } = await supabase.from('users').select('count', { count: 'exact', head: true });
    const { error: projectsCheck } = await supabase.from('projects').select('count', { count: 'exact', head: true });
    
    if (!usersCheck && !projectsCheck) {
      console.log('Tables detected! Database setup complete.');
      
      // Insert demo data if tables exist
      const { data: existingAdmin } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'admin@freelancehub.com')
        .maybeSingle();

      if (!existingAdmin) {
        await supabase.from('users').insert({
          email: 'admin@freelancehub.com',
          password: 'admin123',
          name: 'Admin User',
          role: 'admin'
        });
        console.log('Demo admin user created');
      }

      const { data: existingClient } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'client@example.com')
        .maybeSingle();

      if (!existingClient) {
        const { data: newClient } = await supabase.from('users').insert({
          email: 'client@example.com',
          password: 'client123',
          name: 'Demo Client',
          role: 'client'
        }).select().single();
        
        if (newClient) {
          await supabase.from('projects').insert({
            name: 'Website Redesign',
            description: 'Complete redesign of company website with modern UI/UX',
            status: 'in-progress',
            completion_percentage: 75,
            notes: 'Please review the latest mockups and provide feedback on the color scheme.',
            client_id: newClient.id
          });
          console.log('Demo client and project created');
        }
      }
    } else {
      console.log('Tables not found. You need to create them manually.');
      console.log('Please go to your Supabase SQL Editor and run the commands above.');
    }

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