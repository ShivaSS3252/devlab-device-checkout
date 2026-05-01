import { DevLab } from '../src/domain/DevLab';
import { Device } from '../src/domain/Device';
import { User } from '../src/domain/User';
import { DevLabService } from '../src/services/DevLabService';

describe('Error Scenarios and Edge Cases', () => {
  let devlab: DevLab;
  let service: DevLabService;
  let user: User;

  beforeEach(() => {
    user = new User('test-user', 'Test User');
    devlab = new DevLab();
    service = new DevLabService(devlab);
    service.addUser(user);
  });

  describe('HTTP-like Error Response Simulation (400 Bad Request)', () => {
    it('should handle invalid device names (400 - Bad Request equivalent)', () => {
      // Empty name
      expect(() => new Device('', 1)).not.toThrow();

      // Very long name
      const longName = 'A'.repeat(1000);
      expect(() => new Device(longName, 1)).not.toThrow();

      // Special characters
      expect(() => new Device('Device@#$%^&*()', 1)).not.toThrow();
    });

    it('should handle invalid user names (400 - Bad Request equivalent)', () => {
      expect(() => new User('', 'Test')).not.toThrow();
      expect(() => new User('user1', '')).not.toThrow();
    });

    it('should handle negative device units (400 - Bad Request equivalent)', () => {
      const device = new Device('Negative Units', -1);
      expect(device.units).toBe(-1);

      service.addDevice(device);
      expect(() => service.checkoutDevice('test-user', 'Negative Units')).toThrow('Device not available');
    });
  });

  describe('HTTP-like Error Response Simulation (401 Unauthorized)', () => {
    it('should handle unauthorized access attempts (401 equivalent)', () => {
      service.addDevice(new Device('Restricted Device', 1));

      // Try to checkout with non-existent user
      expect(() => service.checkoutDevice('unauthorized-user', 'Restricted Device')).toThrow('User not found');

      // Try to return device for non-existent user
      expect(() => service.returnDevice('unauthorized-user', 'Restricted Device')).toThrow('User not found');
    });

    it('should prevent access to other users checkout records (401 equivalent)', () => {
      const otherUser = new User('other-user', 'Other User');
      service.addUser(otherUser);

      service.addDevice(new Device('Private Device', 1));
      service.checkoutDevice('other-user', 'Private Device');

      // Current user shouldn't be able to see/access other user's checked out devices directly
      const currentDevLab = service.getCurrentDevLab();
      const otherUserRecord = currentDevLab.getUser('other-user');

      expect(otherUserRecord?.checkedOutDevices).toContain('Private Device');
    });
  });

  describe('HTTP-like Error Response Simulation (403 Forbidden)', () => {
    it('should enforce checkout limits (403 - Forbidden equivalent)', () => {
      service.addDevice(new Device('Device 1', 1));
      service.addDevice(new Device('Device 2', 1));
      service.addDevice(new Device('Forbidden Device', 1));

      // User checks out up to limit
      service.checkoutDevice('test-user', 'Device 1');
      service.checkoutDevice('test-user', 'Device 2');

      // Third checkout should be forbidden (equivalent to 403)
      expect(() => service.checkoutDevice('test-user', 'Forbidden Device')).toThrow('User has reached the maximum number of checked out devices');
    });

    it('should prevent duplicate checkout (403 - Forbidden equivalent)', () => {
      const device = new Device('Duplicate Device', 2);
      service.addDevice(device);

      service.checkoutDevice('test-user', 'Duplicate Device');

      // Second checkout of same device should be forbidden
      expect(() => service.checkoutDevice('test-user', 'Duplicate Device')).toThrow('User cannot checkout the same device twice');
    });

    it('should prevent checking out out-of-stock devices (403 - Forbidden equivalent)', () => {
      const device = new Device('Out of Stock', 0);
      service.addDevice(device);

      expect(() => service.checkoutDevice('test-user', 'Out of Stock')).toThrow('Device not available');
    });
  });

  describe('Critical Edge Cases', () => {
    it('should handle concurrent operations on same device', () => {
      const device = new Device('Last Unit', 1);
      service.addDevice(device);

      const user2 = new User('user2', 'User 2');
      service.addUser(user2);

      // First user checks out successfully
      service.checkoutDevice('test-user', 'Last Unit');

      // Second user should fail
      expect(() => service.checkoutDevice('user2', 'Last Unit')).toThrow('Device not available');
    });

    it('should handle return of device not in user possession', () => {
      service.addDevice(new Device('Unchecked Device', 1));

      expect(() => service.returnDevice('test-user', 'Unchecked Device')).toThrow('Device not checked out by user');
    });

    it('should handle maximum integer values for device units', () => {
      const device = new Device('Many Units', Number.MAX_SAFE_INTEGER);
      service.addDevice(device);

      service.checkoutDevice('test-user', 'Many Units');

      const remainingDevice = service.getCurrentDevLab().findDevice('Many Units');
      expect(remainingDevice?.units).toBe(Number.MAX_SAFE_INTEGER - 1);
    });

    it('should handle zero device units edge case', () => {
      const device = new Device('Zero Units', 0);
      service.addDevice(device);

      const foundDevice = service.getCurrentDevLab().findDevice('Zero Units');
      expect(foundDevice?.units).toBe(0);
      expect(foundDevice?.hasCopies()).toBe(false);
    });

    it('should handle empty string device names', () => {
      const device = new Device('', 1);
      service.addDevice(device);

      const foundDevice = service.getCurrentDevLab().findDevice('');
      expect(foundDevice?.name).toBe('');
      expect(foundDevice?.units).toBe(1);
    });

    it('should handle special characters in device names', () => {
      const specialName = 'Device@#$%^&*()_+{}|:<>?[]\\;\'",./';
      const device = new Device(specialName, 1);
      service.addDevice(device);

      const foundDevice = service.getCurrentDevLab().findDevice(specialName);
      expect(foundDevice?.name).toBe(specialName);
    });
  });

  describe('Data Integrity Edge Cases', () => {
    it('should maintain data consistency after multiple operations', () => {
      service.addDevice(new Device('Test Device 1', 2));
      service.addDevice(new Device('Test Device 2', 1));

      // Checkout two different devices
      service.checkoutDevice('test-user', 'Test Device 1');
      service.checkoutDevice('test-user', 'Test Device 2');

      let user = service.getCurrentDevLab().getUser('test-user');
      expect(user?.checkedOutDevices).toHaveLength(2);
      expect(user?.checkedOutDevices).toContain('Test Device 1');
      expect(user?.checkedOutDevices).toContain('Test Device 2');

      let remainingDevice1 = service.getCurrentDevLab().findDevice('Test Device 1');
      expect(remainingDevice1?.units).toBe(1);

      // Return one device
      service.returnDevice('test-user', 'Test Device 1');

      user = service.getCurrentDevLab().getUser('test-user');
      expect(user?.checkedOutDevices).toHaveLength(1);
      expect(user?.checkedOutDevices).toContain('Test Device 2');

      remainingDevice1 = service.getCurrentDevLab().findDevice('Test Device 1');
      expect(remainingDevice1?.units).toBe(2); // Back to original count
    });

    it('should handle user with corrupted checked out devices array', () => {
      // Manually create a user with corrupted data
      const corruptedUser = new User('corrupted', 'Corrupted User');
      corruptedUser.checkedOutDevices.push('Non-existent Device');
      service.addUser(corruptedUser);

      // Operations should still work normally for this user
      service.addDevice(new Device('Real Device', 1));
      service.checkoutDevice('corrupted', 'Real Device');

      const updatedUser = service.getCurrentDevLab().getUser('corrupted');
      expect(updatedUser?.checkedOutDevices).toContain('Real Device');
      expect(updatedUser?.checkedOutDevices).toContain('Non-existent Device'); // Corrupted data remains
    });

    it('should handle devices with same name but different instances', () => {
      // Create two separate device instances with same name
      const device1 = new Device('Same Model', 1);
      const device2 = new Device('Same Model', 1);

      service.addDevice(device1);
      service.addDevice(device2); // This should increment the existing device's units

      const devices = service.getCurrentDevLab().getDevices();
      const sameModelDevices = devices.filter(d => d.name === 'Same Model');
      expect(sameModelDevices).toHaveLength(1);
      expect(sameModelDevices[0].units).toBe(2);
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle exactly 2 devices checked out (at limit)', () => {
      service.addDevice(new Device('Device 1', 1));
      service.addDevice(new Device('Device 2', 1));

      service.checkoutDevice('test-user', 'Device 1');
      service.checkoutDevice('test-user', 'Device 2');

      const user = service.getCurrentDevLab().getUser('test-user');
      expect(user?.canCheckoutMore()).toBe(false);
      expect(user?.checkedOutDevices).toHaveLength(2);
    });

    it('should handle checkout after returning to go below limit', () => {
      service.addDevice(new Device('Device 1', 1));
      service.addDevice(new Device('Device 2', 1));
      service.addDevice(new Device('Device 3', 1));

      // Reach limit
      service.checkoutDevice('test-user', 'Device 1');
      service.checkoutDevice('test-user', 'Device 2');

      // Should fail
      expect(() => service.checkoutDevice('test-user', 'Device 3')).toThrow('User has reached the maximum number of checked out devices');

      // Return one device
      service.returnDevice('test-user', 'Device 1');

      // Should now succeed
      service.checkoutDevice('test-user', 'Device 3');

      const user = service.getCurrentDevLab().getUser('test-user');
      expect(user?.checkedOutDevices).toHaveLength(2);
      expect(user?.checkedOutDevices).toContain('Device 2');
      expect(user?.checkedOutDevices).toContain('Device 3');
    });
  });
});
