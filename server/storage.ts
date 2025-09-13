import { type User, type InsertUser, type ExtractionJob, type InsertExtractionJob, type UpdateExtractionJob } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createExtractionJob(job: InsertExtractionJob): Promise<ExtractionJob>;
  getExtractionJob(id: string): Promise<ExtractionJob | undefined>;
  updateExtractionJob(id: string, updates: UpdateExtractionJob): Promise<ExtractionJob | undefined>;
  getAllExtractionJobs(): Promise<ExtractionJob[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private extractionJobs: Map<string, ExtractionJob>;

  constructor() {
    this.users = new Map();
    this.extractionJobs = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createExtractionJob(insertJob: InsertExtractionJob): Promise<ExtractionJob> {
    const id = randomUUID();
    const job: ExtractionJob = {
      id,
      ...insertJob,
      status: "pending",
      progress: 0,
      currentStage: "parsing",
      totalPages: null,
      pagesProcessed: 0,
      imagesFound: 0,
      totalImageSize: 0,
      logs: [],
      metadata: null,
      zipPath: null,
      jsonPath: null,
      startedAt: new Date(),
      completedAt: null,
      errorMessage: null,
    };
    this.extractionJobs.set(id, job);
    return job;
  }

  async getExtractionJob(id: string): Promise<ExtractionJob | undefined> {
    return this.extractionJobs.get(id);
  }

  async updateExtractionJob(id: string, updates: UpdateExtractionJob): Promise<ExtractionJob | undefined> {
    const job = this.extractionJobs.get(id);
    if (!job) return undefined;

    const updatedJob = { ...job, ...updates };
    this.extractionJobs.set(id, updatedJob);
    return updatedJob;
  }

  async getAllExtractionJobs(): Promise<ExtractionJob[]> {
    return Array.from(this.extractionJobs.values());
  }
}

export const storage = new MemStorage();
