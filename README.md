# DevLab — Test Device Checkout System

A complete frontend device checkout system built with React, Next.js, and TypeScript, demonstrating clean architecture, SOLID principles, TDD, and modern frontend development practices.

## 🎯 Overview

This project implements a comprehensive test device checkout system with React, Next.js, and TypeScript. It features role-based access control, modern UI/UX, and demonstrates enterprise-level development practices.

### ✨ Key Features

- **🔐 Authentication System**: JWT-based auth with bcryptjs password hashing, httpOnly cookies, and role-based access (User/Admin)
- **👤 User Dashboard**: Browse devices, checkout/return with business rule enforcement
- **👨‍💼 Admin Dashboard**: Manage inventory, view user activity, add devices
- **🏗️ Domain Logic**: Clean architecture with SOLID principles and TDD
- **🔄 State Management**: Zustand with localStorage persistence
- **🎨 UI/UX**: Modern, responsive dark-themed interface with Tailwind CSS
- **⚠️ Error Handling**: Error boundaries, toast notifications, and comprehensive user feedback

---

## 🏗️ Architectural Decisions

### Why Zustand for State Management?

Zustand was chosen over Redux Toolkit for several key reasons:

- **Minimal Boilerplate**: No actions, reducers, or selectors needed — just a single store definition
- **Fine-Grained Subscriptions**: Components subscribe to exact state slices, avoiding unnecessary re-renders
- **Built-in Persistence**: `persist` middleware wires directly to localStorage with zero extra setup
- **Type Safety**: Full TypeScript integration with inferred types and no extra typing overhead
- **Simplicity**: Easier to test and reason about for this application's complexity level
- **Two Stores**: `useAuthStore` (JWT session) and `useDeviceStore` (device/user data) cleanly separate concerns

### Component Architecture & Folder Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with Providers wrapper
│   ├── page.tsx          # Root page — auth check and role redirect
│   ├── providers.tsx     # ToastProvider + ErrorBoundary
│   ├── login/page.tsx    # Login route
│   ├── admin/page.tsx    # Admin dashboard route
│   ├── user/page.tsx     # User dashboard route
│   └── api/auth/         # Auth API routes (login, logout, me)
├── components/            # React components
│   ├── AdminDashboard.tsx # Admin management interface
│   ├── UserDashboard.tsx  # User checkout interface
│   ├── LoginPage.tsx      # Authentication form
│   ├── Toast.tsx          # Toast notification system
│   ├── ErrorBoundary.tsx  # React error boundary
│   ├── LoadingSpinner.tsx # Reusable loading component
│   └── Pagination.tsx     # Reusable pagination component
├── domain/                # Business logic layer
│   ├── Device.ts         # Device entity with business rules
│   ├── User.ts           # User entity with checkout logic
│   └── DevLab.ts         # DevLab aggregate managing devices/users
├── services/              # Application services
│   └── DevLabService.ts   # Orchestrates domain operations
├── store/                 # Zustand state management
│   ├── useAuthStore.ts   # JWT session state (login/logout)
│   └── useDeviceStore.ts # Device/user state with localStorage persistence
├── config/
│   └── users.ts          # Hardcoded users with bcrypt hashes
├── contexts/
│   └── ToastContext.tsx   # Toast notification context
├── lib/
│   └── schemas.ts        # Zod validation schemas
├── types/                 # TypeScript type definitions
│   └── auth.ts           # Authentication types
├── constants/             # Business rule constants
│   └── borrowing.ts      # MAX_DEVICES_PER_USER = 2
└── errors/                # Custom error classes
    ├── CheckoutLimitError.ts    # Checkout limit violations
    └── DuplicateCheckoutError.ts # Duplicate checkout attempts
