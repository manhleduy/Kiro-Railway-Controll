# Tech Stack

## Backend

- **Runtime**: Node.js
- **Framework**: NestJS 11 (modular, decorator-based)
- **API**: GraphQL via `@nestjs/graphql` + Apollo Driver (code-first, auto-schema generation to `src/schema.gql`)
- **ORM**: Prisma 7 with `prisma-client` generator; client output at `src/generated/client`
- **Database adapter**: `@prisma/adapter-pg` (PostgreSQL via `PrismaPg`)
- **Database**: PostgreSQL (connection string in `backend/.env` as `DATABASE_URL`)
- **Auth utilities**: `bcryptjs` for password hashing
- **Real-time**: `socket.io` available
- **Email**: `nodemailer` available
- **Language**: TypeScript 5.7, target ES2023, `experimentalDecorators` and `emitDecoratorMetadata` enabled (required for NestJS)

## Frontend

- **Framework**: React 19 with TypeScript 6
- **Build tool**: Vite 8 with `@vitejs/plugin-react`
- **Styling**: Tailwind CSS 4
- **Routing**: React Router DOM 7
- **State management**: Redux 5
- **Forms**: React Hook Form 7 + Zod 4 for validation
- **HTTP client**: Axios
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Common Commands

### Backend (`cd backend`)

```bash
# Development (watch mode)
npm run start:dev

# Build
npm run build

# Production
npm run start:prod

# Tests
npm run test           # unit tests (Jest)
npm run test:e2e       # end-to-end tests

# Lint & format
npm run lint
npm run format

# Prisma
npx prisma migrate dev        # create and apply a migration
npx prisma migrate deploy     # apply pending migrations
npx prisma generate           # regenerate the Prisma client
npx prisma studio   

# Generate new module
nest generate module module-name
# Generate a new service
nest generate service service-name

```

### Frontend (`cd frontend`)

```bash
# Development server
npm run dev

# Build
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## Configuration

- Backend environment variables live in `backend/.env` — `DATABASE_URL` is required.
- NestJS compiles to `backend/dist/`; source maps are enabled.
- GraphQL playground is enabled (`playground: true`) — available at `/graphql` in dev.
- Prisma schema is at `backend/prisma/schema.prisma`; generated client is at `backend/src/generated/client`.

## Strict Directory & File rules
- **Component PLacement**:
    - Shared/Generic UI components: `frontend/src/components/ui/`
    - Custom Hook: `frontend/src/hooks`
    - Styling files: `frontend/src/styles
    - reusable utility functions: 'frontend/src/utils
    - Api calls and external interfaction: `frontend/src/services`
    - Page for this project: `frontend/src/pages`
    - manage global state: `frontend/src/redux`

- **Backend Files Arragement**
    - root module: app.module.ts
    - features specific modules : `backend/src/modules
    - Decorators, filters, guards, interceptors, pipes: `backend/src/commons
    - Configuration files: `backend/src/configs
    - utiilty: functions: `backend/src/ utils
    - 

## Agent Operational Guardrails (The "Laws")
1. **Plan Before Writing**: Before editing or creating any file, you MUST print a "File Impact Plan" outlining which files you intend to create or modify. Ask the user for confirmation.
