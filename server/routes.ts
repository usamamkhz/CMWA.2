import type { Express } from "express";
import { createServer, type Server } from "http";
import { databaseStorage } from "./database";
import {
  insertUserSchema,
  insertProjectSchema,
  updateProjectSchema,
} from "@shared/schema";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const user = await databaseStorage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // In a real app, you'd use proper session management
      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await databaseStorage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }

      const user = await databaseStorage.createUser(userData);
      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Project routes for clients
  app.get("/api/projects/my/:clientId", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const projects = await databaseStorage.getProjectsByClientId(clientId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.patch("/api/projects/:id/drive-link", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { driveLink } = req.body;

      const updatedProject = await databaseStorage.updateProject(id, {
        driveLink,
      });
      if (!updatedProject) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json(updatedProject);
    } catch (error) {
      res.status(500).json({ message: "Failed to update drive link" });
    }
  });

  // Admin routes
  app.get("/api/admin/projects", async (req, res) => {
    try {
      const projects = await databaseStorage.getAllProjectsWithClients();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/admin/clients", async (req, res) => {
    try {
      const clients = await databaseStorage.getAllClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.post("/api/admin/projects", async (req, res) => {
    try {
      console.log("Raw request body:", req.body);
      // Transform the data to match database column names
      const { clientId, completionPercentage, ...rest } = req.body;
      const transformedData = {
        ...rest,
        client_id: clientId,
        completion_percentage: parseInt(completionPercentage),
      };
      console.log("Transformed data for database:", transformedData);

      // Import supabase client
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseUrl = "https://nsriiewwodqnuzjlbssd.supabase.co";
      const supabaseKey =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zcmlpZXd3b2RxbnV6amxic3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTcwMDUsImV4cCI6MjA2NjM5MzAwNX0.T4nf4Dol5nS57ebPU0j2tm9ISPlKwCEkMAvNJTPelbU";
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Create project directly with transformed data
      const { data, error } = await supabase
        .from("projects")
        .insert(transformedData)
        .select()
        .single();

      if (error) {
        console.error("Error creating project:", error);
        throw error;
      }

      console.log("Project created:", data);
      res.status(201).json(data);
    } catch (error) {
      console.error("Project creation error:", error);
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  app.patch("/api/admin/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log("Raw update body:", req.body);

      // Transform the data to match database column names
      const { completionPercentage, ...rest } = req.body;
      const transformedData = {
        ...rest,
        ...(parseInt(completionPercentage) !== undefined && {
          completion_percentage: parseInt(completionPercentage),
        }),
        updated_at: new Date().toISOString(),
      };
      console.log("Transformed update data:", transformedData);

      // Import supabase client
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseUrl = "https://nsriiewwodqnuzjlbssd.supabase.co";
      const supabaseKey =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zcmlpZXd3b2RxbnV6amxic3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTcwMDUsImV4cCI6MjA2NjM5MzAwNX0.T4nf4Dol5nS57ebPU0j2tm9ISPlKwCEkMAvNJTPelbU";
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Update project directly with transformed data
      const { data, error } = await supabase
        .from("projects")
        .update(transformedData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating project:", error);
        throw error;
      }

      console.log("Project updated:", data);
      res.json(data);
    } catch (error) {
      console.error("Project update error:", error);
      res.status(400).json({ message: "Invalid update data" });
    }
  });

  app.delete("/api/admin/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await databaseStorage.deleteProject(id);

      if (!deleted) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Stats endpoint for admin dashboard
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const clients = await databaseStorage.getAllClients();
      const projects = await databaseStorage.getAllProjectsWithClients();

      const stats = {
        totalClients: clients.length,
        activeProjects: projects.filter((p) => p.status === "in-progress")
          .length,
        pendingFeedback: projects.filter((p) => p.status === "waiting-feedback")
          .length,
        completed: projects.filter((p) => p.status === "complete").length,
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
