import { Book } from './Book';
import { User } from './User';

/**
 * DOMAIN AGGREGATE: Library
 *
 * SOLID Principles:
 * - SRP: Single responsibility - manages aggregate consistency between books and users
 * - OCP: Open for extension (new aggregate operations) but closed for modification
 * - LSP: Maintains behavioral contracts for aggregate operations
 * - ISP: Exposes aggregate-level operations, not individual entity operations
 *
 * Domain-Driven Design (DDD) Aggregate Pattern:
 * - Acts as consistency boundary for books and users
 * - Ensures business invariants across entities
 * - Manages aggregate lifecycle (creation, modification)
 * - Provides atomic operations on the aggregate
 */
export class Library {
  constructor(
    public readonly books: readonly Book[] = [],
    public readonly users: readonly User[] = []
  ) {}

  /**
   * Add book to library inventory (aggregate operation)
   * Maintains aggregate consistency - handles existing vs new books
   * OCP: Immutable - returns new Library instance
   * @param book - book to add
   * @returns new Library with updated inventory
   */
  addBook(book: Book): Library {
    const existingBookIndex = this.books.findIndex(b => b.title === book.title);
    if (existingBookIndex !== -1) {
      // Existing book - increment copies
      const existingBook = this.books[existingBookIndex];
      const updatedBook = existingBook.incrementCopies();
      const updatedBooks = [...this.books];
      updatedBooks[existingBookIndex] = updatedBook;
      return new Library(updatedBooks, this.users);
    }
    // New book - add to inventory
    return new Library([...this.books, book], this.users);
  }

  /**
   * Return book to inventory (specialized operation for book returns)
   * Ensures exactly 1 copy is added back to inventory
   * Handles both existing and new books correctly
   * @param bookTitle - title of book being returned
   * @returns new Library with book returned to inventory
   */
  returnBookToInventory(bookTitle: string): Library {
    const existingBookIndex = this.books.findIndex(b => b.title === bookTitle);
    if (existingBookIndex !== -1) {
      // Existing book - increment by exactly 1 copy
      const existingBook = this.books[existingBookIndex];
      const updatedBook = existingBook.incrementCopies();
      const updatedBooks = [...this.books];
      updatedBooks[existingBookIndex] = updatedBook;
      return new Library(updatedBooks, this.users);
    }
    // Book doesn't exist in inventory - add it with 1 copy
    const returnedBook = new Book(bookTitle, 1);
    return new Library([...this.books, returnedBook], this.users);
  }

  /**
   * Remove book from inventory (borrow operation)
   * SRP: Handles both decrement and complete removal logic
   * @param bookTitle - book to remove/borrow
   * @returns new Library with updated inventory
   */
  removeBook(bookTitle: string): Library {
    const bookIndex = this.books.findIndex(b => b.title === bookTitle);
    if (bookIndex === -1) {
      return this; // Book not found, no change
    }

    const book = this.books[bookIndex];
    if (book.copies > 1) {
      // Decrement copies of existing book
      const updatedBook = book.decrementCopies();
      const updatedBooks = [...this.books];
      updatedBooks[bookIndex] = updatedBook;
      return new Library(updatedBooks, this.users);
    }

    // Remove book entirely if last copy
    const updatedBooks = this.books.filter(b => b.title !== bookTitle);
    return new Library(updatedBooks, this.users);
  }

  /**
   * Add user to library system
   * @param user - user to add
   * @returns new Library with added user
   */
  addUser(user: User): Library {
    return new Library(this.books, [...this.users, user]);
  }

  /**
   * Update existing user in library
   * Maintains aggregate consistency - ensures user exists
   * @param user - updated user
   * @returns new Library with updated user
   * @throws Error if user not found
   */
  updateUser(user: User): Library {
    const userIndex = this.users.findIndex(u => u.id === user.id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    const updatedUsers = [...this.users];
    updatedUsers[userIndex] = user;
    return new Library(this.books, updatedUsers);
  }

  // Query operations - ISP: Segregated read-only operations

  /**
   * Get all books (read-only)
   * @returns immutable view of books
   */
  getBooks(): readonly Book[] {
    return this.books;
  }

  /**
   * Find user by ID
   * @param userId - user to find
   * @returns user or undefined
   */
  getUser(userId: string): User | undefined {
    return this.users.find(u => u.id === userId);
  }

  /**
   * Get all users (read-only)
   * @returns immutable view of users
   */
  getUsers(): readonly User[] {
    return this.users;
  }

  /**
   * Find book by title
   * @param bookTitle - book to find
   * @returns book or undefined
   */
  findBook(bookTitle: string): Book | undefined {
    return this.books.find(b => b.title === bookTitle);
  }
}
