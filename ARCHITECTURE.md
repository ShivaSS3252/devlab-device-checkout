# 🏗️ Architecture & SOLID Principles Documentation

This document explains how the Library Management System follows SOLID principles and clean architecture patterns.

## 📋 Table of Contents

- [SOLID Principles Implementation](#solid-principles-implementation)
  - [Single Responsibility Principle (SRP)](#single-responsibility-principle-srp)
  - [Open/Closed Principle (OCP)](#openclosed-principle-ocp)
  - [Liskov Substitution Principle (LSP)](#liskov-substitution-principle-lsp)
  - [Interface Segregation Principle (ISP)](#interface-segregation-principle-isp)
  - [Dependency Inversion Principle (DIP)](#dependency-inversion-principle-dip)
- [Clean Architecture Layers](#clean-architecture-layers)
- [Design Patterns Used](#design-patterns-used)

---

## 🎯 SOLID Principles Implementation

### Single Responsibility Principle (SRP)

Each class and module has **one reason to change** and **one primary responsibility**.

#### Domain Layer - Single Responsibilities

**`Book` Class** (`src/domain/Book.ts`)
```typescript
export class Book {
  // ✅ Single Responsibility: Manages book state and copy operations
  constructor(public title: string, public copies: number = 1) {}

  hasCopies(): boolean { /* ... */ }          // Check availability
  decrementCopies(): Book { /* ... */ }      // Handle borrowing
  incrementCopies(): Book { /* ... */ }      // Handle returning
}
```
- **Responsibility**: Book state management and copy lifecycle
- **Reason to change**: Book business rules or copy management logic

**`User` Class** (`src/domain/User.ts`)
```typescript
export class User {
  // ✅ Single Responsibility: Manages user borrowing state and validation
  constructor(public id: string, public name: string, public borrowedBooks: string[] = []) {}

  canBorrowMoreBooks(): boolean { /* ... */ }    // Business rule validation
  hasBorrowedBook(): boolean { /* ... */ }       // State checking
  borrowBook(): User { /* ... */ }               // State transitions
  returnBook(): User { /* ... */ }               // State transitions
}
```
- **Responsibility**: User borrowing state and business rule validation
- **Reason to change**: User borrowing rules or state management

**`Library` Class** (`src/domain/Library.ts`)
```typescript
export class Library {
  // ✅ Single Responsibility: Manages the aggregate relationship between books and users
  constructor(public readonly books: readonly Book[], public readonly users: readonly User[]) {}

  addBook(): Library { /* ... */ }           // Book inventory management
  removeBook(): Library { /* ... */ }       // Book inventory management
  addUser(): Library { /* ... */ }          // User management
  updateUser(): Library { /* ... */ }       // User management
  // Query methods...
}
```
- **Responsibility**: Aggregate management and data consistency
- **Reason to change**: Aggregate relationships or consistency rules

#### Service Layer - Single Responsibilities

**`LibraryService` Class** (`src/services/LibraryService.ts`)
```typescript
export class LibraryService {
  // ✅ Single Responsibility: Orchestrates domain operations and business workflows
  constructor(private library: Library) {}

  viewBooks(): readonly Book[] { /* ... */ }     // Read operations
  borrowBook(): Library { /* ... */ }           // Business workflow orchestration
  returnBook(): Library { /* ... */ }           // Business workflow orchestration
  addBook(): Library { /* ... */ }              // Administrative operations
}
```
- **Responsibility**: Business workflow orchestration and domain coordination
- **Reason to change**: Business workflow changes or new domain operations

#### Presentation Layer - Single Responsibilities

**Redux Slices** (`src/store/librarySlice.ts`, `src/store/authSlice.ts`)
```typescript
// ✅ Single Responsibility: State management for specific domain
const librarySlice = createSlice({
  name: 'library',
  // Manages library state, async operations, and state transitions
});

// ✅ Single Responsibility: Authentication state management
const authSlice = createSlice({
  name: 'auth',
  // Manages authentication state and user session
});
```
- **Responsibility**: State management and side effects for specific domains
- **Reason to change**: State structure or async operation logic changes

**React Components**
- **`AdminDashboard`**: Admin-specific UI and interactions
- **`UserDashboard`**: User-specific UI and interactions
- **`LoginPage`**: Authentication UI only

---

### Open/Closed Principle (OCP)

Classes should be **open for extension** but **closed for modification**.

#### Extension Through Composition

**Domain Entities are Immutable** - Extension via composition:
```typescript
// ✅ OCP: Extend functionality without modifying existing code
class Book {
  // Existing methods unchanged...
  decrementCopies(): Book {
    return new Book(this.title, this.copies - 1);  // Returns new instance
  }
}

// Extension: Create specialized book types through composition
class EBook extends Book {
  constructor(title: string, copies: number, public format: string) {
    super(title, copies);
  }
  // Additional methods without modifying base Book class
}
```

**Service Extension** - Add new methods without modifying existing ones:
```typescript
export class LibraryService {
  // Existing methods unchanged...

  // ✅ OCP: Extend with new functionality
  searchBooks(query: string): Book[] {
    // New feature without modifying existing borrow/return logic
  }

  generateReports(): Report[] {
    // New reporting functionality
  }
}
```

#### Redux Reducer Extension

```typescript
const librarySlice = createSlice({
  name: 'library',
  initialState,
  reducers: {
    // Existing reducers unchanged...
  },
  extraReducers: (builder) => {
    // ✅ OCP: Add new async actions without modifying existing reducers
    builder.addCase(newAsyncAction.fulfilled, (state, action) => {
      // New state handling
    });
  }
});
```

#### Configuration-Based Extension

**Constants for Business Rules** (`src/constants/borrowing.ts`):
```typescript
// ✅ OCP: Change behavior through configuration, not code modification
export const MAX_BOOKS_PER_USER = 2;  // Can be changed without touching domain logic
export const BORROWING_PERIOD_DAYS = 14;
```

---

### Liskov Substitution Principle (LSP)

**Subtypes must be substitutable for their base types** without altering program correctness.

#### Error Class Hierarchy

```typescript
// Base Error class
export class LibraryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LibraryError';
  }
}

// ✅ LSP: Specialized errors are substitutable for base Error
export class BorrowLimitError extends LibraryError {
  constructor() {
    super('Borrow limit exceeded');
    this.name = 'BorrowLimitError';
  }
}

export class DuplicateBorrowError extends LibraryError {
  constructor() {
    super('Cannot borrow the same book twice');
    this.name = 'DuplicateBorrowError';
  }
}

// Usage: All errors can be caught as LibraryError or Error
try {
  libraryService.borrowBook(userId, bookTitle);
} catch (error) {
  // ✅ LSP: Any LibraryError subtype works here
  if (error instanceof LibraryError) {
    showError(error.message);
  }
}
```

#### Behavioral Contracts

**Domain Entity Contracts**:
```typescript
interface BookOperations {
  hasCopies(): boolean;
  decrementCopies(): Book;
  incrementCopies(): Book;
}

// ✅ LSP: Any Book subclass must maintain these behavioral contracts
class Book implements BookOperations {
  // Must return new Book instance (immutable contract)
  decrementCopies(): Book { /* ... */ }
}
```

---

### Interface Segregation Principle (ISP)

**Clients should not be forced to depend on methods they don't use**.

#### Segregated Service Interfaces

**Library Service Segregation**:
```typescript
// Instead of one monolithic interface, services are focused:

// ✅ ISP: Admin operations segregated
interface AdminLibraryService {
  addBook(book: Book): Library;
  viewAllUsers(): User[];
  generateReports(): Report[];
}

// ✅ ISP: User operations segregated
interface UserLibraryService {
  viewBooks(): readonly Book[];
  borrowBook(userId: string, bookTitle: string): Library;
  returnBook(userId: string, bookTitle: string): Library;
}

// ✅ ISP: Read operations segregated
interface ReadOnlyLibraryService {
  viewBooks(): readonly Book[];
  getUser(userId: string): User | undefined;
}
```

#### Component-Specific Dependencies

**Components depend only on needed functionality**:
```typescript
// UserDashboard - depends only on user operations
function UserDashboard() {
  const { borrowBook, returnBook } = useLibrary();  // ✅ ISP: Only user methods
  // No admin functionality exposed
}

// AdminDashboard - depends only on admin operations
function AdminDashboard() {
  const { addBook, users } = useLibrary();  // ✅ ISP: Only admin methods
  // No unnecessary user methods
}
```

#### Redux Selector Segregation

```typescript
// ✅ ISP: Selectors provide only needed data
export const selectUserBooks = (state: RootState) =>
  state.library.books.filter(book => /* user-relevant logic */);

export const selectAdminStats = (state: RootState) => ({
  totalBooks: state.library.books.length,
  totalUsers: state.library.users.length,
  // Admin-specific calculations
});
```

---

### Dependency Inversion Principle (DIP)

**Depend on abstractions, not concretions**.

#### Abstracted Service Dependencies

**Service Layer Abstraction**:
```typescript
// ✅ DIP: LibraryService depends on abstract Library interface
export class LibraryService {
  constructor(private library: Library) {}  // Depends on abstraction

  // Implementation details hidden behind Library interface
  borrowBook(userId: string, bookTitle: string): Library {
    // Uses Library methods without knowing implementation
  }
}

// ✅ DIP: Redux thunks inject dependencies
export const borrowBookAsync = createAsyncThunk(
  'library/borrowBook',
  async (params, { getState }) => {
    const state = getState() as RootState;
    // Depends on abstracted state structure
  }
);
```

#### Framework Independence

**UI Layer Abstraction**:
```typescript
// ✅ DIP: Components depend on abstract service contracts
function UserDashboard() {
  // Depends on abstract useLibrary hook, not Redux implementation
  const { borrowBook } = useLibrary();

  // Depends on abstract auth service
  const { user } = useAuth();
}
```

#### Configuration Injection

```typescript
// ✅ DIP: Dependencies injected through configuration
const libraryService = new LibraryService(
  new Library(initialBooks, initialUsers)  // Abstracted data source
);

// Redux store provides abstracted state access
const store = configureStore({
  reducer: {
    library: librarySlice.reducer,  // Abstracted state management
    auth: authSlice.reducer
  }
});
```

---

## 🏛️ Clean Architecture Layers

### Domain Layer (Innermost)
- **Entities**: `Book`, `User`, `Library`
- **Business Rules**: Pure business logic, no external dependencies
- **Immutability**: All state changes create new instances

### Application Layer
- **Services**: `LibraryService`, `AuthService`
- **Use Cases**: Business workflow orchestration
- **Application Logic**: Coordinates domain entities

### Infrastructure Layer
- **External APIs**: Redux store, localStorage, HTTP clients
- **UI Components**: React components, event handlers
- **Framework Code**: Next.js, React Router

### Dependency Direction
```
UI Components → Services → Domain Entities
Infrastructure ← Application ← Domain
```

---

## 🎨 Design Patterns Used

### Domain-Driven Design (DDD)
- **Entities**: `Book`, `User` with business logic
- **Aggregate**: `Library` manages consistency boundaries
- **Value Objects**: Immutable domain objects
- **Repository Pattern**: `Library` acts as in-memory repository

### Service Layer Pattern
- **Application Services**: `LibraryService` orchestrates domain operations
- **Domain Services**: Business logic coordination
- **Infrastructure Services**: External concerns (auth, storage)

### CQRS Pattern (Partial)
- **Commands**: `borrowBook`, `returnBook`, `addBook`
- **Queries**: `viewBooks`, `getUser`
- **Separation**: Read and write operations are distinct

### Observer Pattern
- **Redux Store**: State changes notify subscribed components
- **Middleware**: Async operations trigger state updates

---

## 🔍 Code Quality Metrics

- **SOLID Compliance**: All principles implemented
- **Test Coverage**: 93.37% with domain layer at 88.63%
- **Type Safety**: Full TypeScript strict mode
- **Immutability**: Domain layer maintains referential transparency
- **Separation of Concerns**: Clear layer boundaries maintained

---

## 🚀 Benefits of This Architecture

- **Maintainability**: Single responsibility makes changes isolated
- **Testability**: Dependency injection enables easy mocking
- **Extensibility**: OCP allows adding features without breaking existing code
- **Reliability**: LSP ensures behavioral consistency
- **Flexibility**: DIP enables swapping implementations
- **Scalability**: Clean separation supports team growth and feature development
