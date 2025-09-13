import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { z } from "zod";
import { insertExtractionJobSchema } from "@shared/schema";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import JSZip from "jszip";
import sharp from "sharp";
import type { LogEntry, ImageMetadata, ExtractionMetadata } from "@shared/schema";

const execAsync = promisify(exec);

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Upload PDF and start extraction
  app.post("/api/extract", upload.single('pdf'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No PDF file uploaded" });
      }

      const job = await storage.createExtractionJob({
        filename: req.file.originalname,
        fileSize: req.file.size,
      });

      // Start extraction process asynchronously
      processExtractionJob(job.id, req.file.path).catch(console.error);

      res.json({ jobId: job.id });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Upload failed" });
    }
  });

  // Get extraction job status
  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const job = await storage.getExtractionJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to get job status" });
    }
  });

  // Download ZIP file
  app.get("/api/jobs/:id/download/zip", async (req, res) => {
    try {
      const job = await storage.getExtractionJob(req.params.id);
      if (!job || !job.zipPath) {
        return res.status(404).json({ message: "ZIP file not found" });
      }

      const zipFileName = `${path.basename(job.filename, '.pdf')}-images.zip`;
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);
      
      const zipBuffer = await fs.readFile(job.zipPath);
      res.send(zipBuffer);
    } catch (error) {
      res.status(500).json({ message: "Failed to download ZIP file" });
    }
  });

  // Download JSON metadata
  app.get("/api/jobs/:id/download/json", async (req, res) => {
    try {
      const job = await storage.getExtractionJob(req.params.id);
      if (!job || !job.jsonPath) {
        return res.status(404).json({ message: "JSON file not found" });
      }

      const jsonFileName = `${path.basename(job.filename, '.pdf')}-metadata.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${jsonFileName}"`);
      
      const jsonData = await fs.readFile(job.jsonPath, 'utf-8');
      res.send(jsonData);
    } catch (error) {
      res.status(500).json({ message: "Failed to download JSON file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function processExtractionJob(jobId: string, pdfPath: string): Promise<void> {
  const addLog = async (level: LogEntry['level'], message: string) => {
    const job = await storage.getExtractionJob(jobId);
    if (!job) return;
    
    const logs = Array.isArray(job.logs) ? [...job.logs] : [];
    logs.push({
      timestamp: new Date().toISOString(),
      level,
      message,
    });
    
    await storage.updateExtractionJob(jobId, { logs });
  };

  try {
    await addLog('INFO', `PDF extraction started for: ${path.basename(pdfPath)}`);
    await storage.updateExtractionJob(jobId, { 
      status: 'processing', 
      currentStage: 'parsing',
      progress: 10 
    });

    // Create output directory
    const outputDir = path.join('temp', jobId);
    await fs.mkdir(outputDir, { recursive: true });

    // Get PDF info using pdfinfo
    let totalPages = 0;
    try {
      const { stdout } = await execAsync(`pdfinfo "${pdfPath}"`);
      const pageMatch = stdout.match(/Pages:\s+(\d+)/);
      totalPages = pageMatch ? parseInt(pageMatch[1]) : 0;
      await storage.updateExtractionJob(jobId, { totalPages });
      await addLog('DEBUG', `Document contains ${totalPages} pages`);
    } catch (error) {
      await addLog('WARN', 'Could not determine page count, proceeding with extraction');
    }

    await storage.updateExtractionJob(jobId, { progress: 20, currentStage: 'extracting' });

    // Extract images using pdfimages
    const images: ImageMetadata[] = [];
    let totalImageSize = 0;

    try {
      // Use pdfimages to extract all images
      const imagePrefix = path.join(outputDir, 'image');
      await execAsync(`pdfimages -all "${pdfPath}" "${imagePrefix}"`);
      
      await addLog('INFO', 'Image extraction completed, processing metadata...');

      // Get list of extracted files
      const files = await fs.readdir(outputDir);
      const imageFiles = files.filter(f => /\.(jpg|jpeg|png|ppm|pbm|pgm)$/i.test(f));

      for (let i = 0; i < imageFiles.length; i++) {
        const filename = imageFiles[i];
        const filepath = path.join(outputDir, filename);
        
        try {
          // Get image metadata using Sharp
          const metadata = await sharp(filepath).metadata();
          const stats = await fs.stat(filepath);
          
          const imageData: ImageMetadata = {
            filename,
            page: Math.floor(i / Math.max(1, Math.floor(imageFiles.length / totalPages))) + 1,
            sizeBytes: stats.size,
            dimensions: {
              width: metadata.width || 0,
              height: metadata.height || 0,
              aspectRatio: metadata.width && metadata.height ? 
                parseFloat((metadata.width / metadata.height).toFixed(2)) : 0
            },
            format: metadata.format?.toUpperCase() || 'UNKNOWN',
            position: { x: 0, y: 0 } // Position would require more complex PDF parsing
          };
          
          images.push(imageData);
          totalImageSize += stats.size;
          
          await addLog('INFO', `Processed ${filename} (${imageData.dimensions.width}x${imageData.dimensions.height}, ${Math.round(stats.size / 1024)}KB)`);
        } catch (error) {
          await addLog('WARN', `Failed to process image: ${filename}`);
        }

        // Update progress
        const progress = 20 + Math.floor((i / imageFiles.length) * 60);
        await storage.updateExtractionJob(jobId, { 
          progress,
          pagesProcessed: Math.min(totalPages, i + 1),
          imagesFound: images.length,
          totalImageSize
        });
      }

      if (images.length === 0) {
        throw new Error('No images found in PDF');
      }

    } catch (error) {
      await addLog('ERROR', `Image extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      await storage.updateExtractionJob(jobId, { 
        status: 'failed', 
        errorMessage: error instanceof Error ? error.message : 'Unknown error' 
      });
      return;
    }

    await storage.updateExtractionJob(jobId, { 
      progress: 85, 
      currentStage: 'zipping',
      imagesFound: images.length,
      totalImageSize 
    });
    await addLog('INFO', 'Creating ZIP archive...');

    // Create ZIP file
    const zip = new JSZip();
    const files = await fs.readdir(outputDir);
    const imageFiles = files.filter(f => /\.(jpg|jpeg|png|ppm|pbm|pgm)$/i.test(f));

    for (const filename of imageFiles) {
      const filepath = path.join(outputDir, filename);
      const buffer = await fs.readFile(filepath);
      zip.file(filename, buffer);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const zipPath = path.join('temp', `${jobId}.zip`);
    await fs.writeFile(zipPath, zipBuffer);

    // Create metadata JSON
    const job = await storage.getExtractionJob(jobId);
    const metadata: ExtractionMetadata = {
      extractionInfo: {
        pdfFilename: job?.filename || 'unknown.pdf',
        totalPages: totalPages,
        extractionDate: new Date().toISOString(),
        processingTime: job?.startedAt ? 
          formatDuration(Date.now() - job.startedAt.getTime()) : '0:00',
        totalImages: images.length
      },
      images
    };

    const jsonPath = path.join('temp', `${jobId}_metadata.json`);
    await fs.writeFile(jsonPath, JSON.stringify(metadata, null, 2));

    await storage.updateExtractionJob(jobId, {
      status: 'completed',
      progress: 100,
      metadata,
      zipPath,
      jsonPath,
      completedAt: new Date(),
      imagesFound: images.length,
      totalImageSize
    });

    await addLog('INFO', `Extraction completed successfully! Found ${images.length} images.`);

    // Clean up original file and temp directory
    try {
      await fs.unlink(pdfPath);
      // Keep output directory for now, cleanup could be handled by a separate process
    } catch (error) {
      await addLog('WARN', 'Failed to clean up temporary files');
    }

  } catch (error) {
    await addLog('ERROR', `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    await storage.updateExtractionJob(jobId, { 
      status: 'failed', 
      errorMessage: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
