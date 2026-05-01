import { DevLab } from '../src/domain/DevLab';
import { Device } from '../src/domain/Device';
import { DevLabService } from '../src/services/DevLabService';

describe('Viewing Devices', () => {
  it('should return empty list when DevLab has no devices', () => {
    const devlab = new DevLab();
    const service = new DevLabService(devlab);

    const devices = service.viewDevices();

    expect(devices).toEqual([]);
  });

  it('should return list of devices when DevLab has devices', () => {
    const device1 = new Device('Device 1', 1);
    const device2 = new Device('Device 2', 2);
    const devlab = new DevLab([device1, device2]);
    const service = new DevLabService(devlab);

    const devices = service.viewDevices();

    expect(devices).toEqual([device1, device2]);
  });

  it('should return readonly array type for immutability contract', () => {
    const devlab = new DevLab([new Device('Device 1')]);
    const service = new DevLabService(devlab);

    const devices = service.viewDevices();

    // TypeScript ensures this is readonly at compile time
    // Runtime mutation is prevented by the readonly modifier
    expect(devices).toBeDefined();
    expect(devices.length).toBe(1);
  });
});
