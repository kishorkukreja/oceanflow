# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OceanFlow is a maritime logistics optimization platform that combines market index-based rate predictions with Monte Carlo simulations for pricing and transit time uncertainty. The system provides integrated decision-making tools for logistics professionals to evaluate quotes, analyze alternatives (wait, split, reroute), and perform risk-adjusted evaluations with probabilistic outcomes.

## Development Commands

### Start Development Server
```bash
npm run dev
```
Runs both the Express backend (server/index.ts) and Vite dev server with HMR. The application serves on port 5000 by default (configurable via PORT environment variable).

### Type Checking
```bash
npm run check
```
Runs TypeScript compiler in check mode across client, server, and shared code.

### Build for Production
```bash
npm run build
```
Builds the Vite frontend to `dist/public` and bundles the Express backend to `dist/index.js` using esbuild.

### Run Production Build
```bash
npm start
```
Starts the production server from `dist/index.js`.

### Database Schema Management
```bash
npm run db:push
```
Pushes Drizzle schema changes to PostgreSQL database. Requires `DATABASE_URL` environment variable.

## Architecture

### Monorepo Structure

- **client/**: React frontend application
  - `src/pages/`: Full-page route components (dashboard, lanes, simulation, quotes, alternatives, risk, shipments, workflow)
  - `src/components/`: Reusable UI components organized by domain (chatbot, decision, layout, notifications, simulation, ui, visualization)
  - `src/lib/`: Utility functions (queryClient, statistics, utils)
  - `src/store/`: Zustand stores (simulation-store)
  - `src/hooks/`: Custom React hooks (use-mobile, use-toast)

- **server/**: Express.js backend
  - `index.ts`: Entry point, middleware setup, port binding
  - `routes.ts`: REST API route definitions for all resources
  - `storage.ts`: Storage abstraction layer (IStorage interface + implementations)
  - `vite.ts`: Vite dev server integration and static file serving

- **shared/**: TypeScript definitions and schemas shared between client/server
  - `schema.ts`: Drizzle ORM table definitions and Zod validation schemas for lanes, simulations, quotes, alternatives, market indices, shipments, automation processes, vendor evaluations, process documents/actions

### Path Aliases

The project uses TypeScript path aliases:
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets/*` → `attached_assets/*`

### Data Flow Architecture

1. **API Layer**: Express REST endpoints in `server/routes.ts` handle CRUD operations
2. **Storage Layer**: `server/storage.ts` defines IStorage interface with implementations for PostgreSQL (Drizzle ORM) and in-memory fallback (MemStorage)
3. **Validation Layer**: Zod schemas in `shared/schema.ts` validate all API inputs/outputs
4. **Client State**: TanStack Query manages server state, Zustand manages simulation state
5. **Computation Layer**: Web Workers (`monte-carlo-worker.ts`) run Monte Carlo simulations off the main thread

### Monte Carlo Simulation System

The simulation system is the core of the application's analytical capabilities:

- **Entry Point**: `client/src/pages/simulation.tsx` provides UI for configuring and running simulations
- **Rate Simulator**: `client/src/components/simulation/rate-simulator.tsx` handles market index-based rate predictions
- **Transit Simulator**: `client/src/components/simulation/transit-simulator.tsx` models multi-segment transit times with uncertainty
- **Worker Process**: `client/src/components/simulation/monte-carlo-worker.ts` performs statistical calculations using multiple probability distributions (normal, lognormal, triangular, exponential)
- **State Management**: `client/src/store/simulation-store.ts` manages simulation parameters and results with Zustand
- **Statistical Functions**: `client/src/lib/statistics.ts` provides probability distribution implementations

### Database Schema Key Entities

- **users**: Authentication (username/password)
- **lanes**: Shipping lanes with origin/destination, market indices, volatility, segments, factors
- **simulations**: Monte Carlo simulation runs with rate/transit distributions, iterations, results
- **quotes**: Carrier quotes with rates, validity, evaluations, recommendations
- **alternatives**: Alternative strategies for quotes (wait, split, reroute)
- **marketIndices**: Market index codes, values, names, categories
- **shipments**: Shipment tracking with cargo details, status, routes, timestamps
- **automationProcesses**: Workflow automation with statuses, dependencies, milestones
- **vendorEvaluations**: Vendor assessments with ratings, recommendations
- **processDocuments**: Generated shipping documents (invoices, BOL, customs, certificates)
- **processActions**: Workflow actions with types, statuses, outcomes

### UI Component System

- **Base Library**: shadcn/ui components built on Radix UI primitives (located in `client/src/components/ui/`)
- **Styling**: Tailwind CSS with custom configuration in `tailwind.config.ts`
- **Theme**: CSS variables in `client/src/index.css` for consistent design tokens
- **Icons**: Lucide React for iconography
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod resolver for validation

### Workflow System

The workflow page (`client/src/pages/workflow.tsx`) orchestrates shipment automation with tabs for:
- Quote analysis and carrier selection
- Decision logic for optimal booking strategies
- Documentation generation and review
- Approval tracking for stakeholder sign-offs

## Development Guidelines

### Adding New API Endpoints

1. Define schema in `shared/schema.ts` with Drizzle table + Zod validation
2. Add methods to IStorage interface in `server/storage.ts`
3. Implement methods in both DbStorage (Drizzle) and MemStorage classes
4. Create REST endpoints in `server/routes.ts` using schema.parse() for validation
5. Use TanStack Query hooks in client components for API calls

### Working with Simulations

- Simulations run in Web Workers to avoid blocking the UI thread
- State is managed globally via Zustand in `simulation-store.ts`
- Results include probability distributions, confidence intervals, percentiles
- The system supports multiple distribution types for different uncertainty models

### Database Changes

1. Modify table definitions in `shared/schema.ts`
2. Run `npm run db:push` to sync schema to PostgreSQL
3. Update IStorage interface and implementations in `server/storage.ts`
4. Migrations are stored in `./migrations/` directory

### Adding New Pages

1. Create page component in `client/src/pages/`
2. Add route in `client/src/App.tsx` Switch component
3. Add navigation link in `client/src/components/layout/sidebar.tsx`
4. Use TanStack Query for data fetching, Zod schemas for validation

## Environment Configuration

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string (required for db:push and production)
- `PORT`: Server port (defaults to 5000)
- `NODE_ENV`: Set to "development" or "production"

## Tech Stack Summary

- **Frontend**: React 18, TypeScript, Wouter, TanStack Query, Zustand
- **UI**: shadcn/ui, Radix UI, Tailwind CSS, Lucide React
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod with drizzle-zod
- **Build**: Vite (frontend), esbuild (backend)
- **Development**: tsx for TypeScript execution, hot module replacement

## Key Patterns

- All API routes follow REST conventions with proper HTTP status codes
- All database operations go through the IStorage abstraction (no direct Drizzle queries in routes)
- Zod schemas provide runtime validation and TypeScript types (via drizzle-zod)
- Web Workers handle CPU-intensive Monte Carlo simulations
- TanStack Query provides caching, refetching, and optimistic updates
- Path aliases (@/, @shared/) keep imports clean and consistent
