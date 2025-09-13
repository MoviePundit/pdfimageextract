import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const extractionJobs = pgTable("extraction_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  fileSize: integer("file_size").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  progress: integer("progress").notNull().default(0), // 0-100
  currentStage: text("current_stage").default("parsing"), // parsing, extracting, zipping
  totalPages: integer("total_pages"),
  pagesProcessed: integer("pages_processed").default(0),
  imagesFound: integer("images_found").default(0),
  totalImageSize: integer("total_image_size").default(0),
  logs: jsonb("logs").default([]),
  metadata: jsonb("metadata"),
  zipPath: text("zip_path"),
  jsonPath: text("json_path"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertExtractionJobSchema = createInsertSchema(extractionJobs).pick({
  filename: true,
  fileSize: true,
});

export const updateExtractionJobSchema = createInsertSchema(extractionJobs).pick({
  status: true,
  progress: true,
  currentStage: true,
  totalPages: true,
  pagesProcessed: true,
  imagesFound: true,
  totalImageSize: true,
  logs: true,
  metadata: true,
  zipPath: true,
  jsonPath: true,
  completedAt: true,
  errorMessage: true,
}).partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertExtractionJob = z.infer<typeof insertExtractionJobSchema>;
export type UpdateExtractionJob = z.infer<typeof updateExtractionJobSchema>;
export type ExtractionJob = typeof extractionJobs.$inferSelect;

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'DEBUG' | 'WARN' | 'ERROR';
  message: string;
}

export interface ImageMetadata {
  filename: string;
  page: number;
  sizeBytes: number;
  dimensions: {
    width: number;
    height: number;
    aspectRatio: number;
  };
  format: string;
  position: {
    x: number;
    y: number;
  };
}

export interface ExtractionMetadata {
  extractionInfo: {
    pdfFilename: string;
    totalPages: number;
    extractionDate: string;
    processingTime: string;
    totalImages: number;
  };
  images: ImageMetadata[];
}
