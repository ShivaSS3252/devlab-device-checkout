import { MAX_BOOKS_PER_USER } from '../constants/borrowing';

/**
 * DOMAIN ENTITY: User
 *
 * SOLID Principles:
 * - SRP: Single responsibility - manages user borrowing state and validation
 * - OCP: Open for extension but closed for modification (immutable state changes)
 * - LSP: Maintains behavioral contracts for borrowing operations
 * - ISP: Exposes only user-related operations, no admin functionality
 */
export class User {
  constructor(
    public id: string,
    public name: string,
    public borrowedBooks: string[] = []
  ) {}

  /**
   * Business rule validation - check if user can borrow more books
   * OCP: Business rules can be extended through configuration (MAX_BOOKS_PER_USER)
   * @returns true if under borrowing limit
   */
  canBorrowMoreBooks(): boolean {
    return this.borrowedBooks.length < MAX_BOOKS_PER_USER;
  }

  /**
   * Check if user has already borrowed specific book
   * @param bookTitle - title of book to check
   * @returns true if book is in borrowed list
   */
  hasBorrowedBook(bookTitle: string): boolean {
    return this.borrowedBooks.includes(bookTitle);
  }

  /**
   * Create new User instance with additional borrowed book (immutable)
   * LSP: Maintains behavioral contract - returns new User, doesn't modify existing
   * @param bookTitle - book to borrow
   * @returns new User with updated borrowed books
   * @throws Error if borrowing limit exceeded or already borrowed
   */
  borrowBook(bookTitle: string): User {
    if (!this.canBorrowMoreBooks()) {
      throw new Error('Cannot borrow more books');
    }
    if (this.hasBorrowedBook(bookTitle)) {
      throw new Error('Already borrowed this book');
    }
    return new User(this.id, this.name, [...this.borrowedBooks, bookTitle]);
  }

  /**
   * Create new User instance with book removed from borrowed list (immutable)
   * @param bookTitle - book to return
   * @returns new User with updated borrowed books
   * @throws Error if book was not borrowed
   */
  returnBook(bookTitle: string): User {
    if (!this.hasBorrowedBook(bookTitle)) {
      throw new Error('Book not borrowed by user');
    }
    return new User(
      this.id,
      this.name,
      this.borrowedBooks.filter(title => title !== bookTitle)
    );
  }
}
