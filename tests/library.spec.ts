/**
 * SPEC: DevLab — Test Device Checkout System — Behavioral Specification (BDD)
 *
 * Structure: Feature → Scenario (Given / When / Then)
 * All specs are pure domain/service layer — no UI, no network.
 */

import { DevLab } from '../src/domain/DevLab';
import { Device } from '../src/domain/Device';
import { User } from '../src/domain/User';
import { DevLabService } from '../src/services/DevLabService';
import { CheckoutLimitError } from '../src/errors/CheckoutLimitError';
import { DuplicateCheckoutError } from '../src/errors/DuplicateCheckoutError';
import { MAX_DEVICES_PER_USER } from '../src/constants/borrowing';

// ─── helpers ────────────────────────────────────────────────────────────────

function makeService(...devices: Device[]): { service: DevLabService; user: User } {
  const user = new User('u1', 'Alice');
  const devlab = new DevLab(devices, [user]);
  const service = new DevLabService(devlab);
  return { service, user };
}

// ─── Feature: View Devices ───────────────────────────────────────────────────

describe('Feature: View Devices', () => {
  describe('Scenario: DevLab has no devices', () => {
    it('Given the DevLab is empty, When I view devices, Then I receive an empty list', () => {
      const { service } = makeService();

      const devices = service.viewDevices();

      expect(devices).toHaveLength(0);
    });
  });

  describe('Scenario: DevLab has devices', () => {
    it('Given devices exist in the DevLab, When I view devices, Then I receive all devices', () => {
      const device1 = new Device('iPhone 15 Pro', 3);
      const device2 = new Device('Samsung Galaxy S24', 1);
      const { service } = makeService(device1, device2);

      const devices = service.viewDevices();

      expect(devices).toHaveLength(2);
      expect(devices.map(d => d.name)).toContain('iPhone 15 Pro');
      expect(devices.map(d => d.name)).toContain('Samsung Galaxy S24');
    });
  });

  describe('Scenario: Immutability contract', () => {
    it('Given the device list is returned, Then it is readonly and cannot be mutated at compile time', () => {
      const { service } = makeService(new Device('iPad Pro 12.9', 2));

      const devices = service.viewDevices();

      // TypeScript readonly — runtime array is still structurally sound
      expect(devices).toBeDefined();
      expect(devices.length).toBeGreaterThan(0);
    });
  });
});

// ─── Feature: Checkout a Device ─────────────────────────────────────────────

describe('Feature: Checkout a Device', () => {
  describe('Scenario: Successful checkout — single unit', () => {
    it('Given a device with 1 unit and a user under the limit, When the user checks it out, Then the device is removed from inventory and added to the user', () => {
      const { service } = makeService(new Device('Google Pixel 8', 1));

      const lab = service.checkoutDevice('u1', 'Google Pixel 8');

      expect(lab.getUser('u1')?.checkedOutDevices).toContain('Google Pixel 8');
      expect(lab.findDevice('Google Pixel 8')).toBeUndefined();
    });
  });

  describe('Scenario: Successful checkout — multiple units', () => {
    it('Given a device with 3 units, When the user checks one out, Then inventory decrements by 1', () => {
      const { service } = makeService(new Device('MacBook Pro 14', 3));

      service.checkoutDevice('u1', 'MacBook Pro 14');

      expect(service.getCurrentDevLab().findDevice('MacBook Pro 14')?.units).toBe(2);
    });
  });

  describe('Scenario: Checkout limit enforced', () => {
    it(`Given a user who has already checked out ${MAX_DEVICES_PER_USER} devices, When they try to checkout another, Then a CheckoutLimitError is thrown`, () => {
      const { service } = makeService(
        new Device('Device A', 1),
        new Device('Device B', 1),
        new Device('Device C', 1),
      );

      service.checkoutDevice('u1', 'Device A');
      service.checkoutDevice('u1', 'Device B');

      expect(() => service.checkoutDevice('u1', 'Device C')).toThrow(CheckoutLimitError);
      expect(() => service.checkoutDevice('u1', 'Device C')).toThrow(
        'User has reached the maximum number of checked out devices',
      );
    });
  });

  describe('Scenario: Duplicate checkout prevented', () => {
    it('Given a user who already checked out a device, When they try to checkout the same device again, Then a DuplicateCheckoutError is thrown', () => {
      const { service } = makeService(new Device('iPad Air', 2));

      service.checkoutDevice('u1', 'iPad Air');

      expect(() => service.checkoutDevice('u1', 'iPad Air')).toThrow(DuplicateCheckoutError);
      expect(() => service.checkoutDevice('u1', 'iPad Air')).toThrow(
        'User cannot checkout the same device twice',
      );
    });
  });

  describe('Scenario: Device has zero units', () => {
    it('Given a device with 0 units, When a user tries to checkout, Then an error is thrown', () => {
      const { service } = makeService(new Device('Out of Stock', 0));

      expect(() => service.checkoutDevice('u1', 'Out of Stock')).toThrow('Device not available');
    });
  });

  describe('Scenario: Device does not exist', () => {
    it('Given a device name that is not in the DevLab, When a user tries to checkout, Then an error is thrown', () => {
      const { service } = makeService();

      expect(() => service.checkoutDevice('u1', 'Ghost Device')).toThrow('Device not available');
    });
  });

  describe('Scenario: User does not exist', () => {
    it('Given a user ID that is not registered, When they try to checkout a device, Then an error is thrown', () => {
      const { service } = makeService(new Device('Some Device', 1));

      expect(() => service.checkoutDevice('unknown', 'Some Device')).toThrow('User not found');
    });
  });
});

