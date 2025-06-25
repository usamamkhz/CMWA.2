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
    const result = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        completionPercentage: projects.completionPercentage,
        notes: projects.notes,
        driveLink: projects.driveLink,
        clientId: projects.clientId,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        client: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(projects)
      .innerJoin(users, eq(projects.clientId, users.id))
      .orderBy(desc(projects.createdAt));

    return result;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const result = await db.insert(projects).values(project).returning();
    return result[0];
  }

  async updateProject(id: number, updates: UpdateProject): Promise<Project | undefined> {
    const result = await db.update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return result[0];
  }

  async deleteProject(id: number): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id));
    return result.rowCount > 0;
  }

  async getAllClients(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, 'client')).orderBy(desc(users.createdAt));
  }

  async getClientWithProjects(clientId: number): Promise<ClientWithProjects | undefined> {
    const client = await db.select().from(users).where(eq(users.id, clientId)).limit(1);
    if (!client[0] || client[0].role !== 'client') return undefined;

    const clientProjects = await this.getProjectsByClientId(clientId);
    
    return {
      id: client[0].id,
      name: client[0].name,
      email: client[0].email,
      projects: clientProjects,
    };
  }

  async getAllClientsWithProjects(): Promise<ClientWithProjects[]> {
    const clients = await this.getAllClients();
    const clientsWithProjects: ClientWithProjects[] = [];
    
    for (const client of clients) {
      const clientProjects = await this.getProjectsByClientId(client.id);
      clientsWithProjects.push({
        id: client.id,
        name: client.name,
        email: client.email,
        projects: clientProjects,
      });
    }
    
    return clientsWithProjects;
  }
}

export const databaseStorage = new DatabaseStorage();