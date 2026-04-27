# DevLab — Test Device Checkout System

A complete frontend device checkout system built with React, Next.js, and TypeScript, demonstrating clean architecture, SOLID principles, TDD, and modern frontend development practices.

## 🎯 Overview

This project implements a comprehensive test device checkout system with React, Next.js, and TypeScript. It features role-based access control, modern UI/UX, and demonstrates enterprise-level development practices.

### ✨ Key Features

- **🔐 Authentication System**: Mock OAuth2 with role-based access (User/Admin)
- **👤 User Dashboard**: Browse devices, checkout/return with business rule enforcement
- **👨‍💼 Admin Dashboard**: Manage inventory, view user activity, add devices
- **🏗️ Domain Logic**: Clean architecture with SOLID principles and TDD
- **🔄 State Management**: Redux Toolkit for predictable state updates
- **🎨 UI/UX**: Modern, responsive interface with Tailwind CSS
- **⚠️ Error Handling**: Comprehensive error boundaries and user feedback

---

## 🏗️ Architectural Decisions

### Why Redux for State Management?

Redux Toolkit was chosen over simpler alternatives like Context API or Zustand for several key reasons:

- **Predictable State Updates**: Redux's action-based architecture ensures all state changes are predictable and traceable
- **Developer Tools**: Rich debugging capabilities with Redux DevTools
- **Middleware Support**: Async thunk support for API calls and complex async operations
- **Type Safety**: Full TypeScript integration with strongly typed actions and state
- **Scalability**: Well-established patterns for large applications with complex state interactions
- **Testing**: Comprehensive testing utilities for actions, reducers, and selectors

### Component Architecture & Folder Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx          # Landing page with auth routing
│   └── providers.tsx     # Redux provider setup
├── components/            # React components
│   ├── AdminDashboard.tsx # Admin management interface
│   ├── UserDashboard.tsx  # User checkout interface
│   ├── LoginPage.tsx      # Authentication form
│   └── LoadingSpinner.tsx # Reusable loading component
├── domain/                # Business logic layer
│   ├── Device.ts         # Device entity with business rules
│   ├── User.ts           # User entity with checkout logic
│   └── DevLab.ts         # DevLab aggregate managing devices/users
├── services/              # Application services
│   └── DevLabService.ts   # Orchestrates domain operations
├── store/                 # Redux state management
│   ├── index.ts          # Store configuration
│   ├── authSlice.ts       # Authentication state
│   ├── librarySlice.ts    # Device state & async actions
│   └── hooks.ts          # Typed Redux hooks
├── types/                 # TypeScript type definitions
│   └── auth.ts           # Authentication types
├── constants/             # Business rule constants
│   └── borrowing.ts      # Checkout limits & rules
├── errors/                # Custom error classes
│   ├── CheckoutLimitError.ts    # Checkout limit violations
│   └── DuplicateCheckoutError.ts # Duplicate checkout attempts
└── tests/                 # Test suites
    ├── viewBooks.test.ts      # Viewing devices functionality
    ├── borrowBooks.test.ts    # Checking out devices functionality
    └── returnBooks.test.ts    # Returning devices functionality
```

### Authentication Flow Design Decisions

**Mock Authentication Approach:**
- **Simple Role-Based Access**: Two roles (User/Admin) with different permissions
- **Client-Side Only**: No backend authentication - purely for demonstration
- **Route Protection**: Automatic redirection based on authentication state
- **State Persistence**: Redux state maintained during session

**Design Rationale:**
- **Separation of Concerns**: Auth logic isolated in dedicated Redux slice
- **Type Safety**: Strongly typed user roles and permissions
- **Scalable Structure**: Easy to extend with real authentication providers
- **Testing Friendly**: Mock authentication simplifies component testing

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

### Mock Authentication Approach
- **No Real Security**: Authentication is purely demonstrative - no actual user verification
- **Static User Data**: Pre-defined users with fixed credentials for testing
- **Session-Based**: Authentication state lost on browser refresh
- **No Password Hashing**: Plain text password comparison (never do this in production)

### In-Memory Data Storage Justification
- **Demonstration Purpose**: Focus on business logic rather than persistence complexity
- **Fast Development**: No database setup required for rapid prototyping
- **Test Isolation**: Each test starts with clean state
- **Simplicity**: Easier to reason about and debug

### Browser Storage Limitations
- **No Persistence**: All data lost on page refresh or browser close
- **Memory Constraints**: Large datasets would cause performance issues
- **No Offline Support**: Application requires active browser session
- **Security Concerns**: Sensitive data stored in memory only during session

---

## 🔐 OAuth Authentication Documentation

### Why Mock OAuth?

The application uses a **mock OAuth2 implementation** due to assignment constraints and demonstration purposes:

- **🎓 Educational Focus**: Demonstrates authentication patterns without complex backend setup
- **⚡ Rapid Development**: No external API dependencies or OAuth provider configuration
- **🧪 Testing Friendly**: Predictable authentication flow for component and integration tests
- **🔒 Security Awareness**: Highlights security considerations without implementing real auth

### Mock vs Real OAuth Implementation

| Aspect | Mock Implementation | Real Production Implementation |
|--------|-------------------|------------------------------|
| **Token Generation** | Client-side string concatenation | Cryptographically secure JWTs |
| **User Verification** | Hardcoded mock users | OAuth provider validation |
| **Token Storage** | localStorage (insecure) | HTTP-only cookies, secure storage |
| **Security** | None - demonstration only | PKCE, state parameters, CSRF protection |
| **Persistence** | Browser session only | Database-backed user sessions |
| **Providers** | Simulated Google/GitHub | Real OAuth2/OIDC providers |

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
- **Redux Toolkit**: State management with async thunks and devtools

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
    "@reduxjs/toolkit": "^1.9.5",
    "@tailwindcss/postcss": "^4.1.18",
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-redux": "^8.1.1"
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
- **`tests/viewBooks.test.ts`**: Tests for viewing devices functionality
- **`tests/borrowBooks.test.ts`**: Tests for checking out devices with business rules
- **`tests/returnBooks.test.ts`**: Tests for returning devices and inventory management

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
- **Mock Authentication**: No real user verification or security
- **No Password Security**: Plain text credentials (demonstration only)
- **Session Only**: No persistent authentication across browser sessions
- **No Account Management**: No user registration or password reset

### Data Persistence
- **In-Memory Only**: All data lost on page refresh
- **No Database**: No persistent storage layer
- **Browser Limitations**: Large datasets cause performance issues
- **No Offline Support**: Requires active internet connection

### Backend Integration
- **No API Layer**: No real backend communication
- **Synchronous Operations**: All operations are immediate (no network delays)
- **No Error Recovery**: No retry logic or offline queue
- **Mock Data Only**: No real data validation or sanitization

### Testing & Quality
- **No E2E Tests**: No Cypress or Playwright integration tests
- **No Component Tests**: Limited React component testing
- **No Performance Tests**: No load testing or performance monitoring
- **No Accessibility Tests**: No automated accessibility validation

### Production Readiness
- **No Error Boundaries**: Missing React error boundary components
- **No Logging**: No application logging or monitoring
- **No Analytics**: No user behavior tracking
- **No Deployment**: No CI/CD or deployment configuration

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