middleware.ts              # JWT verification + role-based route protection
```

### Authentication Flow Design Decisions

**JWT Authentication Approach:**
- **Role-Based Access**: Two roles (User/Admin) enforced in middleware and UI
- **Hardcoded Users**: Three pre-seeded users with bcryptjs-hashed passwords in `src/config/users.ts`
- **Route Protection**: `middleware.ts` verifies JWT from httpOnly cookie before rendering any protected page
- **State Persistence**: `useAuthStore` holds client-side session; cookie survives page refresh

**Design Rationale:**
- **Separation of Concerns**: Auth API routes handle token issuance; `useAuthStore` handles client session
- **Security**: Passwords hashed with bcryptjs; tokens stored in httpOnly cookie (not localStorage)
- **Scalable Structure**: Swap `src/config/users.ts` for a database lookup to move to production auth
- **Session Restore**: `GET /api/auth/me` validates the cookie on load, restoring session without re-login

### Service Layer Pattern Rationale

The service layer follows the **Application Service Pattern** with these design decisions:

- **Domain Orchestration**: Services coordinate domain entities without containing business logic
- **Transaction Management**: Services handle the coordination of multiple domain operations
- **Error Translation**: Domain errors translated to user-friendly messages
- **Immutability Bridge**: Connects immutable domain layer with mutable Redux state

**Why This Pattern?**
- **Clean Separation**: Business logic stays in domain, coordination in services
- **Testability**: Services can be easily mocked for component testing
- **Error Handling**: Centralized error handling and user feedback
- **Maintainability**: Clear boundaries between layers

---

## 🤔 Assumptions

### Authentication Approach
- **JWT with bcryptjs**: Passwords are hashed; tokens are signed JWTs (24h expiry) stored in httpOnly cookies
- **Static User Data**: Three pre-defined users in `src/config/users.ts` — no database required
- **Session Restored on Refresh**: `/api/auth/me` validates the cookie, restoring the Zustand session
- **No Registration**: User accounts are seeded; no self-service sign-up

### Data Storage
- **Device/User State**: Persisted in localStorage via Zustand's `persist` middleware; survives page refresh
- **Demo Data**: Sample devices and users seeded on first load; merged with any saved state on hydration
- **No Database**: All persistence is client-side localStorage — suitable for demonstration

---

## 🔐 Authentication Documentation

### How Auth Works

The application uses a **custom JWT implementation** with hardcoded users:

- **🔑 Password Security**: All passwords stored as bcryptjs hashes in `src/config/users.ts`
- **🎫 Token Issuance**: `POST /api/auth/login` verifies password and issues a signed JWT (via `jose`)
- **🍪 Token Storage**: JWT stored in an httpOnly cookie (not localStorage) — inaccessible to JavaScript
- **🛡️ Route Protection**: `middleware.ts` verifies the cookie before rendering `/admin` or `/user`
- **🔄 Session Restore**: `GET /api/auth/me` validates the cookie on page load; Zustand hydrates from it

### Current vs Production Auth

| Aspect | Current Implementation | Production Path |
|--------|------------------------|-----------------|
| **User Store** | Hardcoded in `src/config/users.ts` | Database (Postgres/MongoDB) |
| **Password Hashing** | bcryptjs ✅ | bcryptjs / Argon2 |
| **Token Storage** | httpOnly cookie ✅ | httpOnly cookie ✅ |
| **Token Signing** | jose SignJWT ✅ | Same or OAuth provider |
| **Expiry** | 24h | Configurable |
| **Registration** | Not supported | User sign-up flow |
| **OAuth Providers** | Not integrated | NextAuth.js + Google/GitHub |

### Real OAuth2 Implementation Guide

#### 1. Choose OAuth Provider(s)
```typescript
// Example: NextAuth.js configuration (recommended for Next.js)
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    })
  ],
  // ... configuration
})
```

#### 2. Environment Variables Setup
```bash
# .env.local
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_string
```

#### 3. Database Integration
```typescript
// lib/auth.ts (with database)
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [/* providers */],
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user) {
        session.user.id = token.uid;
      }
      return session;
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.uid = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: 'database', // or 'jwt'
  },
})
```

### OAuth2 Token Flow Diagram

```
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│   Client    │          │OAuth Provider│          │   Server    │
│   (Browser) │          │ (Google/etc) │          │   (API)     │
└──────┬──────┘          └──────┬──────┘          └──────┬──────┘
       │                             │                         │
       │  1. Initiate Login         │                         │
       │ ──────────────────────────► │                         │
       │                             │                         │
       │  2. Redirect to Provider    │                         │
       │ ◄─────────────────────────── │                         │
       │                             │                         │
       │                             │  3. User Authenticates │
       │                             │ ◄─────────────────────► │
       │                             │                         │
       │  4. Authorization Code      │                         │
       │ ◄─────────────────────────── │                         │
       │                             │                         │
       │  5. Exchange Code for Token │                         │
       │ ───────────────────────────► │                         │
       │                             │  6. Validate & Issue JWT│
       │                             │ ◄─────────────────────► │
       │                             │                         │
       │  7. Receive Access Token    │                         │
       │ ◄─────────────────────────── │                         │
       │                             │                         │
       │  8. API Requests with Token │                         │
       │ ────────────────────────────┼───────────────────────► │
       │                             │                         │
