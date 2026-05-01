# 🏗️ Architecture & SOLID Principles Documentation

This document explains how the DevLab — Test Device Checkout System follows SOLID principles and clean architecture patterns.

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

**`Device` Class** (`src/domain/Device.ts`)
```typescript
export class Device {
  // ✅ Single Responsibility: Manages device state and unit operations
  constructor(public name: string, public units: number = 1) {}

  hasCopies(): boolean { /* ... */ }          // Check availability
  decrementCopies(): Device { /* ... */ }    // Handle checkout
  incrementCopies(): Device { /* ... */ }    // Handle return
}
```
- **Responsibility**: Device state management and unit lifecycle
- **Reason to change**: Device business rules or unit management logic

**`User` Class** (`src/domain/User.ts`)
```typescript
export class User {
  // ✅ Single Responsibility: Manages user checkout state and validation
  constructor(public id: string, public name: string, public checkedOutDevices: string[] = []) {}

  canCheckoutMore(): boolean { /* ... */ }    // Business rule validation
  hasDevice(): boolean { /* ... */ }          // State checking
  checkoutDevice(): User { /* ... */ }        // State transitions
  returnDevice(): User { /* ... */ }          // State transitions
}
```
- **Responsibility**: User checkout state and business rule validation
- **Reason to change**: User checkout rules or state management

**`DevLab` Class** (`src/domain/DevLab.ts`)
```typescript
export class DevLab {
  // ✅ Single Responsibility: Manages the aggregate relationship between devices and users
  constructor(public readonly devices: readonly Device[], public readonly users: readonly User[]) {}

  addDevice(): DevLab { /* ... */ }          // Device inventory management
  removeDevice(): DevLab { /* ... */ }       // Device inventory management
  addUser(): DevLab { /* ... */ }            // User management
  updateUser(): DevLab { /* ... */ }         // User management
  // Query methods...
}
```
- **Responsibility**: Aggregate management and data consistency
- **Reason to change**: Aggregate relationships or consistency rules

#### Service Layer - Single Responsibilities

**`DevLabService` Class** (`src/services/DevLabService.ts`)
```typescript
export class DevLabService {
  // ✅ Single Responsibility: Orchestrates domain operations and business workflows
  constructor(private devlab: DevLab) {}

  viewDevices(): readonly Device[] { /* ... */ }    // Read operations
  checkoutDevice(): DevLab { /* ... */ }            // Business workflow orchestration
  returnDevice(): DevLab { /* ... */ }              // Business workflow orchestration
  addDevice(): DevLab { /* ... */ }                 // Administrative operations
}
```
- **Responsibility**: Business workflow orchestration and domain coordination
- **Reason to change**: Business workflow changes or new domain operations

#### Presentation Layer - Single Responsibilities

**Redux Slices** (`src/store/deviceSlice.ts`, `src/store/authSlice.ts`)
```typescript
// ✅ Single Responsibility: State management for specific domain
const devLabSlice = createSlice({
  name: 'devlab',
  // Manages device state, async operations, and state transitions
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
class Device {
  // Existing methods unchanged...
  decrementCopies(): Device {
    return new Device(this.name, this.units - 1);  // Returns new instance
  }
}

// Extension: Create specialized device types through composition
class MobileDevice extends Device {
  constructor(name: string, units: number, public os: string) {
    super(name, units);
  }
  // Additional methods without modifying base Device class
}
```

**Service Extension** - Add new methods without modifying existing ones:
```typescript
export class DevLabService {
  // Existing methods unchanged...

  // ✅ OCP: Extend with new functionality
  searchDevices(query: string): Device[] {
    // New feature without modifying existing checkout/return logic
  }

  generateReports(): Report[] {
    // New reporting functionality
  }
}
```

#### Redux Reducer Extension

```typescript
const devLabSlice = createSlice({
  name: 'devlab',
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
export const MAX_DEVICES_PER_USER = 2;  // Can be changed without touching domain logic
export const CHECKOUT_PERIOD_DAYS = 14;
```

---

### Liskov Substitution Principle (LSP)

**Subtypes must be substitutable for their base types** without altering program correctness.

#### Error Class Hierarchy

```typescript
// Base Error class
export class DevLabError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DevLabError';
  }
}

// ✅ LSP: Specialized errors are substitutable for base Error
export class CheckoutLimitError extends DevLabError {
  constructor() {
    super('User has reached the maximum number of checked out devices');
    this.name = 'CheckoutLimitError';
  }
}

export class DuplicateCheckoutError extends DevLabError {
  constructor() {
    super('User cannot checkout the same device twice');
    this.name = 'DuplicateCheckoutError';
  }
}

// Usage: All errors can be caught as DevLabError or Error
try {
  devLabService.checkoutDevice(userId, deviceName);
} catch (error) {
  // ✅ LSP: Any DevLabError subtype works here
  if (error instanceof DevLabError) {
    showError(error.message);
  }
}
```

