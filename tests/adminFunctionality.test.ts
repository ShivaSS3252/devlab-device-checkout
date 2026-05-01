import { DevLab } from '../src/domain/DevLab';
import { Device } from '../src/domain/Device';
import { User } from '../src/domain/User';
import { DevLabService } from '../src/services/DevLabService';

describe('Admin Functionality', () => {
  let devlab: DevLab;
  let service: DevLabService;
  let adminUser: User;
  let regularUser: User;

  beforeEach(() => {
    adminUser = new User('admin1', 'Admin User');
    regularUser = new User('user1', 'Regular User');
    devlab = new DevLab();
    service = new DevLabService(devlab);
    service.addUser(adminUser);
    service.addUser(regularUser);
  });

  describe('Admin Checking Out Devices as User', () => {
    it('should allow admin to checkout devices like a regular user', () => {
      const device = new Device('Admin Device', 1);
      service.addDevice(device);

      const updatedDevLab = service.checkoutDevice('admin1', 'Admin Device');

      const updatedAdmin = updatedDevLab.getUser('admin1');
      expect(updatedAdmin?.checkedOutDevices).toContain('Admin Device');
      expect(updatedDevLab.getDevices().find(d => d.name === 'Admin Device')).toBeUndefined();
    });

    it('should enforce same checkout limits for admin users', () => {
      service.addDevice(new Device('Device 1', 1));
      service.addDevice(new Device('Device 2', 1));
      service.addDevice(new Device('Device 3', 1));

      // Admin checks out 2 devices (at limit)
      service.checkoutDevice('admin1', 'Device 1');
      service.checkoutDevice('admin1', 'Device 2');

      // Third device should fail
      expect(() => service.checkoutDevice('admin1', 'Device 3')).toThrow('User has reached the maximum number of checked out devices');
    });

    it('should prevent admin from checking out same device twice', () => {
      const device = new Device('Duplicate Device', 2);
      service.addDevice(device);

      service.checkoutDevice('admin1', 'Duplicate Device');

      expect(() => service.checkoutDevice('admin1', 'Duplicate Device')).toThrow('User cannot checkout the same device twice');
    });
  });

  describe('Admin Viewing User Checkout Data', () => {
    it('should allow admin to view all users and their checked out devices', () => {
      service.addDevice(new Device('Device 1', 1));
      service.addDevice(new Device('Device 2', 1));
      service.addDevice(new Device('Device 3', 1));

      service.checkoutDevice('user1', 'Device 1');
      service.checkoutDevice('admin1', 'Device 2');

      const currentDevLab = service.getCurrentDevLab();
      const allUsers = currentDevLab.getUsers();

      expect(allUsers).toHaveLength(2);

      const regular = allUsers.find(u => u.id === 'user1');
      const admin = allUsers.find(u => u.id === 'admin1');

      expect(regular?.checkedOutDevices).toContain('Device 1');
      expect(admin?.checkedOutDevices).toContain('Device 2');
    });

    it('should show empty checked out list for users who have not checked out', () => {
      const currentDevLab = service.getCurrentDevLab();
      const allUsers = currentDevLab.getUsers();

      allUsers.forEach(user => {
        expect(user.checkedOutDevices).toEqual([]);
      });
    });

    it('should track multiple devices checked out by single user', () => {
      service.addDevice(new Device('Device 1', 1));
      service.addDevice(new Device('Device 2', 1));

      service.checkoutDevice('user1', 'Device 1');
      service.checkoutDevice('user1', 'Device 2');

      const currentDevLab = service.getCurrentDevLab();
      const user = currentDevLab.getUser('user1');

      expect(user?.checkedOutDevices).toHaveLength(2);
      expect(user?.checkedOutDevices).toContain('Device 1');
      expect(user?.checkedOutDevices).toContain('Device 2');
    });
  });

  describe('Stock Manipulation Prevention', () => {
    it('should prevent checking out devices with zero units', () => {
      const device = new Device('Out of Stock', 0);
      service.addDevice(device);

      expect(() => service.checkoutDevice('user1', 'Out of Stock')).toThrow('Device not available');
    });

    it('should prevent checking out non-existent devices', () => {
      expect(() => service.checkoutDevice('user1', 'Non-existent Device')).toThrow('Device not available');
    });

    it('should handle checking out last unit correctly', () => {
      const device = new Device('Last Unit', 1);
      service.addDevice(device);

      service.checkoutDevice('user1', 'Last Unit');

      // Device should be completely removed from inventory
      const currentDevLab = service.getCurrentDevLab();
      expect(currentDevLab.findDevice('Last Unit')).toBeUndefined();

      // But user should have it checked out
      const user = currentDevLab.getUser('user1');
      expect(user?.checkedOutDevices).toContain('Last Unit');
    });

    it('should maintain correct inventory count with multiple units', () => {
      const device = new Device('Multiple Units', 3);
      service.addDevice(device);

      service.checkoutDevice('user1', 'Multiple Units');

      const currentDevLab = service.getCurrentDevLab();
      const remainingDevice = currentDevLab.findDevice('Multiple Units');
      expect(remainingDevice?.units).toBe(2);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle checkout when user is at exact limit', () => {
      service.addDevice(new Device('Device 1', 1));
      service.addDevice(new Device('Device 2', 1));

      // Checkout exactly at limit (2 devices)
      service.checkoutDevice('user1', 'Device 1');
      service.checkoutDevice('user1', 'Device 2');

      const user = service.getCurrentDevLab().getUser('user1');
      expect(user?.checkedOutDevices).toHaveLength(2);
      expect(user?.canCheckoutMore()).toBe(false);
    });

    it('should handle return of device not in user possession', () => {
      service.addDevice(new Device('Device 1', 1));

      expect(() => service.returnDevice('user1', 'Device 1')).toThrow('Device not checked out by user');
    });

    it('should handle operations on non-existent users', () => {
      service.addDevice(new Device('Device 1', 1));

      expect(() => service.checkoutDevice('nonexistent-user', 'Device 1')).toThrow('User not found');
      expect(() => service.returnDevice('nonexistent-user', 'Device 1')).toThrow('User not found');
    });

    it('should handle empty DevLab operations', () => {
      const emptyDevLab = service.getCurrentDevLab();
      expect(emptyDevLab.getDevices()).toHaveLength(0);
      expect(emptyDevLab.getUsers()).toHaveLength(2); // Admin and regular user added in beforeEach
    });

    it('should handle multiple users checking out same device model', () => {
      // Add multiple units
      service.addDevice(new Device('Popular Device', 2));

      // Two different users checkout the same model
      service.checkoutDevice('user1', 'Popular Device');

      const anotherUser = new User('user2', 'Another User');
      service.addUser(anotherUser);
      service.checkoutDevice('user2', 'Popular Device');

      const currentDevLab = service.getCurrentDevLab();
      const user1 = currentDevLab.getUser('user1');
      const user2 = currentDevLab.getUser('user2');

      expect(user1?.checkedOutDevices).toContain('Popular Device');
      expect(user2?.checkedOutDevices).toContain('Popular Device');

      // Device should be completely checked out
      expect(currentDevLab.findDevice('Popular Device')).toBeUndefined();
    });
  });

  describe('Admin vs Regular User Behavior Consistency', () => {
    it('should apply same rules to admin and regular users', () => {
      service.addDevice(new Device('Device 1', 1));
      service.addDevice(new Device('Device 2', 1));
      service.addDevice(new Device('Device 3', 1));
      service.addDevice(new Device('Device 4', 1));

      // Admin checks out up to limit (2 devices)
      service.checkoutDevice('admin1', 'Device 1');
      service.checkoutDevice('admin1', 'Device 2');

      // Admin should be blocked from checking out more
      expect(() => service.checkoutDevice('admin1', 'Device 3')).toThrow('User has reached the maximum number of checked out devices');

      // But regular user can still checkout
      service.checkoutDevice('user1', 'Device 3');
      service.checkoutDevice('user1', 'Device 4');

      const currentDevLab = service.getCurrentDevLab();
      expect(currentDevLab.getUser('admin1')?.checkedOutDevices).toHaveLength(2);
      expect(currentDevLab.getUser('user1')?.checkedOutDevices).toHaveLength(2);
    });

    it('should maintain separate checkout records for admin and users', () => {
      service.addDevice(new Device('Shared Device', 2));

      service.checkoutDevice('admin1', 'Shared Device');

      const admin = service.getCurrentDevLab().getUser('admin1');
      expect(admin?.checkedOutDevices).toContain('Shared Device');

      // Admin checkout shouldn't affect regular user checkout
      service.checkoutDevice('user1', 'Shared Device');

      const user = service.getCurrentDevLab().getUser('user1');
      expect(user?.checkedOutDevices).toContain('Shared Device');
    });
  });
});
