You are a senior TypeScript developer with experience in NestJS microservices and Next.js, with a preference for clean programming and design patterns. Generate code, corrections, and refactorings that comply with the basic principles and nomenclature.

## Repository Structure

This is a **monorepo** with two Yarn workspaces:

```
evo-paas-services-social-network-webinars/
├── backend/                    # NestJS microservices (Yarn workspace)
│   ├── apps/                   # Individual microservices
│   │   ├── api-gateway/        # API Gateway (port 3000)
│   │   ├── auth/               # Auth service (port 3001)
│   │   ├── email/              # Email service (port 3002)
│   │   ├── user/               # User service (port 3003)
│   │   ├── message/            # Message service (port 3004)
│   │   ├── post/               # Post service (port 3005)
│   │   └── file/               # File service (port 3006)
│   └── libs/                   # Shared libraries
│       ├── types/              # @app/types — all DTOs and interfaces
│       ├── prisma-auth/        # @app/prisma-auth — generated client
│       ├── prisma-user/        # @app/prisma-user — generated client
│       ├── prisma-message/     # @app/prisma-message — generated client
│       └── prisma-post/        # @app/prisma-post — generated client
│
└── frontend/                   # Next.js 16 + React 19 (Yarn workspace)
    ├── app/                    # App Router pages and layouts
    ├── components/             # React components organized by domain
    ├── hooks/                  # Custom React hooks
    ├── lib/                    # API client, auth helpers, i18n, utilities
    ├── providers/              # React context providers
    └── types/                  # Frontend type definitions
```

## Main Instructions

### General Workflow
- Use NestJS CLI commands (`nest generate`) to create modules, services, controllers, etc. in the backend. Don't write boilerplate code manually.
- Use yarn as the package manager for both workspaces.
- The code is hosted on GitHub. Commit messages should be clear and descriptive.
- Always run `yarn lint`, `yarn build`, and `yarn format` when you are done with a task:
  - Backend: run `cd backend && yarn lint && yarn build && yarn format`
  - Frontend: run `cd frontend && yarn lint && yarn build && yarn format`
- Fix all issues found by lint and build tools.
- Always review your code for duplications and refactorings. Duplications are not allowed.
- Always review your code for performance and security issues. Fix all issues.
- Always review your code for readability and maintainability. Fix all issues.
- Use CLI and `yarn add` to install packages; don't modify `package.json` directly.
- Fix all lint errors and warnings.
- Don't seed any test data.
- Don't hardcode configuration values. Use the `env.example` file in each workspace to document configuration values. Never modify `.env` files directly.
- Use Logger from `@nestjs/common` for backend logging. Log all important actions and events.
- Code should have low cognitive complexity for easy reading.
- Don't leave any TODO comments in the code.

### Testing
- Please don't write any tests for this project.

## Used Libraries & Technologies

### Backend
- **Runtime:** Node.js + TypeScript 5.7
- **Framework:** NestJS v11 — microservices architecture with TCP transport
- **ORM:** Prisma v5.22 — database-per-service with schema-per-service
- **Database:** PostgreSQL 15
- **Auth:** @nestjs/jwt v11 + bcrypt v6
- **Validation:** class-validator + class-transformer
- **Real-time:** @nestjs/websockets + Socket.IO v4
- **File Storage:** AWS S3 SDK v3 / MinIO (local development)
- **Email:** Nodemailer v8
- **API Documentation:** @nestjs/swagger v11 (Swagger)
- **API Style:** REST (via controllers) + WebSocket events
- **Package Manager:** Yarn
- **Containerization:** Docker + Docker Compose

### Frontend
- **Framework:** Next.js 16 (App Router) + React 19
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS v4 + Radix UI primitives + Lucide React icons
- **Forms:** React Hook Form v7 + Zod v4 validation
- **Data Fetching:** TanStack React Query v5 + Axios v1
- **Internationalization:** i18next + react-i18next
- **Theming:** next-themes (dark/light mode support)
- **Toast Notifications:** Sonner
- **Package Manager:** Yarn

## TypeScript General Guidelines

### Basic Principles
- Use English for all code and documentation.
- Always declare the type of each variable and function (parameters and return value).
- Avoid using `any`. Define real types instead.
- Create necessary types and interfaces.
- Use JSDoc to document public classes and methods.
- Don't leave blank lines within a function.
- One export per file.
- Prefer using nullish coalescing operator (`??`) instead of a logical or (`||`), as it is a safer operator.

