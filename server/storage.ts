import { users, projects, type User, type InsertUser, type Project, type InsertProject, type UpdateProject, type ProjectWithClient, type ClientWithProjects } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project operations
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByClientId(clientId: number): Promise<Project[]>;
  getAllProjectsWithClients(): Promise<ProjectWithClient[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, updates: UpdateProject): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Admin operations
  getAllClients(): Promise<User[]>;
  getClientWithProjects(clientId: number): Promise<ClientWithProjects | undefined>;
  getAllClientsWithProjects(): Promise<ClientWithProjects[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private currentUserId: number;
  private currentProjectId: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.currentUserId = 1;
    this.currentProjectId = 1;
    
    // Create default admin user
    this.createUser({
      email: "admin@freelancehub.com",
      password: "admin123", 
      name: "Admin User",
      role: "admin"
    });

    // Create demo client
    this.createUser({
      email: "client@example.com",
      password: "client123",
      name: "Demo Client", 
      role: "client"
    }).then((client) => {
      // Create demo project
      this.createProject({
        name: "Website Redesign",
        description: "Complete redesign of company website with modern UI/UX",
        status: "in-progress",
        completionPercentage: 75,
        notes: "Please review the latest mockups and provide feedback on the color scheme.",
        clientId: client.id
      });
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      role: insertUser.role || 'client',
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjectsByClientId(clientId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(project => project.clientId === clientId);
  }

  async getAllProjectsWithClients(): Promise<ProjectWithClient[]> {
    const projectsWithClients: ProjectWithClient[] = [];
    
    for (const project of Array.from(this.projects.values())) {
      const client = this.users.get(project.clientId);
      if (client) {
        projectsWithClients.push({
          ...project,
          client: {
            id: client.id,
            name: client.name,
            email: client.email,
          },
        });
      }
    }
    
    return projectsWithClients;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    const now = new Date();
    const project: Project = {
      ...insertProject,
      id,
      status: insertProject.status || 'in-progress',
      completionPercentage: insertProject.completionPercentage || 0,
      notes: insertProject.notes || null,
      driveLink: insertProject.driveLink || null,
      createdAt: now,
      updatedAt: now,
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: number, updates: UpdateProject): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject: Project = {
      ...project,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }

  async getAllClients(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === "client");
  }

  async getClientWithProjects(clientId: number): Promise<ClientWithProjects | undefined> {
    const client = this.users.get(clientId);
    if (!client || client.role !== "client") return undefined;
    
    const projects = await this.getProjectsByClientId(clientId);
    
    return {
      id: client.id,
      name: client.name,
      email: client.email,
      projects,
    };
  }

  async getAllClientsWithProjects(): Promise<ClientWithProjects[]> {
    const clients = await this.getAllClients();
    const clientsWithProjects: ClientWithProjects[] = [];
    
    for (const client of clients) {
      const projects = await this.getProjectsByClientId(client.id);
      clientsWithProjects.push({
        id: client.id,
        name: client.name,
        email: client.email,
        projects,
      });
    }
    
    return clientsWithProjects;
  }
}

export const storage = new MemStorage();