```

**Flow Steps:**
1. **Client** initiates OAuth login → redirects to provider
2. **Provider** authenticates user → returns authorization code
3. **Client** exchanges code for tokens via backend
4. **Server** validates code → issues JWT tokens
5. **Client** stores tokens securely → makes authenticated requests

### Security Considerations for Production

#### 🔑 **Token Security**
- **Never store tokens in localStorage**: Use HTTP-only cookies
- **Implement token rotation**: Refresh tokens before expiration
- **Use short-lived access tokens**: 15-60 minutes maximum
- **Validate tokens server-side**: Never trust client-side validation alone

#### 🛡️ **OAuth2 Best Practices**
- **PKCE (Proof Key for Code Exchange)**: Required for public clients
- **State Parameter**: Prevent CSRF attacks during OAuth flow
- **Nonce Parameter**: Prevent replay attacks in OIDC flows
- **Secure Redirect URIs**: Whitelist allowed callback URLs

#### 🔐 **Session Management**
- **Secure Session Cookies**: `httpOnly`, `secure`, `sameSite` flags
- **Session Expiration**: Implement absolute and sliding expiration
- **Concurrent Session Control**: Limit active sessions per user
- **Logout Handling**: Proper token revocation on logout

#### 📊 **Data Protection**
- **Encrypt sensitive data**: User PII and tokens at rest
- **Rate limiting**: Protect against brute force and DoS attacks
- **Audit logging**: Track authentication events for security monitoring
- **GDPR compliance**: User data portability and right to erasure

#### 🚨 **Common Vulnerabilities to Avoid**
- **Authorization Code Interception**: Use HTTPS everywhere
- **Token Leakage**: Never log tokens or expose in URLs
- **Session Fixation**: Regenerate session IDs after login
- **Clickjacking**: Use X-Frame-Options and CSP headers

#### 🏗️ **Production Architecture**
```typescript
// Secure token storage (HTTP-only cookies)
export class SecureAuthService {
  private async storeTokens(accessToken: string, refreshToken: string) {
    // Server-side: Set HTTP-only cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });
  }

  private async validateToken(token: string): Promise<User> {
    // Server-side validation with JWKS or database
    return jwt.verify(token, process.env.JWT_SECRET);
  }
}
```

### Migration Path from Mock to Real OAuth

1. **Phase 1: Infrastructure Setup**
   - Set up OAuth provider accounts (Google, GitHub)
   - Configure environment variables
   - Set up database for user sessions

2. **Phase 2: Backend Integration**
   - Implement OAuth callback endpoints
   - Set up token validation middleware
   - Replace mock service with real authentication

3. **Phase 3: Frontend Updates**
   - Update login flow to use real OAuth redirects
   - Implement secure token storage
   - Add loading states for OAuth flows

4. **Phase 4: Security Hardening**
   - Implement rate limiting and monitoring
   - Add security headers and CSP
   - Set up audit logging and alerting

---

## 🛠️ Technical Stack

### Core Technologies
- **React 18**: Modern React with hooks and concurrent features
- **Next.js 14**: Full-stack React framework with App Router
- **TypeScript 5.0**: Strict type checking and modern JavaScript features
- **Zustand 5**: Lightweight state management with localStorage persistence
- **jose + bcryptjs**: JWT signing and secure password hashing
- **Zod + React Hook Form**: Schema validation and form management

### UI & Styling
- **Tailwind CSS 4.1**: Utility-first CSS framework
- **PostCSS**: CSS processing and optimization
- **Autoprefixer**: Automatic CSS vendor prefixing

### Testing & Quality
- **Jest**: JavaScript testing framework with TypeScript support
- **React Testing Library**: Component testing utilities
- **Testing Library Jest DOM**: Additional DOM matchers
- **Jest Environment JSDOM**: Browser environment simulation

### Development Tools
- **ESLint**: Code linting and style enforcement
- **TypeScript Compiler**: Type checking and compilation
- **Next.js CLI**: Development server and build tools

### Dependencies Overview
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^5.0.0",
    "jose": "latest",
    "bcryptjs": "latest",
    "zod": "latest",
    "react-hook-form": "latest",
    "@tailwindcss/postcss": "^4.1.18"
  }
}
```

