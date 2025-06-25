import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users, projects, type User, type InsertUser, type Project, type InsertProject, type UpdateProject, type ProjectWithClient, type ClientWithProjects } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import type { IStorage } from './storage';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getProject(id: number): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return result[0];
  }

  async getProjectsByClientId(clientId: number): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.clientId, clientId)).orderBy(desc(projects.createdAt));
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