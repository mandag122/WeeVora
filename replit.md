# WeeVora - Lake County Summer Camp Directory

## Overview

WeeVora is a summer camp discovery and planning platform for families in Lake County, Illinois. The core value proposition is "Never miss registration again" - it aggregates camp information from multiple providers into a searchable directory with proactive registration status tracking.

Key features:
- Comprehensive camp directory with filtering by age, location, category, and price
- Registration status tracking (open, closed, upcoming, waitlist)
- Session selection with calendar visualization for summer planning
- Paper-craft aesthetic design with warm, playful branding

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with custom design tokens for WeeVora brand colors (eggplant purple, sunny gold, etc.)
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Build Tool**: Vite with path aliases (`@/` for client src, `@shared/` for shared code)

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **API Pattern**: RESTful endpoints under `/api/` prefix
- **Data Source**: Airtable as primary database (fetches camps and sessions via Airtable API)
- **Session Storage**: In-memory storage with connect-pg-simple available for PostgreSQL sessions

### Data Layer
- **ORM**: Drizzle ORM configured for PostgreSQL (schema in `shared/schema.ts`)
- **Validation**: Zod schemas for type-safe data validation
- **Database**: PostgreSQL connection via `DATABASE_URL` environment variable

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components (CampCard, Filters, Calendar, etc.)
    pages/        # Route pages (Home, Camps, CampDetail, etc.)
    hooks/        # Custom React hooks
    lib/          # Utilities and query client
server/           # Express backend
  routes.ts       # API route definitions
  airtable.ts     # Airtable integration
  storage.ts      # Data storage abstraction
shared/           # Shared types and schemas
  schema.ts       # Zod schemas and TypeScript types
```

### Key Design Patterns
- Shared schema definitions between frontend and backend via `@shared/` alias
- API requests use TanStack Query with automatic caching
- Component-based architecture with shadcn/ui for consistent styling
- Mobile-first responsive design with dedicated mobile hooks

## External Dependencies

### Data Sources
- **Airtable**: Primary data store for camp and session information
  - Requires `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID` environment variables
  - Tables: Camps, Registration Options (sessions)

### Database
- **PostgreSQL**: Required for Drizzle ORM and session storage
  - Requires `DATABASE_URL` environment variable
  - Schema migrations in `/migrations` directory
  - Push schema with `npm run db:push`

### Frontend Libraries
- React Query for data fetching
- date-fns for date manipulation
- Radix UI primitives for accessible components
- Embla Carousel for carousel components
- React Hook Form with Zod resolver for form handling

### Fonts
- Poppins (primary UI font)
- Caveat (handwritten/decorative font for hero sections)
- Loaded via Google Fonts CDN