# Rural Entrepreneurship Scheme Platform

## Overview

This is a comprehensive web application designed for rural entrepreneurs and farmers in India to discover and apply for government schemes, loans, and subsidies. The platform emphasizes accessibility for users with varying digital literacy levels through a visual-first design approach, multilingual support (English, Kannada, Hindi), and simplified navigation.

The application provides scheme discovery with eligibility matching, multi-step application workflows with progress saving, application status tracking, an AI-powered multilingual chatbot for assistance, and admin capabilities for scheme and application management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool and development server.

**UI Component Library**: Shadcn/ui (Radix UI primitives) with a custom "new-york" style theme, providing accessible and composable components.

**Styling Approach**: Tailwind CSS with custom design tokens for colors, spacing, and typography. CSS variables are used for theming with light/dark mode support. The design emphasizes visual communication over text with large, readable fonts (minimum 16px) and generous spacing (Tailwind units: 4, 6, 8, 12, 16).

**Typography**: Noto Sans font family with support for Devanagari (Hindi) and Kannada scripts, loaded via Google Fonts CDN for multilingual text rendering.

**State Management**: TanStack React Query for server state management, with session-based authentication handled via HTTP-only cookies.

**Routing**: Wouter for lightweight client-side routing with protected routes for authenticated and admin-only pages.

**Internationalization**: Custom context-based language switching between English, Kannada, and Hindi with translation dictionaries stored in the LanguageContext.

**Design Philosophy**: Mobile-first responsive design with visual indicators (icons, color coding by category), high contrast for visibility, and pictorial representations prioritized over text-heavy interfaces.

### Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js, serving both API endpoints and static frontend assets in production.

**Session Management**: Express-session with PostgreSQL session store (connect-pg-simple) for persistent, server-side session storage. Sessions use HTTP-only cookies for security.

**Authentication**: Password hashing with bcrypt (10 salt rounds), phone number-based user identification, role-based access control (regular users vs. admin users).

**API Design**: RESTful API endpoints organized by resource:
- `/api/auth/*` - Authentication (signup, login, logout)
- `/api/user/*` - User profile management
- `/api/schemes/*` - Scheme catalog and recommendations
- `/api/applications/*` - Application CRUD and status tracking
- `/api/chat/*` - Chatbot message handling
- `/api/admin/*` - Admin operations for schemes and applications

**AI Integration**: OpenAI API (GPT-5 model) for multilingual chatbot responses, with language-aware prompting based on user's selected language.

**Error Handling**: Centralized error responses with appropriate HTTP status codes, validation using Zod schemas derived from Drizzle ORM table definitions.

### Data Storage

**Database**: PostgreSQL (via Neon serverless) with connection pooling using `@neondatabase/serverless`.

**ORM**: Drizzle ORM for type-safe database queries and schema management.

**Schema Design**:
- **users**: User profiles with authentication credentials, demographic data (state, district, occupation, income, land ownership), and admin flags
- **schemes**: Government scheme catalog with multilingual content (English, Kannada, Hindi), eligibility criteria (JSON), benefits, required documents, deadlines, and official URLs
- **applications**: User applications linking to schemes, storing form data (JSON), current step, status, and timestamps
- **documents**: File metadata for uploaded user documents associated with applications
- **applicationStatusHistory**: Audit trail for application status changes with timestamps and notes
- **chatMessages**: Chat conversation history with user messages and bot responses, language tracking

**Relationships**: One-to-many between users and applications/chat messages, many-to-one between applications and schemes, one-to-many between applications and documents/status history.

**Data Validation**: Zod schemas generated from Drizzle table definitions for runtime validation of API inputs.

### External Dependencies

**Third-Party Services**:
- **OpenAI API**: GPT-5 model for chatbot functionality with multilingual support
- **Neon Database**: Serverless PostgreSQL hosting with WebSocket connections
- **Google Fonts**: CDN for Noto Sans font family (multilingual support)

**Key NPM Packages**:
- **@tanstack/react-query**: Server state management and caching
- **drizzle-orm & drizzle-kit**: Type-safe ORM and migrations
- **bcrypt**: Password hashing
- **express-session**: Session middleware
- **connect-pg-simple**: PostgreSQL session store
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Zod integration for form validation
- **zod & drizzle-zod**: Schema validation
- **wouter**: Lightweight routing
- **class-variance-authority & clsx**: Dynamic className composition
- **date-fns**: Date manipulation

**Development Tools**:
- **Vite**: Fast development server with HMR
- **TypeScript**: Static type checking
- **ESBuild**: Production bundling for server code
- **Replit Plugins**: Runtime error overlay, cartographer, dev banner (development only)

**UI Components**: Radix UI primitives for accessible, unstyled components (accordion, alert-dialog, avatar, checkbox, dialog, dropdown-menu, form controls, navigation-menu, popover, progress, radio-group, scroll-area, select, separator, slider, switch, tabs, toast, tooltip, etc.)

**Notable Architectural Decisions**:
- PostgreSQL chosen over MongoDB (despite initial requirements) for relational data integrity and support for JSON fields where needed
- Session-based authentication instead of JWT for simpler server-side session management and revocation
- Monorepo structure with shared types/schemas between client and server for type safety
- Visual-first design to accommodate users with limited digital literacy
- Multi-step application forms with auto-save to draft state for improved user experience
- Status history tracking for application transparency and audit trails