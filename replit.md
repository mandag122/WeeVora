# WeeVora - Lake County Summer Camp Directory

## Overview
WeeVora is a comprehensive summer camp discovery and planning platform for families in Lake County, Illinois. The platform aggregates camp information from Airtable into a searchable directory with calendar planning features.

**Tagline:** "Never miss registration again"

## Recent Changes
- **Jan 31, 2026:** Camp card and filter enhancements
  - Color banner at top of each camp card matching category/calendar color
  - Registration status badges (Open, Closed, Waitlist Only, Opens [date])
  - Extended hours displayed below regular hours on cards
  - New filter: Camp schedule availability (Full Week, Partial Week, Daily Drop-in)
  - Camp schedule field added from Airtable multi-select

- **Jan 31, 2026:** Extended hours and pricing update
  - Extended hours toggle in SessionSelector (Standard/Extended modes)
  - Sessions display separate pricing for standard and extended hours
  - Both standard and extended selections can be retained simultaneously
  - Camp cards show extended hours info when available
  - Cards only gray out when missing registrationOpens (not just unknown status)
  - Sorting deprioritizes camps without registrationOpens date
  - Calendar displays pricing for selected sessions

- **Jan 31, 2026:** Initial MVP implementation
  - Airtable integration for camps and registration options
  - Camp directory with search, filters, and sorting
  - Camp detail pages with session selection
  - Calendar component with expand/print functionality
  - Contact form saving to Airtable Feedback table

## Tech Stack
- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS with custom WeeVora theme
- **Backend:** Express.js
- **Data Source:** Airtable (Camp Copilot base)
- **State Management:** TanStack Query (React Query)

## Project Architecture

### Frontend Structure
```
client/src/
├── assets/           # Logo, icons, hero images
├── components/       # Reusable UI components
│   ├── ui/          # Shadcn components
│   ├── Header.tsx   # Site header with navigation
│   ├── Footer.tsx   # Site footer
│   ├── Hero.tsx     # Homepage hero section
│   ├── Features.tsx # Features section
│   ├── Stats.tsx    # Stats section
│   ├── CampCard.tsx # Camp listing card
│   ├── CampFilters.tsx    # Filter sidebar/sheet
│   ├── SessionCalendar.tsx # Calendar with print
│   └── SessionSelector.tsx # Session picker
├── pages/           # Route pages
│   ├── Home.tsx
│   ├── Camps.tsx
│   ├── CampDetail.tsx
│   ├── HowItWorks.tsx
│   └── Contact.tsx
└── App.tsx          # Router setup
```

### Backend Structure
```
server/
├── airtable.ts      # Airtable API integration
├── routes.ts        # Express API routes
├── index.ts         # Server entry point
└── storage.ts       # Storage interface
```

### API Routes
- `GET /api/camps` - Fetch all camps
- `GET /api/camps/:slug` - Fetch single camp
- `GET /api/camps/:slug/sessions` - Fetch sessions for a camp
- `GET /api/camps/:slug/similar` - Fetch similar camps
- `POST /api/contact` - Submit contact form

## Airtable Configuration
The app connects to an Airtable base with the following tables:
- **Camps** - Main camp listings
- **Registration_Options** - Session/registration options per camp
- **Feedback** - Contact form submissions

Required environment secrets:
- `AIRTABLE_API_KEY` - Personal Access Token with read/write access
- `AIRTABLE_BASE_ID` - Base ID (starts with "app")

## Design System

### Brand Colors
- Eggplant Purple: `#5B2C6F` - Primary brand color
- Sunny Gold: `#F9B233` - CTAs and highlights
- Forest Green: `#558B2F` - Success states
- Deep Teal: `#117A8B` - Headers, badges
- Warm Coral: `#FF7043` - Arts category
- Rose Pink: `#C2395A` - Performing arts

### Typography
- Primary: Poppins (400-700)
- Decorative: Caveat (handwritten style)

### Visual Style
- Paper-craft aesthetic with organic shapes
- Elevated cards with subtle shadows
- Pill-shaped buttons
- 20px border radius on cards

## Key Features

### Camp Directory
- Search by name, organization, description
- Filter by category, age, location, price
- Filter by registration status (all, open, upcoming)
- Sort by registration date or name

### Calendar Planning
- Select camp sessions to add to calendar
- View monthly calendar with selected sessions
- Expand to full-screen view
- Print schedule with session list

### Registration Status
Priority order:
1. Closed (past registration deadline)
2. Upcoming (registration not yet open)
3. Waitlist Only
4. Open (registration currently open)
5. Unknown (no dates available)

## Development

### Running the App
```bash
npm run dev
```
The app runs on port 5000.

### Environment Variables
Secrets are managed through Replit Secrets. Required:
- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `SESSION_SECRET`
