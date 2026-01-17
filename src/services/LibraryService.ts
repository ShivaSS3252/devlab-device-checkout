import { Library } from '../domain/Library';
import { User } from '../domain/User';
import { Book } from '../domain/Book';
import { BorrowLimitError } from '../errors/BorrowLimitError';
import { DuplicateBorrowError } from '../errors/DuplicateBorrowError';

/**
 * APPLICATION SERVICE: LibraryService
 *
 * SOLID Principles:
 * - SRP: Single responsibility - orchestrates domain operations and business workflows
 * - OCP: Open for extension (new business workflows) but closed for modification
 * - DIP: Depends on abstractions (Library interface) not concretions
 * - ISP: Provides focused service interfaces for different client needs
 *
 * Service Layer Pattern:
 * - Coordinates domain entities without containing business logic
 * - Handles cross-cutting concerns (validation, error translation)
 * - Provides transactional boundaries for business operations
 */
export class LibraryService {
  /**
   * DIP: Constructor injection of Library abstraction
   * @param library - Abstracted library aggregate
   */
  constructor(private library: Library) {}

  /**
   * Query operation - read-only access to books
   * ISP: Segregated read operations from write operations
   * @returns immutable view of books
   */
  viewBooks(): readonly Book[] {
    return this.library.getBooks();
  }

  /**
   * Business workflow orchestration - borrow book use case
   * SRP: Single responsibility for borrowing workflow coordination
   * @param userId - user performing the borrow
   * @param bookTitle - book to borrow
   * @returns updated library state
   * @throws BorrowLimitError | DuplicateBorrowError | Error
   */
  borrowBook(userId: string, bookTitle: string): Library {
    const user = this.library.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const book = this.library.findBook(bookTitle);
    if (!book || !book.hasCopies()) {
      throw new Error('Book not available');
    }

    // Business rule validation
    if (!user.canBorrowMoreBooks()) {
      throw new BorrowLimitError();
    }

    if (user.hasBorrowedBook(bookTitle)) {
      throw new DuplicateBorrowError();
    }

    // Domain operation coordination
    // DIP: Service coordinates domain entities without knowing implementation details
    const updatedUser = new User(user.id, user.name, [...user.borrowedBooks, bookTitle]);
    const updatedLibrary = this.library.updateUser(updatedUser);
    const finalLibrary = updatedLibrary.removeBook(bookTitle);

    this.library = finalLibrary;
    return finalLibrary;
  }

  /**
   * Business workflow orchestration - return book use case
   * @param userId - user performing the return
   * @param bookTitle - book to return
   * @returns updated library state
   * @throws Error
   */
  returnBook(userId: string, bookTitle: string): Library {
    const user = this.library.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.hasBorrowedBook(bookTitle)) {
      throw new Error('Book not borrowed by user');
    }

    // Domain operation coordination
    const updatedUser = user.returnBook(bookTitle);
    const updatedLibrary = this.library.updateUser(updatedUser);
    const finalLibrary = updatedLibrary.returnBookToInventory(bookTitle);

    this.library = finalLibrary;
    return finalLibrary;
  }

  /**
   * Administrative operation - add book to inventory
   * ISP: Administrative operations segregated from user operations
   * @param book - book to add
   * @returns updated library state
   */
  addBook(book: Book): Library {
    const updatedLibrary = this.library.addBook(book);
    this.library = updatedLibrary;
    return updatedLibrary;
  }

  /**
   * Administrative operation - add user to system
   * @param user - user to add
   * @returns updated library state
   */
  addUser(user: User): Library {
    const updatedLibrary = this.library.addUser(user);
    this.library = updatedLibrary;
    return updatedLibrary;
  }

  /**
   * Utility method for testing and debugging
   * @returns current library state
   */
  getCurrentLibrary(): Library {
    return this.library;
  }
}
