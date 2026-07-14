# Project Structure

The project is a monorepo with two independent apps: `backend/` and `frontend/`.

```
Railway-Controll/
├── backend/                        # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma           # Source of truth for the data model
│   │   ├── prisma.service.ts       # PrismaService (extends PrismaClient, global singleton)
│   │   ├── prisma.module.ts        # @Global() PrismaModule — import once in AppModule
│   │   └── migrations/             # Migration history (auto-managed by Prisma)
│   ├── src/
│   │   ├── generated/client/       # Auto-generated Prisma client — DO NOT edit manually
│   │   ├── app.module.ts           # Root NestJS module
│   │   ├── app.controller.ts
│   │   ├── app.service.ts
│   │   ├── main.ts                 # Bootstrap entry point (port from PORT env or 3000)
│   │   └── schema.gql              # Auto-generated GraphQL schema (code-first, do not edit)
│   ├── test/                       # e2e tests
│   ├── .env                        # Local environment variables (DATABASE_URL)
│   ├── prisma.config.ts            # Prisma CLI config
│   └── nest-cli.json
│
└── frontend/                       # React + Vite SPA
    ├── public/
    │   ├── favicon.svg
    │   └── icons.svg               # SVG sprite sheet
    ├── src/
    │   ├── assets/                 # Static images/icons imported in components
    │   ├── App.tsx                 # Root component (currently scaffold)
    │   ├── main.tsx                # ReactDOM entry point
    │   ├── App.css
    │   └── index.css               # Global styles (Tailwind base)
    └── vite.config.ts
```

## Backend Conventions

- **Modules**: Each feature gets its own NestJS module (e.g., `OrdersModule`, `TripsModule`) with a resolver, service, and DTOs folder.
- **GraphQL**: Code-first. Use `@ObjectType`, `@InputType`, `@Query`, `@Mutation`, `@Resolver` decorators. The schema at `src/schema.gql` is auto-generated — never edit it directly.
- **Database access**: Inject `PrismaService` from `PrismaModule`. Since `PrismaModule` is `@Global()`, it does not need to be imported per-feature module.
- **Passwords**: Hash with `bcryptjs` before persisting. Never store or return plaintext passwords.
- **File placement**: Feature modules go under `src/<feature>/` (e.g., `src/orders/`, `src/trips/`).
- **Schema changes**: Edit `prisma/schema.prisma`, then run `npx prisma migrate dev` and `npx prisma generate`.

## Frontend Conventions

- The frontend is currently a scaffold — routing, state, and pages have not been built yet.
- Use React Router DOM for routing, Redux for global state, React Hook Form + Zod for forms.
- Style with Tailwind CSS utility classes; avoid writing custom CSS unless necessary.
- Use Axios for all API calls to the backend GraphQL endpoint.
- Use Lucide React for icons, React Hot Toast for user notifications.
- File index.ts : in frontend side in each folder create index.ts file, each files on the other folder want to import a component, function,... from this folder  this will import from this index.ts file to reduce the import command in each file