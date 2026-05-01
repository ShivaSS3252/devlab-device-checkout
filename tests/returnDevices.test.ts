import { DevLab } from '../src/domain/DevLab';
import { Device } from '../src/domain/Device';
import { User } from '../src/domain/User';
import { DevLabService } from '../src/services/DevLabService';

describe('Returning Devices', () => {
  let devlab: DevLab;
  let service: DevLabService;
  let user: User;

  beforeEach(() => {
    user = new User('user1', 'John Doe');
    devlab = new DevLab();
    service = new DevLabService(devlab);
    service.addUser(user);
  });

  it('should allow returning a checked out device', () => {
    const device = new Device('Device 1', 1);
    service.addDevice(device);
    service.checkoutDevice('user1', 'Device 1');

    const updatedDevLab = service.returnDevice('user1', 'Device 1');

    const updatedUser = updatedDevLab.getUser('user1');
    expect(updatedUser?.checkedOutDevices).not.toContain('Device 1');
    expect(updatedDevLab.findDevice('Device 1')).toBeDefined();
  });

  it('should increment device units when returning to existing inventory', () => {
    const originalDevice = new Device('Device 1', 2);
    service.addDevice(originalDevice);
    service.checkoutDevice('user1', 'Device 1'); // Now 1 unit left

    service.returnDevice('user1', 'Device 1');

    const returnedDevice = service.getCurrentDevLab().findDevice('Device 1');
    expect(returnedDevice?.units).toBe(2);
  });

  it('should add new device entry when returning device not in inventory', () => {
    // User has a device but inventory has no record (edge case)
    const userWithDevice = new User('user1', 'John Doe', ['Device 1']);
    devlab = new DevLab([], [userWithDevice]);
    service = new DevLabService(devlab);

    service.returnDevice('user1', 'Device 1');

    const returnedDevice = service.getCurrentDevLab().findDevice('Device 1');
    expect(returnedDevice?.units).toBe(1);
  });

  it('should throw error when user not found', () => {
    expect(() => service.returnDevice('nonexistent', 'Device 1')).toThrow('User not found');
  });

  it('should throw error when user tries to return device they did not checkout', () => {
    expect(() => service.returnDevice('user1', 'Device 1')).toThrow('Device not checked out by user');
  });

  it('should handle returning one device while user has multiple checked out', () => {
    service.addDevice(new Device('Device 1', 1));
    service.addDevice(new Device('Device 2', 1));

    service.checkoutDevice('user1', 'Device 1');
    service.checkoutDevice('user1', 'Device 2');

    service.returnDevice('user1', 'Device 1');

    const updatedUser = service.getCurrentDevLab().getUser('user1');
    expect(updatedUser?.checkedOutDevices).toEqual(['Device 2']);
    expect(service.getCurrentDevLab().findDevice('Device 1')).toBeDefined();
    expect(service.getCurrentDevLab().findDevice('Device 2')).toBeUndefined();
  });
});