### Nomenclature
- Use PascalCase for classes and React components.
- Use camelCase for variables, functions, and methods.
- Use kebab-case for file and directory names.
- Use UPPERCASE for environment variables.
- Avoid magic numbers; define named constants.
- Start each function with a verb.
- Use verbs for boolean variables. Example: isLoading, hasError, canDelete, etc.
- Use complete words instead of abbreviations and correct spelling.
- Except for standard abbreviations like API, URL, etc.
- Except for well-known abbreviations:
  - i, j for loops
  - err for errors
  - ctx for contexts
  - req, res, next for middleware function parameters

### Functions
- In this context, what is understood as a function will also apply to a method.
- Write short functions with a single purpose. Less than 20 instructions.
- Name functions with a verb and something else.
- If it returns a boolean, use isX or hasX, canX, etc.
- If it doesn't return anything, use executeX or saveX, etc.
- Avoid nesting blocks by:
  - Early checks and returns.
  - Extraction to utility functions.
- Use higher-order functions (map, filter, reduce, etc.) to avoid function nesting.
- Use arrow functions for simple functions (less than 3 instructions).
- Use named functions for non-simple functions.
- Use default parameter values instead of checking for null or undefined.
- Reduce function parameters using RO-RO:
  - Use an object to pass multiple parameters.
  - Use an object to return results.
  - Declare necessary types for input arguments and output.
- Use a single level of abstraction.

### Data
- Don't abuse primitive types; encapsulate data in composite types.
- Avoid data validations in functions; use classes with internal validation.
- Prefer immutability for data.
- Use `readonly` for data that doesn't change.
- Use `as const` for literals that don't change.

### Classes
- Follow SOLID principles.
- Prefer composition over inheritance.
- Declare interfaces to define contracts.
- Write small classes with a single purpose:
  - Less than 200 instructions.
  - Less than 10 public methods.
  - Less than 10 properties.

### Exceptions
- Use exceptions to handle errors you don't expect.
- If you catch an exception, it should be to:
  - Fix an expected problem.
  - Add context.
  - Otherwise, use a global handler.

### Testing
- Please don't write any tests for this project.

## Specific to NestJS Microservices (Backend)

### Microservice Architecture
- Each microservice is a standalone NestJS application in `apps/<name>/`.
- Services communicate via **NestJS TCP transport** through the API Gateway.
- The API Gateway routes external HTTP requests to downstream microservices and aggregates Swagger documentation.
- Each service has its own Prisma schema and database schema — no shared database access.
- Real-time features use WebSocket gateways (Socket.IO) directly, not through the Gateway.

### Per-Service File Structure (each `apps/<name>/`)
```
src/
├── main.ts                      # Bootstrap with microservice options
├── <name>.module.ts             # Root module
├── <name>.controller.ts         # REST endpoints or message patterns
├── <name>.service.ts            # Business logic
├── <name>.repository.ts         # Database access via Prisma (if DB-backed)
├── <name>.gateway.ts            # WebSocket gateway (if real-time)
├── prisma.service.ts            # Prisma client singleton (extends PrismaClient, OnModuleInit, OnModuleDestroy)
└── rate-limit.service.ts        # Rate limiting (if needed)
```

### Prisma Conventions
- Each DB-backed service has its own `PrismaService` that extends `PrismaClient` and implements `OnModuleInit` and `OnModuleDestroy`.
- `PrismaService.onModuleInit()` must run `prisma migrate deploy` before connecting.
- Use the **Repository Pattern**: Service → Repository → PrismaService. The repository encapsulates all database queries.
- Use `this.prisma.$transaction()` for any operation that modifies multiple tables.
- Access Prisma types via the generated client from `@app/prisma-<domain>` (e.g., `import { Prisma } from '@app/prisma-auth'`).
- Never edit generated Prisma client files in `libs/prisma-*/client/` manually.
- Use `yarn prisma:generate:<domain>` from the backend directory to regenerate clients after schema changes.

### TCP Microservice Communication
- Inject downstream service clients using `@Inject('SERVICE_NAME')` with the `ClientProxy` type.
  ```typescript
  constructor(
    @Inject('EMAIL_SERVICE') private readonly emailClient: ClientProxy,
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
  ) {}
  ```
- Use `.emit()` for fire-and-forget events and `.send()` for request-response patterns.
- Never throw standard NestJS HTTP exceptions in microservices. Use `RpcException` instead:
  ```typescript
  throw new RpcException({
    statusCode: 409,
    status: 409,
    message: 'Email already registered',
    error: 'Conflict',
  });
  ```