---

## 🚀 How to Run the Project

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd devlab

# Install dependencies
npm install
```

### Development Server
```bash
# Start development server
npm run dev
```
The application will be available at `http://localhost:3000`

### Build for Production
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Environment Setup
No additional environment configuration required - all settings are hardcoded for demonstration.

---

## 🧪 How to Run Tests

### Test Scripts

```bash
# Run all tests once
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run type checking
npm run type-check
```

### Test Structure

The project follows Test-Driven Development (TDD) with comprehensive test coverage:

#### Test Files
- **`tests/viewDevices.test.ts`**: Tests for viewing devices functionality
- **`tests/checkoutDevices.test.ts`**: Tests for checking out devices with business rules
- **`tests/returnDevices.test.ts`**: Tests for returning devices and inventory management

#### Test Coverage
- **Overall Coverage**: 93.37% statement coverage
- **Domain Layer**: 88.63% coverage
- **Services Layer**: 100% coverage
- **Constants**: 100% coverage
- **Error Classes**: 100% coverage

#### Test Categories
1. **Unit Tests**: Individual functions and methods
2. **Integration Tests**: Component interactions (limited)
3. **Business Logic Tests**: Domain rule enforcement
4. **Error Handling Tests**: Custom error scenarios

---

## 📋 Features Implemented

### Assignment Stories Mapping

#### ✅ **Story 1: Viewing Devices**
- **As a user**, I want to view all available devices in the DevLab
- **Implementation**: `DevLabService.viewDevices()` returns readonly array
- **Tests**: Empty DevLab and populated DevLab scenarios
- **UI**: Devices displayed in responsive grid layout

#### ✅ **Story 2: Checking Out Devices**
- **As a user**, I want to check out devices with proper validation
- **Business Rules**:
  - Maximum 2 devices per user (`MAX_DEVICES_PER_USER = 2`)
  - Cannot check out the same device twice
  - Multiple units: decrement count
  - Single unit: remove from DevLab
- **Error Handling**: `CheckoutLimitError`, `DuplicateCheckoutError`
- **Tests**: 9 test cases covering all scenarios

#### ✅ **Story 3: Returning Devices**
- **As a user**, I want to return checked out devices
- **Inventory Management**:
  - Existing device: increment unit count
  - New device: add to DevLab inventory
- **Validation**: User must have checked out the device
- **Tests**: 6 test cases covering return scenarios

#### ✅ **Story 4: Admin Management**
- **As an admin**, I want to manage DevLab inventory
- **Features**:
  - Add new devices to inventory
  - View all users and their checkout activity
  - Monitor total devices and units
  - Paginated user/device lists
- **UI**: Dedicated admin dashboard with stats and management tools

### Additional Features

#### 🔐 **Authentication & Authorization**
- Role-based access control (User/Admin)
- Protected routes with automatic redirection
- Mock OAuth2 flow demonstration

#### 🎨 **Modern UI/UX**
- Responsive design for all screen sizes
- Gradient backgrounds and smooth animations
- Loading states and error feedback
- Intuitive user flows and interactions

#### 📊 **Dashboard Analytics**
- Real-time statistics (total devices, checked out devices, active users)
- Visual status indicators
- Pagination for large datasets

---

## ⚠️ Known Limitations