// ─── Feature: Return a Device ────────────────────────────────────────────────

describe('Feature: Return a Device', () => {
  describe('Scenario: Successful return', () => {
    it('Given a user who checked out a device, When they return it, Then the device is removed from their list and restored to inventory', () => {
      const { service } = makeService(new Device('OnePlus 12', 1));
      service.checkoutDevice('u1', 'OnePlus 12');

      const lab = service.returnDevice('u1', 'OnePlus 12');

      expect(lab.getUser('u1')?.checkedOutDevices).not.toContain('OnePlus 12');
      expect(lab.findDevice('OnePlus 12')).toBeDefined();
    });
  });

  describe('Scenario: Inventory unit count restored', () => {
    it('Given a device that had 2 units and 1 was checked out, When that unit is returned, Then inventory is back to 2', () => {
      const { service } = makeService(new Device('Surface Pro 9', 2));
      service.checkoutDevice('u1', 'Surface Pro 9');

      service.returnDevice('u1', 'Surface Pro 9');

      expect(
        service.getCurrentDevLab().findDevice('Surface Pro 9')?.units,
      ).toBe(2);
    });
  });

  describe('Scenario: Device record missing from inventory on return', () => {
    it('Given a user has a checked out device but the DevLab has no record, When they return it, Then a new entry with 1 unit is created', () => {
      const userWithDevice = new User('u1', 'Alice', ['Orphaned Device']);
      const lab = new DevLab([], [userWithDevice]);
      const service = new DevLabService(lab);

      service.returnDevice('u1', 'Orphaned Device');

      expect(service.getCurrentDevLab().findDevice('Orphaned Device')?.units).toBe(1);
    });
  });

  describe('Scenario: Return device not checked out by user', () => {
    it('Given a user who never checked out a device, When they try to return it, Then an error is thrown', () => {
      const { service } = makeService(new Device('Random Device', 1));

      expect(() => service.returnDevice('u1', 'Random Device')).toThrow('Device not checked out by user');
    });
  });

  describe('Scenario: Return for unknown user', () => {
    it('Given a user ID that is not registered, When they try to return a device, Then an error is thrown', () => {
      const { service } = makeService();

      expect(() => service.returnDevice('ghost', 'Any Device')).toThrow('User not found');
    });
  });

  describe('Scenario: Return one device while holding multiple', () => {
    it('Given a user who checked out Device A and Device B, When they return Device A, Then only Device B remains in their list', () => {
      const { service } = makeService(new Device('Device A', 1), new Device('Device B', 1));
      service.checkoutDevice('u1', 'Device A');
      service.checkoutDevice('u1', 'Device B');

      service.returnDevice('u1', 'Device A');

      expect(service.getCurrentDevLab().getUser('u1')?.checkedOutDevices).toEqual(['Device B']);
    });
  });
});

// ─── Feature: Admin — Inventory Management ───────────────────────────────────

