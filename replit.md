# FreelanceHub - Project Management System

## Overview
FreelanceHub is a full-stack web application designed for freelancers to manage client projects. It provides separate dashboards for clients and administrators, featuring project tracking, status updates, file sharing through Google Drive links, and real-time progress monitoring.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js 20 with TypeScript
- **Framework**: Express.js for REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: Basic in-memory authentication (production would use proper session management)
- **Development Server**: Custom Vite middleware integration for full-stack development

### Database Schema (PostgreSQL)
```sql
-- Users table for both clients and admins
users: {
  id: serial primary key,
  email: text unique not null,
  password: text not null,
  name: text not null,
  role: text default 'client', -- 'client' or 'admin'
  created_at: timestamp default now()
}

-- Projects table for client work
projects: {
  id: serial primary key,
  name: text not null,
  description: text not null,
  status: text default 'in-progress', -- 'in-progress', 'waiting-feedback', 'complete'
  completion_percentage: integer default 0,
  notes: text,
  drive_link: text,
  client_id: integer not null,
  created_at: timestamp default now(),
  updated_at: timestamp default now()
}
```

## Key Components

### Authentication & Authorization
- Role-based access control (client/admin)
- Local storage for session persistence
- Protected routes based on user roles
- Basic password authentication (would be enhanced with proper hashing in production)

### Client Dashboard Features
- View assigned projects with status and progress
- Update Google Drive links for project files
- Real-time project status tracking
- Progress visualization with progress bars
- Status badges with color coding

### Admin Dashboard Features
- Overview statistics (total clients, active projects, pending feedback)
- Complete project management (CRUD operations)
- Client management and project assignment
- Project status and completion percentage updates
- Bulk project view with filtering and sorting

### UI/UX Design System
- Consistent design language using Shadcn/ui components
- Responsive design for mobile and desktop
- Dark/light theme support via CSS custom properties
- Loading states and error handling
- Toast notifications for user feedback

## Data Flow

### Authentication Flow
1. User submits login credentials
2. Backend validates against database
3. User data stored in localStorage
4. AuthContext provides user state across app
5. Protected routes check authentication status

### Project Management Flow
1. Admin creates projects and assigns to clients
2. Client views projects in their dashboard
3. Client can update drive links and view progress
4. Admin can update project status and completion percentage
5. Real-time updates via React Query cache invalidation

### API Communication
- RESTful API endpoints for all operations
- Standardized error handling and response formats
- Request/response validation using Zod schemas
- Optimistic updates with React Query mutations

## External Dependencies

### Core Libraries
- **React Ecosystem**: React, React DOM, React Hook Form
- **State Management**: TanStack Query for server state
- **Validation**: Zod for schema validation
- **UI Components**: Radix UI primitives, Lucide React icons
- **Styling**: Tailwind CSS, class-variance-authority for variants
- **Database**: Drizzle ORM with PostgreSQL dialect
- **Development**: Vite, TypeScript, ESBuild

### Database Provider
- Uses Neon Database (@neondatabase/serverless) for PostgreSQL hosting
- Drizzle Kit for database migrations and schema management
- Connection pooling and serverless-optimized queries

## Deployment Strategy

### Development Environment
- Vite dev server with HMR (Hot Module Replacement)
- TypeScript compilation with strict mode
- Replit integration with auto-restart on changes
- PostgreSQL 16 module for database services

### Production Build
- Vite builds optimized client bundle to `dist/public`
- ESBuild bundles server code to `dist/index.js`
- Static file serving from Express
- Environment-based configuration (DATABASE_URL required)

### Replit Configuration
- **Modules**: nodejs-20, web, postgresql-16
- **Ports**: Application runs on port 5000
- **Auto-deployment**: Configured for autoscale deployment target
- **Build Commands**: `npm run build` for production assets

## Recent Changes
- June 25, 2025: Initial setup with complete freelance client management system
- Enhanced Google Drive link functionality with better UX for both clients and admins
- Improved admin notes display with visual styling and clear labeling
- Added proper role-based permissions for Drive link access (clients edit, admins view-only)
- Successfully connected to Supabase database with user credentials
- Converted all database operations from in-memory storage to Supabase integration
- Users can now sign up and their data persists in the actual Supabase database

## User Preferences
Preferred communication style: Simple, everyday language.