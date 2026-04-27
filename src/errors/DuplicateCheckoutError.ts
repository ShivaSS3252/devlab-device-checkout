export class DuplicateCheckoutError extends Error {
  constructor(message: string = 'User cannot checkout the same device twice') {
    super(message);
    this.name = 'DuplicateCheckoutError';
    Object.setPrototypeOf(this, DuplicateCheckoutError.prototype);
  }
}
