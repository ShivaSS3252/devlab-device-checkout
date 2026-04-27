export class CheckoutLimitError extends Error {
  constructor(message: string = 'User has reached the maximum number of checked out devices') {
    super(message);
    this.name = 'CheckoutLimitError';
    Object.setPrototypeOf(this, CheckoutLimitError.prototype);
  }
}