### Authentication & Security
- **Hardcoded Users**: No self-service registration; users must be added to `src/config/users.ts`
- **No Password Reset**: No forgot-password or account management flow
- **No OAuth Providers**: Google/GitHub login not integrated (path documented above)

### Data Persistence
- **localStorage Only**: Device/user data persists in the browser; no server-side database
- **No Cross-Device Sync**: State is local to each browser session
- **No Offline Queue**: Operations require an active browser session

### Testing & Quality
- **No E2E Tests**: No Cypress or Playwright integration tests
- **No Accessibility Tests**: No automated WCAG validation

### Production Readiness
- **No CI/CD**: No automated deployment pipeline
- **No Analytics or Logging**: No server-side observability

---

## 🚀 Future Improvements

### High Priority

#### 🔐 **Authentication & Security**
- Implement real OAuth2/OIDC authentication
- Add user registration and account management
- Secure password hashing and storage
- JWT token management and refresh
- Role-based permissions system

#### 💾 **Data Persistence**
- Add localStorage/sessionStorage for data persistence
- Implement REST API integration
- Add GraphQL API support
- Database integration (PostgreSQL/MongoDB)
- Data synchronization and conflict resolution

#### 🧪 **Testing Enhancements**
- Add Cypress E2E tests for user journeys
- Component integration tests with Testing Library
- Performance testing and monitoring
- Accessibility testing (axe-core, lighthouse)
- Visual regression testing

### Medium Priority

#### 🎯 **Error Handling & Monitoring**
- React Error Boundary components
- Centralized error logging service
- User-friendly error messages
- Application performance monitoring
- Sentry integration for error tracking

#### ♿ **Accessibility & UX**
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Internationalization (i18n)

#### ⚡ **Performance Optimizations**
- Code splitting and lazy loading
- React.memo and useMemo optimization
- Virtual scrolling for large lists
- Image optimization and CDN
- Bundle size optimization

### Low Priority

#### 🔧 **Developer Experience**
- Storybook component documentation
- Husky pre-commit hooks
- Commit message linting
- Automated deployment pipeline
- Docker containerization

#### 📱 **Advanced Features**
- Offline support with service workers
- Push notifications
- Advanced search and filtering
- Device availability suggestions
- User checkout history
- Due date tracking and reminders

---

## 📈 Project Metrics

- **Test Coverage**: 93.37% overall
- **TypeScript Strict**: Full strict mode enabled
- **SOLID Compliance**: All principles implemented
- **TDD Approach**: Tests written before implementation
- **Clean Architecture**: Domain/Service separation maintained
- **Modern React**: React 18 with hooks and concurrent features

---

## 📋 **Evaluation Instructions**

### **Viewing Development History**

This project demonstrates **iterative development** with regular commits. To view the development progression:

#### **View Commit History**
```bash
# Extract the ZIP file first
unzip devlab_submission.zip
cd devlab/

# View all commits (shows iterative development)
git log --oneline

# View detailed commit messages
git log --pretty=format:"%h - %s%n%b%n---"

# View commits with dates
git log --pretty=format:"%h %ad %s" --date=short
```

#### **Expected Output**
You should see **10 commits** showing the development progression:
```
bd87df8 Implement mock authentication - no database required
51337c9 Complete implementation with testing and documentation
24d025a Story 4: Implement admin management dashboard
5ebd61c Story 3: Implement device returning functionality
e1e57ed Story 2: Implement device checkout with business rules
43e6bed Story 1: Implement device viewing functionality
9399373 Implement basic app structure and authentication UI
f411933 Implement service layer and Redux state management
8a3a9de Implement domain layer with business entities and rules
e94fe61 Initial project setup with Next.js, TypeScript, and testing configuration
```

#### **Running the Application**
```bash
# Install dependencies
npm install

# Run tests
npm test

# Start development server
npm run dev
```

---

## 🤝 Contributing

1. Follow the established TDD approach
2. Maintain TypeScript strict mode
3. Ensure test coverage stays above 90%
4. Follow the clean architecture patterns
5. Add comprehensive documentation

---

## 📄 License

This project is for educational and demonstration purposes. See individual component licenses for production use.
