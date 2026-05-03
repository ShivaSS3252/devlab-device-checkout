# DevLab — Test Device Checkout System

## Project Overview

A Next.js 14 (App Router) web app for managing test device checkouts within a team. Users can borrow and return devices; admins can manage inventory and view activity. No database — all state is in-memory with localStorage persistence.

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **State**: Zustand 5 with `persist` middleware (localStorage)
- **Auth**: JWT via `jose` + `bcryptjs` password hashing — no database
- **Validation**: Zod + React Hook Form
- **Styling**: Tailwind CSS 4 (dark theme, GitHub-inspired)
- **Testing**: Jest + React Testing Library

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with Providers
│   ├── page.tsx                # Root redirect (auth check → role dashboard)
│   ├── providers.tsx           # ToastProvider + ErrorBoundary
│   ├── login/page.tsx
│   ├── admin/page.tsx
│   ├── user/page.tsx
│   └── api/auth/
│       ├── login/route.ts      # POST — generate JWT, set httpOnly cookie
│       ├── logout/route.ts     # POST — clear cookie
│       └── me/route.ts         # GET — validate session
├── components/
│   ├── LoginPage.tsx
│   ├── AdminDashboard.tsx
│   ├── UserDashboard.tsx
│   ├── Toast.tsx
│   ├── ErrorBoundary.tsx
│   ├── LoadingSpinner.tsx
│   └── Pagination.tsx
├── store/
│   ├── useAuthStore.ts         # user, role, token, login(), logout()
│   └── useDeviceStore.ts       # devices, users, checkout(), returnDevice()
├── domain/
│   ├── Device.ts               # Immutable entity
│   ├── User.ts                 # Entity with checkout validation
│   └── DevLab.ts               # Aggregate root
├── services/
│   └── DevLabService.ts        # Business logic layer
├── config/
│   └── users.ts                # Hardcoded users with bcrypt hashes
├── contexts/
│   └── ToastContext.tsx
├── types/
│   └── auth.ts
├── lib/
│   └── schemas.ts              # Zod schemas
├── constants/
│   └── borrowing.ts            # MAX_DEVICES_PER_USER = 2
└── errors/
    ├── CheckoutLimitError.ts
    └── DuplicateCheckoutError.ts
middleware.ts                   # JWT verification + role-based route protection
```

## Authentication

**Flow**: Hardcoded users → bcrypt verify → JWT in httpOnly cookie + Zustand store.

| Username | Password  | Role  |
|----------|-----------|-------|
| admin    | admin123  | admin |
| john     | john123   | user  |
| jane     | jane123   | user  |

- Token expiry: 24 hours
- `middleware.ts` protects `/admin` (admin only) and `/user` (any authenticated user)
- `/api/auth/me` is called on app load to restore session from cookie

## Routing

| Path     | Access            | Component          |
|----------|-------------------|--------------------|
| `/`      | redirects         | —                  |
| `/login` | public            | LoginPage          |
| `/admin` | admin only        | AdminDashboard     |
| `/user`  | authenticated     | UserDashboard      |

## State Management

### `useAuthStore`
- State: `user`, `role`, `token`, `isLoading`, `error`
- Actions: `login()`, `logout()`, `initializeAuth()`, `clearError()`
- Calls `/api/auth/*` endpoints

### `useDeviceStore`
- State: `devices[]`, `users[]`, `currentUser`, `isLoading`, `error`
- Actions: `setCurrentUser()`, `checkout()`, `returnDevice()`, `addDevice()`, `addUser()`, `clearError()`, `resetCurrentUser()`
- Persists `devices` and `users` to localStorage; merges on hydration to preserve sample users

## Domain Model

All domain entities are immutable (return new instances, no mutations).

**Device**: `name`, `units` — methods: `hasCopies()`, `decrementCopies()`, `incrementCopies()`

**User**: `id`, `name`, `checkedOutDevices[]` — methods: `canCheckoutMore()`, `hasDevice()`, `checkoutDevice()`, `returnDevice()`

**DevLab** (aggregate root): manages the device inventory and user roster; used by `DevLabService`.

## Business Rules

- Max **2 devices** per user (`MAX_DEVICES_PER_USER` in `src/constants/borrowing.ts`)
- Cannot checkout the same device twice → `DuplicateCheckoutError`
- Cannot checkout if no units available
- Returning a device increments its unit count back

## Sample Data (seeded in store)

Devices: iPhone 15 Pro, Samsung Galaxy S24, iPad Pro 12.9, Google Pixel 8, MacBook Pro 14

Users: John Doe, Jane Smith, Admin User

## API Routes

```
POST /api/auth/login   { username, password }  → { user, token }
POST /api/auth/logout                          → { message }
GET  /api/auth/me                              → { user, token }
```

## UI Features

- Dark theme with teal (#00d4aa) / sky (#0ea5e9) accent colors
- Toast notifications (success, error, warning, info) via Context
- Status badges: Available, Low Stock, Out of Stock, At Limit
- Paginated tables (AdminDashboard: inventory + user activity)
- Paginated device grid (UserDashboard)
- Zod-validated forms with field-level errors
- Loading spinners, ErrorBoundary for crash recovery

## Common Commands

```bash
npm run dev       # Start dev server (http://localhost:3000)
npm run build     # Production build
npm run test      # Run Jest tests
npm run lint      # ESLint
```

## Key Design Decisions

- **No database**: state lives in Zustand + localStorage; sample data is seeded on first load
- **httpOnly cookie + Zustand**: cookie handles SSR/middleware auth; Zustand holds client state for UI
- **Aggregate pattern**: `DevLab` owns all mutations to prevent scattered state logic
- **SOLID principles**: documented in `src/domain/User.ts` — single responsibility, immutable entities, dependency inversion through `DevLabService`
