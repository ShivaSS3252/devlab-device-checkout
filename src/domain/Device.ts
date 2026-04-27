export class Device {
  constructor(
    public name: string,
    public units: number = 1
  ) {}

  hasCopies(): boolean {
    return this.units > 0;
  }

  decrementCopies(): Device {
    if (!this.hasCopies()) {
      throw new Error('No units available');
    }
    return new Device(this.name, this.units - 1);
  }

  incrementCopies(): Device {
    return new Device(this.name, this.units + 1);
  }
}
