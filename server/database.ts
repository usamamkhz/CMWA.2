import { createClient } from '@supabase/supabase-js';
import { users, projects, type User, type InsertUser, type Project, type InsertProject, type UpdateProject, type ProjectWithClient, type ClientWithProjects } from '@shared/schema';
import type { IStorage } from './storage';

const supabaseUrl = 'https://nsriiewwodqnuzjlbssd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zcmlpZXd3b2RxbnV6amxic3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTcwMDUsImV4cCI6MjA2NjM5MzAwNX0.T4nf4Dol5nS57ebPU0j2tm9ISPlKwCEkMAvNJTPelbU';

const supabase = createClient(supabaseUrl, supabaseKey);

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return undefined;
    return data as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) return undefined;
    return data as User;
  }

  async createUser(user: InsertUser): Promise<User> {
    console.log('Creating user with data:', user);
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase createUser error:', error);
      
      // Check if tables exist
      if (error.code === '42P01') {
        throw new Error('Database tables do not exist. Please create them in Supabase SQL Editor.');
      }
      
      throw error;
    }
    
    console.log('User created in Supabase:', data);
    return data as User;
  }

  async getProject(id: number): Promise<Project | undefined> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return undefined;
    return data as Project;
  }

  async getProjectsByClientId(clientId: number): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching projects by client ID:', error);
      return [];
    }
    return data as Project[];
  }

  async getAllProjectsWithClients(): Promise<ProjectWithClient[]> {
    console.log('Fetching all projects with clients...');
    
    // First get all projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      throw projectsError;
    }

    // Then get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('role', 'client');
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    // Manually join the data
    const projectsWithClients = projects?.map(project => {
      const client = users?.find(user => user.id === project.client_id);
      return {
        ...project,
        client: client || { id: 0, name: 'Unknown', email: 'unknown@example.com' }
      };
    }) || [];
    
    console.log('Projects with clients fetched:', projectsWithClients);
    return projectsWithClients as ProjectWithClient[];
  }

  async createProject(project: InsertProject): Promise<Project> {
    console.log('Creating project:', project);
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating project:', error);
      throw error;
    }
    
    console.log('Project created:', data);
    return data as Project;
  }

  async updateProject(id: number, updates: UpdateProject): Promise<Project | undefined> {
    console.log('Updating project:', id, updates);
    const { data, error } = await supabase
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating project:', error);
      throw error;
    }
    
    console.log('Project updated:', data);
    return data as Project;
  }

  async deleteProject(id: number): Promise<boolean> {
    console.log('Deleting project:', id);
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
    
    console.log('Project deleted successfully');
    return true;
  }

  async getAllClients(): Promise<User[]> {
    console.log('Fetching all clients...');
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'client')
      .order('name');
    
    if (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
    
    console.log('Clients fetched:', data);
    return data as User[];
  }

  async getClientWithProjects(clientId: number): Promise<ClientWithProjects | undefined> {
    console.log('Fetching client with projects:', clientId);
    
    const client = await this.getUser(clientId);
    if (!client || client.role !== 'client') {
      return undefined;
    }
    
    const projects = await this.getProjectsByClientId(clientId);
    
    const result = {
      id: client.id,
      name: client.name,
      email: client.email,
      projects: projects
    };
    
    console.log('Client with projects fetched:', result);
    return result;
  }

  async getAllClientsWithProjects(): Promise<ClientWithProjects[]> {
    console.log('Fetching all clients with projects...');
    
    // Get all clients
    const clients = await this.getAllClients();
    
    // Get projects for each client
    const clientsWithProjects: ClientWithProjects[] = [];
    for (const client of clients) {
      const projects = await this.getProjectsByClientId(client.id);
      clientsWithProjects.push({
        id: client.id,
        name: client.name,
        email: client.email,
        projects: projects
      });
    }
    
    console.log('Clients with projects fetched:', clientsWithProjects);
    return clientsWithProjects;
  }
}

export const databaseStorage = new DatabaseStorage();