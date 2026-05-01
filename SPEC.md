# DevLab — Test Device Checkout System — Behavioral Specification

## Overview

A test device checkout system built on immutable Domain-Driven Design (DDD) entities.
All state changes return new instances; nothing is mutated in place.

---

## Entities

### Device

| Property | Type   | Description                    |
|----------|--------|--------------------------------|
| name     | string | Unique identifier for a device |
| units    | number | Number of available units      |

**Contracts:**
- `hasCopies()` → `true` if `units > 0`
- `decrementCopies()` → new `Device` with `units - 1`; throws if `units === 0`
- `incrementCopies()` → new `Device` with `units + 1`

---

### User

| Property           | Type     | Description                              |
|--------------------|----------|------------------------------------------|
| id                 | string   | Unique user identifier                   |
| name               | string   | Display name                             |
| checkedOutDevices  | string[] | Names of currently checked out devices   |

**Contracts:**
- `canCheckoutMore()` → `true` if `checkedOutDevices.length < MAX_DEVICES_PER_USER`
- `hasDevice(name)` → `true` if name is in `checkedOutDevices`
- `checkoutDevice(name)` → new `User` with name appended; throws if at limit or already checked out
- `returnDevice(name)` → new `User` with name removed; throws if not checked out

---

### DevLab (Aggregate Root)

Holds `readonly Device[]` and `readonly User[]`. All operations return a new `DevLab`.

| Operation                      | Description                                          |
|--------------------------------|------------------------------------------------------|
| `addDevice(device)`            | Adds new device or increments units if name exists   |
| `returnToInventory(name)`      | Increments units for existing device or adds new entry with 1 unit |
| `removeDevice(name)`           | Decrements units; removes entry if last unit         |
| `addUser(user)`                | Appends user                                         |
| `updateUser(user)`             | Replaces user by id; throws if not found             |
| `getDevices()`                 | Returns readonly device list                         |
| `getUsers()`                   | Returns readonly user list                           |
| `getUser(id)`                  | Finds user by id or returns `undefined`              |
| `findDevice(name)`             | Finds device by name or returns `undefined`          |

---

## Business Rules

| Rule                     | Value | Error thrown on violation    |
|--------------------------|-------|------------------------------|
| Max devices per user     | 2     | `CheckoutLimitError`         |
| No duplicate checkouts   | —     | `DuplicateCheckoutError`     |

---

## Error Types

### `CheckoutLimitError`
- **name:** `CheckoutLimitError`
- **default message:** `User has reached the maximum number of checked out devices`
- **thrown when:** user's `checkedOutDevices.length >= MAX_DEVICES_PER_USER`

### `DuplicateCheckoutError`
- **name:** `DuplicateCheckoutError`
- **default message:** `User cannot checkout the same device twice`
- **thrown when:** user tries to checkout a device name already in their `checkedOutDevices`

---

## Use Cases (Service Layer)

### UC-1: View Devices

**Actor:** Any user  
**Precondition:** None  

| Step | Given                           | When               | Then                               |
|------|---------------------------------|--------------------|------------------------------------|
| 1    | DevLab has no devices           | User views devices | Empty list returned                |
| 2    | DevLab has one or more devices  | User views devices | Full list of devices returned      |
| 3    | Devices are returned            | —                  | List is readonly (immutable)       |

---

### UC-2: Checkout a Device

**Actor:** Registered user  
**Precondition:** User is registered in the system  

| Step | Given                                          | When                       | Then                                            |
|------|------------------------------------------------|----------------------------|-------------------------------------------------|
| 1    | Device exists with ≥ 1 unit; user under limit  | User checks out device     | Device added to user list; inventory decremented |
| 2    | Device had exactly 1 unit                      | User checks out device     | Device entry removed from inventory             |
| 3    | Device had > 1 unit                            | User checks out device     | units decremented by 1                          |
| 4    | User already has `MAX_DEVICES_PER_USER` devices | User checks out another   | `CheckoutLimitError` thrown                     |
| 5    | User already checked out the same device       | User checks it out again   | `DuplicateCheckoutError` thrown                 |
| 6    | Device has 0 units                             | User checks it out         | Error: `Device not available`                   |
| 7    | Device name not in DevLab                      | User checks it out         | Error: `Device not available`                   |
| 8    | User ID not registered                         | User checks out any device | Error: `User not found`                         |

---

### UC-3: Return a Device

**Actor:** Registered user  
**Precondition:** User is registered and has checked out the device  

| Step | Given                                            | When                    | Then                                             |
|------|--------------------------------------------------|-------------------------|--------------------------------------------------|
| 1    | User checked out the device; device in DevLab    | User returns it         | Device removed from user list; inventory incremented |
| 2    | Device existed with N units before checkout      | User returns it         | Inventory restored to N units                    |
| 3    | Device has no inventory record (edge case)       | User returns it         | New device entry created with 1 unit             |
| 4    | User did not check out the device                | User tries to return    | Error: `Device not checked out by user`          |
| 5    | User ID not registered                           | User tries to return    | Error: `User not found`                          |
| 6    | User holds multiple devices                      | Returns one of them     | Only that device removed; others unchanged       |

---

### UC-4: Admin — Add Device

**Actor:** Admin  

| Step | Given                               | When                | Then                                        |
|------|-------------------------------------|---------------------|---------------------------------------------|
| 1    | Name does not exist in inventory    | Admin adds device   | New entry created with given unit count     |
| 2    | Name already exists in inventory    | Admin adds device   | Existing entry's units incremented by 1     |

---

### UC-5: Admin — Add User

**Actor:** Admin  

| Step | Given                        | When              | Then                        |
|------|------------------------------|-------------------|-----------------------------|
| 1    | User ID not yet registered   | Admin adds user   | User appears in system      |

---

## Boundary Conditions

| Condition                                 | Expected Behavior                                      |
|-------------------------------------------|--------------------------------------------------------|
| `units = 0`                               | `hasCopies()` → false; checkout throws                 |
| `units = Number.MAX_SAFE_INTEGER`         | Checkout decrements correctly                          |
| Empty string device name                  | Allowed by domain; found by empty-string lookup        |
| Special characters in name               | Treated as opaque string; stored and retrieved as-is   |
| User at exact checkout limit             | `canCheckoutMore()` → false                            |
| User returns device, then checks out again | Allowed — count drops below limit                    |
| Two users checkout same device name      | Each checkout decrements shared inventory independently |

---

## Test Coverage Map

| Spec file                          | Areas covered                                          |
|------------------------------------|--------------------------------------------------------|
| `tests/devlab.spec.ts`             | BDD scenarios for all use cases + business rules      |
| `tests/viewDevices.test.ts`          | UC-1 (view devices)                                   |
| `tests/checkoutDevices.test.ts`        | UC-2 (checkout device)                                |
| `tests/returnDevices.test.ts`        | UC-3 (return device)                                  |
| `tests/adminFunctionality.test.ts` | UC-4, UC-5, admin/user consistency                    |
| `tests/errorScenarios.test.ts`     | HTTP-analogue errors (400/401/403), data integrity, boundary conditions |