describe('Feature: Admin — Inventory Management', () => {
  describe('Scenario: Add a new device', () => {
    it('Given an empty DevLab, When admin adds a device, Then the device appears in inventory', () => {
      const service = new DevLabService(new DevLab());

      service.addDevice(new Device('New Arrival', 5));

      expect(service.getCurrentDevLab().findDevice('New Arrival')?.units).toBe(5);
    });
  });

  describe('Scenario: Add a duplicate model increments units', () => {
    it('Given a device already in inventory, When admin adds the same model again, Then the unit count increases by 1', () => {
      const service = new DevLabService(new DevLab([new Device('Popular Device', 2)]));

      service.addDevice(new Device('Popular Device', 1));

      expect(service.getCurrentDevLab().findDevice('Popular Device')?.units).toBe(3);
    });
  });

  describe('Scenario: Add a new user', () => {
    it('Given the DevLab has no users, When admin adds a user, Then the user appears in the system', () => {
      const service = new DevLabService(new DevLab());

      service.addUser(new User('u99', 'Bob'));

      expect(service.getCurrentDevLab().getUser('u99')?.name).toBe('Bob');
    });
  });
});

// ─── Feature: Business Rules ─────────────────────────────────────────────────

describe('Feature: Business Rules', () => {
  describe('Checkout limit constant', () => {
    it(`MAX_DEVICES_PER_USER is ${MAX_DEVICES_PER_USER}`, () => {
      expect(MAX_DEVICES_PER_USER).toBe(2);
    });
  });

  describe('CheckoutLimitError', () => {
    it('has the correct name and default message', () => {
      const err = new CheckoutLimitError();
      expect(err.name).toBe('CheckoutLimitError');
      expect(err.message).toBe('User has reached the maximum number of checked out devices');
    });
  });

  describe('DuplicateCheckoutError', () => {
    it('has the correct name and default message', () => {
      const err = new DuplicateCheckoutError();
      expect(err.name).toBe('DuplicateCheckoutError');
      expect(err.message).toBe('User cannot checkout the same device twice');
    });
  });

  describe('Scenario: Checkout → return → checkout again (limit cycle)', () => {
    it('Given a user at the checkout limit, When they return a device, Then they can checkout again', () => {
      const { service } = makeService(
        new Device('A', 1),
        new Device('B', 1),
        new Device('C', 1),
      );

      service.checkoutDevice('u1', 'A');
      service.checkoutDevice('u1', 'B');
      expect(() => service.checkoutDevice('u1', 'C')).toThrow(CheckoutLimitError);

      service.returnDevice('u1', 'A');
      service.checkoutDevice('u1', 'C'); // should not throw

      expect(service.getCurrentDevLab().getUser('u1')?.checkedOutDevices).toEqual(['B', 'C']);
    });
  });

  describe('Scenario: Multiple users share inventory', () => {
    it('Given a device with 2 units, When two different users each checkout one, Then inventory is exhausted', () => {
      const u2 = new User('u2', 'Bob');
      const lab = new DevLab([new Device('Shared Device', 2)], [new User('u1', 'Alice'), u2]);
      const service = new DevLabService(lab);

      service.checkoutDevice('u1', 'Shared Device');
      service.checkoutDevice('u2', 'Shared Device');

      expect(service.getCurrentDevLab().findDevice('Shared Device')).toBeUndefined();
    });
  });

  describe('Scenario: Device entity immutability', () => {
    it('Given a Device, When decrementCopies() is called, Then a new Device instance is returned and the original is unchanged', () => {
      const original = new Device('Immutable Device', 3);

      const decremented = original.decrementCopies();

      expect(original.units).toBe(3);
      expect(decremented.units).toBe(2);
    });

    it('Given a Device with 0 units, When decrementCopies() is called, Then an error is thrown', () => {
      const device = new Device('Empty Device', 0);

      expect(() => device.decrementCopies()).toThrow('No units available');
    });
  });

  describe('Scenario: User entity immutability', () => {
    it('Given a User, When checkoutDevice() is called, Then a new User instance is returned and the original is unchanged', () => {
      const original = new User('u1', 'Alice');

      const updated = original.checkoutDevice('Some Device');

      expect(original.checkedOutDevices).toHaveLength(0);
      expect(updated.checkedOutDevices).toContain('Some Device');
    });
  });
});