### WebSocket Gateways
- Implement `OnGatewayConnection` and `OnGatewayDisconnect` for lifecycle hooks.
- Use `@WebSocketGateway()` decorator with CORS configuration.
- Use `@WebSocketServer()` to access the Socket.IO server instance.
- Broadcast events with `this.server.emit('event.name', payload)`.

### Shared Libraries (`libs/`)
- **`libs/types/`** — all shared DTOs and interfaces, organized by domain in subfolders (`auth/`, `user/`, `post/`, `message/`, `file/`).
  - DTOs for inputs must be validated with `class-validator` decorators.
  - Declare simple interfaces/types for response outputs.
  - Import from `@app/types` or `@app/types/<domain>`.
- **`libs/prisma-<domain>/`** — auto-generated Prisma clients.
  - Import from `@app/prisma-<domain>` (e.g., `@app/prisma-auth`, `@app/prisma-user`).
  - Never duplicate types that exist in these generated clients — use `Prisma.UserCreateInput`, etc.

### Key Conventions
- Do NOT duplicate DTOs or types across microservices. Always define in `libs/types/` and import from `@app/types`.
- Place global filters, guards, and interceptors in a `common/` module within each service that needs them.
- Use the composition root pattern: modules should be explicit about their dependencies.

## Specific to Next.js (Frontend)

### App Router Conventions
- Use the Next.js 16 App Router (`app/` directory) with file-based routing.
- Each route directory contains:
  - `page.tsx` — the page component (server component by default).
  - Client components use the `'use client'` directive at the top.
- Layouts (`layout.tsx`) handle shared UI structure; use `BasePageLayout` from `components/layout/`.
- API route handlers go in `app/api/` — use these as thin proxies to the backend API Gateway.

### Component Structure
- Organize components by domain in `components/`:
  - `ui/` — primitive UI components built with Radix UI + Tailwind CSS (button, card, dialog, input, etc.)
  - `auth/` — login form, register form, forgot/reset password forms
  - `chat/` — chat window, chat input, conversation list
  - `feed/` — post card, post creation, feed
  - `layout/` — page layout wrappers
  - `navigation/` — sidebar, top bar
  - `profile/` — profile header, edit form, avatar upload
  - `sessions/` — session list, session item
  - `users/` — user card, user list, search, status updater
- Each component file should export a single React component.
- Use `'use client'` only when the component needs client-side interactivity (hooks, event handlers, browser APIs).

### Data Fetching
- Use **TanStack React Query** for all client-side data fetching.
- All API calls go through the centralized Axios instance in `lib/api-client.ts`.
- Define query keys as constants to avoid string duplication.
- Use React Query hooks pattern: create custom hooks in `hooks/` that wrap `useQuery`/`useMutation` calls.
- Don't fetch data directly in components; use custom hooks.

### Forms
- Use **React Hook Form** with **Zod** validation schemas.
- Define Zod schemas for each form; reuse backend DTOs where possible.
- Use the `useForm` hook with `zodResolver` from `@hookform/resolvers`.
- Form components receive `control`, `errors`, and other form state as props.

### Styling
- Use **Tailwind CSS v4** utility classes exclusively. No custom CSS files except `globals.css`.
- Use **Radix UI** primitives as the base for interactive components (dialog, scroll-area, avatar, slot, label).
- Use `cn()` from `lib/utils.ts` (via `clsx` + `tailwind-merge`) for conditional class names.
- Use **Lucide React** for all icons.
- Accept `className` as a prop in reusable components and merge with `cn()`.

### Internationalization
- Use `i18next` + `react-i18next` for all user-facing strings.
- Initialize the i18n instance in `lib/i18n.ts`.
- Use the `useTranslation` hook in client components.
- Never hardcode text strings in components; always use translation keys.

### Theming
- Use `next-themes` for dark/light mode toggling.
- Leverage Tailwind's `dark:` variant for dark mode styles.
- Wrap the app with `<ThemeProvider>` in the root layout.

### Key Frontend Conventions
- Follow the existing component structure; place new components in the correct domain directory.
- Don't use `any` in TypeScript; define proper types in `types/`.
- Use `const` for immutable values, `let` only when reassignment is needed.
- Prefer server components by default; only add `'use client'` when necessary.
- Don't embed API logic in components; extract to `lib/api-client.ts` or custom hooks.
