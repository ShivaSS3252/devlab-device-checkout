import { DevLab } from '../domain/DevLab';
import { User } from '../domain/User';
import { Device } from '../domain/Device';
import { CheckoutLimitError } from '../errors/CheckoutLimitError';
import { DuplicateCheckoutError } from '../errors/DuplicateCheckoutError';

export class DevLabService {
  constructor(private devlab: DevLab) {}

  viewDevices(): readonly Device[] {
    return this.devlab.getBooks();
  }

  checkoutDevice(userId: string, deviceName: string): DevLab {
    const user = this.devlab.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const device = this.devlab.findDevice(deviceName);
    if (!device || !device.hasCopies()) {
      throw new Error('Device not available');
    }

    if (!user.canCheckoutMore()) {
      throw new CheckoutLimitError();
    }

    if (user.hasDevice(deviceName)) {
      throw new DuplicateCheckoutError();
    }

    const updatedUser = new User(user.id, user.name, [...user.checkedOutDevices, deviceName]);
    const updated = this.devlab.updateUser(updatedUser);
    const final = updated.removeDevice(deviceName);

    this.devlab = final;
    return final;
  }

  returnDevice(userId: string, deviceName: string): DevLab {
    const user = this.devlab.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.hasDevice(deviceName)) {
      throw new Error('Device not checked out by user');
    }

    const updatedUser = user.returnDevice(deviceName);
    const updated = this.devlab.updateUser(updatedUser);
    const final = updated.returnToInventory(deviceName);

    this.devlab = final;
    return final;
  }

  addDevice(device: Device): DevLab {
    const updated = this.devlab.addDevice(device);
    this.devlab = updated;
    return updated;
  }

  addUser(user: User): DevLab {
    const updated = this.devlab.addUser(user);
    this.devlab = updated;
    return updated;
  }

  getCurrentDevLab(): DevLab {
    return this.devlab;
  }
}