#### Behavioral Contracts

**Domain Entity Contracts**:
```typescript
interface DeviceOperations {
  hasCopies(): boolean;
  decrementCopies(): Device;
  incrementCopies(): Device;
}

// ✅ LSP: Any Device subclass must maintain these behavioral contracts
class Device implements DeviceOperations {
  // Must return new Device instance (immutable contract)
  decrementCopies(): Device { /* ... */ }
}
```

---

### Interface Segregation Principle (ISP)

**Clients should not be forced to depend on methods they don't use**.

#### Segregated Service Interfaces

**DevLab Service Segregation**:
```typescript
// Instead of one monolithic interface, services are focused:

// ✅ ISP: Admin operations segregated
interface AdminDevLabService {
  addDevice(device: Device): DevLab;
  viewAllUsers(): User[];
  generateReports(): Report[];
}

// ✅ ISP: User operations segregated
interface UserDevLabService {
  viewDevices(): readonly Device[];
  checkoutDevice(userId: string, deviceName: string): DevLab;
  returnDevice(userId: string, deviceName: string): DevLab;
}

// ✅ ISP: Read operations segregated
interface ReadOnlyDevLabService {
  viewDevices(): readonly Device[];
  getUser(userId: string): User | undefined;
}
```

#### Component-Specific Dependencies

**Components depend only on needed functionality**:
```typescript
// UserDashboard - depends only on user operations
function UserDashboard() {
  const { checkoutDevice, returnDevice } = useDevLab();  // ✅ ISP: Only user methods
  // No admin functionality exposed
}

// AdminDashboard - depends only on admin operations
function AdminDashboard() {
  const { addDevice, users } = useDevLab();  // ✅ ISP: Only admin methods
  // No unnecessary user methods
}
```

#### Redux Selector Segregation

```typescript
// ✅ ISP: Selectors provide only needed data
export const selectUserDevices = (state: RootState) =>
  state.devlab.devices.filter(device => /* user-relevant logic */);

export const selectAdminStats = (state: RootState) => ({
  totalDevices: state.devlab.devices.length,
  totalUsers: state.devlab.users.length,
  // Admin-specific calculations
});
```

---

### Dependency Inversion Principle (DIP)

**Depend on abstractions, not concretions**.

#### Abstracted Service Dependencies

**Service Layer Abstraction**:
```typescript
// ✅ DIP: DevLabService depends on abstract DevLab interface
export class DevLabService {
  constructor(private devlab: DevLab) {}  // Depends on abstraction

  // Implementation details hidden behind DevLab interface
  checkoutDevice(userId: string, deviceName: string): DevLab {
    // Uses DevLab methods without knowing implementation
  }
}

// ✅ DIP: Redux thunks inject dependencies
export const checkoutDeviceAsync = createAsyncThunk(
  'devlab/checkoutDevice',
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
  // Depends on abstract useDevLab hook, not Redux implementation
  const { checkoutDevice } = useDevLab();

  // Depends on abstract auth service
  const { user } = useAuth();
}
```

#### Configuration Injection

```typescript
// ✅ DIP: Dependencies injected through configuration
const devLabService = new DevLabService(
  new DevLab(initialDevices, initialUsers)  // Abstracted data source
);

// Redux store provides abstracted state access
const store = configureStore({
  reducer: {
    devlab: devLabSlice.reducer,  // Abstracted state management
    auth: authSlice.reducer
  }
});
```

---

## 🏛️ Clean Architecture Layers

### Domain Layer (Innermost)
- **Entities**: `Device`, `User`, `DevLab`
- **Business Rules**: Pure business logic, no external dependencies
- **Immutability**: All state changes create new instances

### Application Layer
- **Services**: `DevLabService`, `AuthService`
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
- **Entities**: `Device`, `User` with business logic
- **Aggregate**: `DevLab` manages consistency boundaries
- **Value Objects**: Immutable domain objects
- **Repository Pattern**: `DevLab` acts as in-memory repository

### Service Layer Pattern
- **Application Services**: `DevLabService` orchestrates domain operations
- **Domain Services**: Business logic coordination
- **Infrastructure Services**: External concerns (auth, storage)

### CQRS Pattern (Partial)
- **Commands**: `checkoutDevice`, `returnDevice`, `addDevice`
- **Queries**: `viewDevices`, `getUser`
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
