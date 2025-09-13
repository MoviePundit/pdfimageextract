# PDF Image Extractor

## Overview

This is a full-stack PDF image extraction application that allows users to upload PDF files and extract all images from them. The application provides real-time processing status updates and allows users to download the extracted images as a ZIP file. Built with React frontend, Express backend, and PostgreSQL database using modern web technologies.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Custom component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Database ORM**: Drizzle ORM for type-safe database operations
- **File Processing**: PDF parsing and image extraction using Sharp for image processing
- **File Upload**: Multer middleware for handling PDF file uploads
- **Storage Strategy**: In-memory storage with planned PostgreSQL persistence

### Database Design
- **Primary Database**: PostgreSQL (configured via DATABASE_URL)
- **Schema Management**: Drizzle migrations in `./migrations` directory
- **Key Tables**:
  - `users`: User authentication and management
  - `extraction_jobs`: PDF processing jobs with status tracking, progress monitoring, and metadata storage

### Real-time Features
- **Job Processing**: Asynchronous PDF processing with real-time status updates
- **Progress Tracking**: Multi-stage processing (parsing, extracting, zipping) with detailed progress indicators
- **Logging System**: Comprehensive logging with different levels (INFO, DEBUG, WARN, ERROR)

### File Processing Pipeline
- **Upload Stage**: PDF validation and temporary storage
- **Parsing Stage**: PDF analysis to determine page count and structure
- **Extraction Stage**: Image extraction from PDF pages with metadata collection
- **Compression Stage**: ZIP archive creation of all extracted images
- **Cleanup**: Temporary file management and storage optimization

### API Structure
- **File Upload Endpoint**: `POST /api/extract` for PDF upload and job creation
- **Job Status Endpoint**: `GET /api/jobs/:id` for real-time status polling
- **Download Endpoints**: Separate endpoints for ZIP and JSON metadata downloads
- **Error Handling**: Comprehensive error responses with appropriate HTTP status codes

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL serverless database via `@neondatabase/serverless`
- **UI Framework**: Radix UI component primitives for accessible UI components
- **Image Processing**: Sharp library for image manipulation and optimization
- **PDF Processing**: PDF parsing libraries for content extraction
- **File Compression**: JSZip for creating downloadable archives

### Development Tools
- **Type Safety**: TypeScript with strict configuration
- **Code Quality**: ESLint and Prettier (implied by modern React setup)
- **Development Server**: Vite development server with HMR
- **Database Tools**: Drizzle Kit for schema management and migrations

### Authentication & Session Management
- **Session Storage**: PostgreSQL session storage via `connect-pg-simple`
- **User Management**: Custom user schema with username/password authentication

### Deployment Considerations
- **Environment Variables**: DATABASE_URL required for PostgreSQL connection
- **Build Process**: Separate client and server builds with Vite and esbuild
- **File Storage**: Temporary upload directory with configurable cleanup
- **Process Management**: Asynchronous job processing with error recovery