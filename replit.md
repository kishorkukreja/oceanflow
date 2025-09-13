# Overview

This is a comprehensive maritime logistics optimization platform that combines market index-based rate predictions with Monte Carlo simulations for both pricing and transit time uncertainty. The system provides integrated decision-making tools for logistics professionals to evaluate quotes, analyze alternatives (wait, split, reroute), and perform risk-adjusted evaluations with probabilistic outcomes. It's built as a modern full-stack web application focusing on real-time rate optimization and transit analysis.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: Zustand for simulation state management, TanStack Query for server state
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Validation**: Zod for runtime type validation
- **Session Management**: express-session with PostgreSQL store
- **Development**: Hot module replacement with Vite middleware integration

## Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless driver
- **Schema Design**: Relational model with tables for users, lanes, simulations, quotes, alternatives, and market indices
- **Migrations**: Drizzle Kit for database schema migrations
- **In-Memory Fallback**: MemStorage class for development/testing without database

## Core Business Logic
- **Monte Carlo Simulations**: Web Workers for non-blocking statistical calculations with support for multiple probability distributions (normal, lognormal, triangular, exponential)
- **Rate Modeling**: Market index-based predictions using configurable factors and lane-specific ratios
- **Transit Time Analysis**: Multi-segment transit modeling with uncertainty distributions
- **Alternative Evaluation**: Comparative analysis of booking strategies (immediate, wait, split shipments, reroute)
- **Risk Assessment**: Probabilistic scoring and confidence intervals for decision support

## Authentication and Authorization
- **User Management**: Simple username/password authentication
- **Session Storage**: PostgreSQL-backed sessions with connect-pg-simple
- **No Role-Based Access**: Currently single-tenant focused

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database queries and schema management

## UI and Component Libraries
- **Radix UI**: Headless component primitives for accessibility
- **shadcn/ui**: Pre-built component library with consistent design system
- **Lucide React**: Icon library for consistent iconography
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form handling with validation

## Development and Build Tools
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production builds

## Simulation and Analytics
- **Web Workers**: Browser-based parallel processing for Monte Carlo simulations
- **Statistical Distributions**: Custom implementations for various probability distributions
- **Date Utilities**: date-fns for date manipulation and formatting

## Replit-Specific Integrations
- **Runtime Error Overlay**: Replit's error handling plugin
- **Cartographer**: Development tooling integration
- **Dev Banner**: Development environment indicators