export class DuplicateBorrowError extends Error {
  constructor(message: string = 'User cannot borrow the same book twice') {
    super(message);
    this.name = 'DuplicateBorrowError';
  }
}
