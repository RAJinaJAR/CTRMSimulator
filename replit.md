# CTRM Testing Platform

## Overview

This is a CTRM (Commodity Trading and Risk Management) interface testing platform built with a modern full-stack architecture. The application allows users to upload video recordings of interface interactions, automatically extracts frames, and creates interactive hotspot-based tests to evaluate user interface comprehension and navigation skills.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API**: RESTful API with JSON responses
- **File Upload**: Multer for handling video file uploads
- **Video Processing**: FFmpeg for frame extraction from uploaded videos

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Session Storage**: PostgreSQL-based session storage with connect-pg-simple

## Key Components

### Database Schema
- **users**: User authentication and management
- **test_sessions**: Main test session data including extracted frames and hotspot configurations
- **test_attempts**: Individual user interactions with hotspots
- **test_results**: Aggregated test performance metrics

### Frontend Components
- **TestInterface**: Main application page coordinating all test functionality
- **TestDisplay**: Interactive frame display with clickable hotspots
- **ControlSidebar**: Test management and performance metrics display
- **FeedbackModal**: Real-time feedback for user interactions
- **ResultsScreen**: Comprehensive test completion summary

### Backend Services
- **Video Upload API**: Handles file upload and frame extraction using FFmpeg
- **Test Session Management**: CRUD operations for test sessions
- **Performance Tracking**: Records and analyzes user interactions
- **Storage Layer**: Abstracted data access with both in-memory and database implementations

## Data Flow

1. **Video Upload**: User uploads MP4/MOV video files
2. **Frame Extraction**: Server uses FFmpeg to extract frames at 1 frame per 3 seconds
3. **Hotspot Configuration**: System processes extracted frames and sets up interactive hotspots
4. **Test Execution**: Users interact with hotspots while system tracks performance metrics
5. **Results Analysis**: Application calculates accuracy, timing, and provides comprehensive feedback

## External Dependencies

### Core Technologies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management and caching
- **multer**: File upload middleware for Express
- **FFmpeg**: Video processing (system dependency)

### UI Libraries
- **@radix-ui/***: Accessible UI primitives for complex components
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe component variants
- **cmdk**: Command palette and search functionality

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production builds
- **@replit/vite-plugin-***: Replit-specific development enhancements

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20, Web, and PostgreSQL 16 modules
- **Process**: `npm run dev` starts development server with hot reloading
- **Port Configuration**: Application runs on port 5000, exposed as port 80

### Production Build
- **Build Process**: Vite builds frontend assets, esbuild bundles server code
- **Output**: Static assets in `dist/public`, server bundle in `dist/index.js`
- **Deployment Target**: Autoscale deployment on Replit infrastructure

### Environment Configuration
- **Database**: PostgreSQL connection via DATABASE_URL environment variable
- **File Storage**: Local file system for uploaded videos and extracted frames
- **Session Management**: Database-backed sessions for user state persistence

## Changelog
- June 20, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.