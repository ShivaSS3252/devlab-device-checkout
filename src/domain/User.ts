import { MAX_DEVICES_PER_USER } from '../constants/borrowing';

/**
 * DOMAIN ENTITY: User
 *
 * SOLID Principles:
 * - SRP: Single responsibility - manages user checkout state and validation
 * - OCP: Open for extension but closed for modification (immutable state changes)
 * - LSP: Maintains behavioral contracts for checkout operations
 * - ISP: Exposes only user-related operations, no admin functionality
 */
export class User {
  constructor(
    public id: string,
    public name: string,
    public checkedOutDevices: string[] = []
  ) {}

  /**
   * Business rule validation - check if user can checkout more devices
   * OCP: Business rules can be extended through configuration (MAX_DEVICES_PER_USER)
   * @returns true if under checkout limit
   */
  canCheckoutMore(): boolean {
    return this.checkedOutDevices.length < MAX_DEVICES_PER_USER;
  }

  /**
   * Check if user has already checked out a specific device
   * @param deviceName - name of device to check
   * @returns true if device is in checked out list
   */
  hasDevice(deviceName: string): boolean {
    return this.checkedOutDevices.includes(deviceName);
  }

  /**
   * Create new User instance with additional checked out device (immutable)
   * LSP: Maintains behavioral contract - returns new User, doesn't modify existing
   * @param deviceName - device to checkout
   * @returns new User with updated checked out devices
   * @throws Error if checkout limit exceeded or already checked out
   */
  checkoutDevice(deviceName: string): User {
    if (!this.canCheckoutMore()) {
      throw new Error('Cannot checkout more devices');
    }
    if (this.hasDevice(deviceName)) {
      throw new Error('Already checked out this device');
    }
    return new User(this.id, this.name, [...this.checkedOutDevices, deviceName]);
  }

  /**
   * Create new User instance with device removed from checked out list (immutable)
   * @param deviceName - device to return
   * @returns new User with updated checked out devices
   * @throws Error if device was not checked out
   */
  returnDevice(deviceName: string): User {
    if (!this.hasDevice(deviceName)) {
      throw new Error('Device not checked out by user');
    }
    return new User(
      this.id,
      this.name,
      this.checkedOutDevices.filter(name => name !== deviceName)
    );
  }
}
