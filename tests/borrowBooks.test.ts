import { DevLab } from '../src/domain/DevLab';
import { Device } from '../src/domain/Device';
import { User } from '../src/domain/User';
import { DevLabService } from '../src/services/DevLabService';
import { CheckoutLimitError } from '../src/errors/CheckoutLimitError';
import { DuplicateCheckoutError } from '../src/errors/DuplicateCheckoutError';

describe('Checking Out Devices', () => {
  let devlab: DevLab;
  let service: DevLabService;
  let user: User;

  beforeEach(() => {
    user = new User('user1', 'John Doe');
    devlab = new DevLab();
    service = new DevLabService(devlab);
    service.addUser(user);
  });

  it('should allow checking out a device when user has capacity', () => {
    const device = new Device('Device 1', 1);
    service.addDevice(device);

    const updatedDevLab = service.checkoutDevice('user1', 'Device 1');

    const updatedUser = updatedDevLab.getUser('user1');
    expect(updatedUser?.checkedOutDevices).toContain('Device 1');
    expect(updatedDevLab.getBooks().find(d => d.name === 'Device 1')).toBeUndefined();
  });

  it('should decrement device units when multiple units exist', () => {
    const device = new Device('Device 1', 2);
    service.addDevice(device);

    service.checkoutDevice('user1', 'Device 1');

    const remainingDevice = service.getCurrentDevLab().findDevice('Device 1');
    expect(remainingDevice?.units).toBe(1);
  });

  it('should remove device from DevLab when only one unit exists', () => {
    const device = new Device('Device 1', 1);
    service.addDevice(device);

    service.checkoutDevice('user1', 'Device 1');

    const remainingDevice = service.getCurrentDevLab().findDevice('Device 1');
    expect(remainingDevice).toBeUndefined();
  });

  it('should throw CheckoutLimitError when user tries to checkout beyond limit', () => {
    service.addDevice(new Device('Device 1', 1));
    service.addDevice(new Device('Device 2', 1));
    service.addDevice(new Device('Device 3', 1));

    service.checkoutDevice('user1', 'Device 1');
    service.checkoutDevice('user1', 'Device 2');

    expect(() => service.checkoutDevice('user1', 'Device 3')).toThrow('User has reached the maximum number of checked out devices');
  });

  it('should throw DuplicateCheckoutError when user tries to checkout same device twice', () => {
    const device = new Device('Device 1', 2);
    service.addDevice(device);

    service.checkoutDevice('user1', 'Device 1');

    expect(() => service.checkoutDevice('user1', 'Device 1')).toThrow('User cannot checkout the same device twice');
  });

  it('should throw error when user not found', () => {
    service.addDevice(new Device('Device 1', 1));

    expect(() => service.checkoutDevice('nonexistent', 'Device 1')).toThrow('User not found');
  });

  it('should throw error when device not available', () => {
    expect(() => service.checkoutDevice('user1', 'Nonexistent Device')).toThrow('Device not available');
  });

  it('should throw error when trying to checkout device with no units', () => {
    const device = new Device('Device 1', 0);
    service.addDevice(device);

    expect(() => service.checkoutDevice('user1', 'Device 1')).toThrow('Device not available');
  });
});
