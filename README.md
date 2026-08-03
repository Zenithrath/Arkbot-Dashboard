# Arkbot Dashboard

Web dashboard for the Arkbot system. Provides a chat interface, document management, and an administrative panel built on modern web technologies.

## Features

- AI-powered chat interface with conversation history
- User authentication with account management
- Admin panel with:
  - Document management (list, search, organize into folders)
  - File uploads
  - Chat monitoring and direct replies to users
  - Registration management
- Notification bell for important updates
- Responsive, accessible UI components

## Tech Stack

- [React 19](https://react.dev) with TypeScript
- [Vite](https://vitejs.dev) as build tool
- [Tailwind CSS 4](https://tailwindcss.com) for styling
- [Supabase](https://supabase.com) for authentication, database, and edge functions
- [n8n](https://n8n.io) workflows as backend services
- [Radix UI](https://www.radix-ui.com) for accessible primitives
- [React Router](https://reactrouter.com) for routing

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm
- A Supabase project (authentication and database)
- n8n workflows for chat and document services

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description |
| -------- | ----------- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) API key |
| `VITE_CHAT_API_KEY` | API key for the chat backend service |

The `.env` file is gitignored and must never be committed to the repository.

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

### Preview production build

```bash
npm run preview
```

## Supabase Setup

The project includes database migrations and an edge function:

- `supabase/migrations/` - SQL migrations for the database schema
- `supabase/functions/delete-auth-user/` - edge function for account deletion

Apply migrations to your Supabase project and deploy edge functions as needed.

## Deployment

### Docker

A multi-stage Dockerfile builds the static assets and serves them with nginx:

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=... \
  --build-arg VITE_SUPABASE_ANON_KEY=... \
  --build-arg VITE_CHAT_API_KEY=... \
  -t arkbot-dashboard .
```

### Easypanel

A dedicated `Dockerfile.easypanel` is included for Easypanel deployments.

## Project Structure

```
src/
  components/   Reusable UI components
  hooks/        Custom React hooks
  lib/          Utilities and service clients
  pages/        Route-level pages
supabase/
  functions/    Edge functions
  migrations/   Database migrations
docs/           Workflow and integration documentation
```

## License

Private project.
