/**
 * DOMAIN ENTITY: Book
 *
 * SOLID Principles:
 * - SRP: Single responsibility - manages book state and copy operations
 * - OCP: Open for extension (can be extended via composition) but closed for modification
 * - LSP: Maintains behavioral contracts for copy management
 * - ISP: Exposes only book-related operations
 */
export class Book {
  constructor(
    public title: string,
    public copies: number = 1
  ) {}

  /**
   * Check if book has available copies
   * @returns true if copies > 0
   */
  hasCopies(): boolean {
    return this.copies > 0;
  }

  /**
   * Create new Book instance with decremented copies (immutable)
   * OCP: Returns new instance instead of modifying existing one
   * @returns new Book with copies - 1
   * @throws Error if no copies available
   */
  decrementCopies(): Book {
    if (!this.hasCopies()) {
      throw new Error('No copies available');
    }
    return new Book(this.title, this.copies - 1);
  }

  /**
   * Create new Book instance with incremented copies (immutable)
   * @returns new Book with copies + 1
   */
  incrementCopies(): Book {
    return new Book(this.title, this.copies + 1);
  }
}
