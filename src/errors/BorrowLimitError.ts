export class BorrowLimitError extends Error {
  constructor(message: string = 'User has reached the maximum number of borrowed books') {
    super(message);
    this.name = 'BorrowLimitError';
  }
}
