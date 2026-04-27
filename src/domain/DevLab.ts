import { Device } from './Device';
import { User } from './User';

export class DevLab {
  constructor(
    public readonly books: readonly Device[] = [],
    public readonly users: readonly User[] = []
  ) {}

  addDevice(device: Device): DevLab {
    const existingDeviceIndex = this.books.findIndex(d => d.name === device.name);
    if (existingDeviceIndex !== -1) {
      const existingDevice = this.books[existingDeviceIndex];
      const updatedDevice = existingDevice.incrementCopies();
      const updatedDevices = [...this.books];
      updatedDevices[existingDeviceIndex] = updatedDevice;
      return new DevLab(updatedDevices, this.users);
    }
    return new DevLab([...this.books, device], this.users);
  }

  returnToInventory(deviceName: string): DevLab {
    const existingDeviceIndex = this.books.findIndex(d => d.name === deviceName);
    if (existingDeviceIndex !== -1) {
      const existingDevice = this.books[existingDeviceIndex];
      const updatedDevice = existingDevice.incrementCopies();
      const updatedDevices = [...this.books];
      updatedDevices[existingDeviceIndex] = updatedDevice;
      return new DevLab(updatedDevices, this.users);
    }
    const returnedDevice = new Device(deviceName, 1);
    return new DevLab([...this.books, returnedDevice], this.users);
  }

  removeDevice(deviceName: string): DevLab {
    const deviceIndex = this.books.findIndex(d => d.name === deviceName);
    if (deviceIndex === -1) {
      return this;
    }

    const device = this.books[deviceIndex];
    if (device.units > 1) {
      const updatedDevice = device.decrementCopies();
      const updatedDevices = [...this.books];
      updatedDevices[deviceIndex] = updatedDevice;
      return new DevLab(updatedDevices, this.users);
    }

    const updatedDevices = this.books.filter(d => d.name !== deviceName);
    return new DevLab(updatedDevices, this.users);
  }

  addUser(user: User): DevLab {
    return new DevLab(this.books, [...this.users, user]);
  }

  updateUser(user: User): DevLab {
    const userIndex = this.users.findIndex(u => u.id === user.id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    const updatedUsers = [...this.users];
    updatedUsers[userIndex] = user;
    return new DevLab(this.books, updatedUsers);
  }

  getBooks(): readonly Device[] {
    return this.books;
  }

  getUser(userId: string): User | undefined {
    return this.users.find(u => u.id === userId);
  }

  getUsers(): readonly User[] {
    return this.users;
  }

  findDevice(deviceName: string): Device | undefined {
    return this.books.find(d => d.name === deviceName);
  }
}
