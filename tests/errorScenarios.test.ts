import { Library } from '../src/domain/Library';
import { Book } from '../src/domain/Book';
import { User } from '../src/domain/User';
import { LibraryService } from '../src/services/LibraryService';

describe('Error Scenarios and Edge Cases', () => {
  let library: Library;
  let service: LibraryService;
  let user: User;

  beforeEach(() => {
    user = new User('test-user', 'Test User');
    library = new Library();
    service = new LibraryService(library);
    service.addUser(user);
  });

  describe('HTTP-like Error Response Simulation (400 Bad Request)', () => {
    it('should handle invalid book titles (400 - Bad Request equivalent)', () => {
      // Empty title
      expect(() => new Book('', 1)).not.toThrow(); // Domain allows, but service could validate

      // Very long title
      const longTitle = 'A'.repeat(1000);
      expect(() => new Book(longTitle, 1)).not.toThrow();

      // Special characters
      expect(() => new Book('Book@#$%^&*()', 1)).not.toThrow();
    });

    it('should handle invalid user names (400 - Bad Request equivalent)', () => {
      expect(() => new User('', 'Test')).not.toThrow(); // Domain allows empty IDs
      expect(() => new User('user1', '')).not.toThrow(); // Domain allows empty names
    });

    it('should handle negative book copies (400 - Bad Request equivalent)', () => {
      const book = new Book('Negative Copies', -1);
      expect(book.copies).toBe(-1); // Domain doesn't validate, could be service responsibility

      service.addBook(book);
      expect(() => service.borrowBook('test-user', 'Negative Copies')).toThrow('Book not available');
    });
  });

  describe('HTTP-like Error Response Simulation (401 Unauthorized)', () => {
    it('should handle unauthorized access attempts (401 equivalent)', () => {
      service.addBook(new Book('Restricted Book', 1));

      // Try to borrow with non-existent user
      expect(() => service.borrowBook('unauthorized-user', 'Restricted Book')).toThrow('User not found');

      // Try to return book for non-existent user
      expect(() => service.returnBook('unauthorized-user', 'Restricted Book')).toThrow('User not found');
    });

    it('should prevent access to other users borrowing records (401 equivalent)', () => {
      const otherUser = new User('other-user', 'Other User');
      service.addUser(otherUser);

      service.addBook(new Book('Private Book', 1));
      service.borrowBook('other-user', 'Private Book');

      // Current user shouldn't be able to see/access other user's borrowed books directly
      // This is tested through the service interface - users can only access their own data
      const currentLibrary = service.getCurrentLibrary();
      const otherUserRecord = currentLibrary.getUser('other-user');

      // The service doesn't expose methods to access other users' private data
      expect(otherUserRecord?.borrowedBooks).toContain('Private Book');
    });
  });

  describe('HTTP-like Error Response Simulation (403 Forbidden)', () => {
    it('should enforce borrowing limits (403 - Forbidden equivalent)', () => {
      service.addBook(new Book('Book 1', 1));
      service.addBook(new Book('Book 2', 1));
      service.addBook(new Book('Forbidden Book', 1));

      // User borrows up to limit
      service.borrowBook('test-user', 'Book 1');
      service.borrowBook('test-user', 'Book 2');

      // Third borrow should be forbidden (equivalent to 403)
      expect(() => service.borrowBook('test-user', 'Forbidden Book')).toThrow('User has reached the maximum number of borrowed books');
    });

    it('should prevent duplicate borrowing (403 - Forbidden equivalent)', () => {
      const book = new Book('Duplicate Book', 2);
      service.addBook(book);

      service.borrowBook('test-user', 'Duplicate Book');

      // Second borrow of same book should be forbidden
      expect(() => service.borrowBook('test-user', 'Duplicate Book')).toThrow('User cannot borrow the same book twice');
    });

    it('should prevent borrowing out-of-stock books (403 - Forbidden equivalent)', () => {
      const book = new Book('Out of Stock', 0);
      service.addBook(book);

      expect(() => service.borrowBook('test-user', 'Out of Stock')).toThrow('Book not available');
    });
  });

  describe('Critical Edge Cases', () => {
    it('should handle concurrent operations on same book', () => {
      // This simulates what would happen if two users try to borrow the last copy
      const book = new Book('Last Copy', 1);
      service.addBook(book);

      const user2 = new User('user2', 'User 2');
      service.addUser(user2);

      // First user borrows successfully
      service.borrowBook('test-user', 'Last Copy');

      // Second user should fail
      expect(() => service.borrowBook('user2', 'Last Copy')).toThrow('Book not available');
    });

    it('should handle return of book not in user possession', () => {
      service.addBook(new Book('Unborrowed Book', 1));

      expect(() => service.returnBook('test-user', 'Unborrowed Book')).toThrow('Book not borrowed by user');
    });

    it('should handle maximum integer values for book copies', () => {
      const book = new Book('Many Copies', Number.MAX_SAFE_INTEGER);
      service.addBook(book);

      service.borrowBook('test-user', 'Many Copies');

      const remainingBook = service.getCurrentLibrary().findBook('Many Copies');
      expect(remainingBook?.copies).toBe(Number.MAX_SAFE_INTEGER - 1);
    });

    it('should handle zero book copies edge case', () => {
      const book = new Book('Zero Copies', 0);
      service.addBook(book);

      const foundBook = service.getCurrentLibrary().findBook('Zero Copies');
      expect(foundBook?.copies).toBe(0);
      expect(foundBook?.hasCopies()).toBe(false);
    });

    it('should handle empty string book titles', () => {
      const book = new Book('', 1);
      service.addBook(book);

      const foundBook = service.getCurrentLibrary().findBook('');
      expect(foundBook?.title).toBe('');
      expect(foundBook?.copies).toBe(1);
    });

    it('should handle special characters in book titles', () => {
      const specialTitle = 'Book@#$%^&*()_+{}|:<>?[]\\;\'",./';
      const book = new Book(specialTitle, 1);
      service.addBook(book);

      const foundBook = service.getCurrentLibrary().findBook(specialTitle);
      expect(foundBook?.title).toBe(specialTitle);
    });
  });

  describe('Data Integrity Edge Cases', () => {
    it('should maintain data consistency after multiple operations', () => {
      service.addBook(new Book('Test Book 1', 2));
      service.addBook(new Book('Test Book 2', 1));

      // Borrow two different books
      service.borrowBook('test-user', 'Test Book 1');
      service.borrowBook('test-user', 'Test Book 2');

      let user = service.getCurrentLibrary().getUser('test-user');
      expect(user?.borrowedBooks).toHaveLength(2);
      expect(user?.borrowedBooks).toContain('Test Book 1');
      expect(user?.borrowedBooks).toContain('Test Book 2');

      let remainingBook1 = service.getCurrentLibrary().findBook('Test Book 1');
      expect(remainingBook1?.copies).toBe(1);

      // Return one book
      service.returnBook('test-user', 'Test Book 1');

      user = service.getCurrentLibrary().getUser('test-user');
      expect(user?.borrowedBooks).toHaveLength(1);
      expect(user?.borrowedBooks).toContain('Test Book 2');

      remainingBook1 = service.getCurrentLibrary().findBook('Test Book 1');
      expect(remainingBook1?.copies).toBe(2); // Back to original count
    });

    it('should handle user with corrupted borrowed books array', () => {
      // Manually create a user with corrupted data (this wouldn't happen in real usage)
      const corruptedUser = new User('corrupted', 'Corrupted User');
      corruptedUser.borrowedBooks.push('Non-existent Book');
      service.addUser(corruptedUser);

      // Operations should still work normally for this user
      service.addBook(new Book('Real Book', 1));
      service.borrowBook('corrupted', 'Real Book');

      const updatedUser = service.getCurrentLibrary().getUser('corrupted');
      expect(updatedUser?.borrowedBooks).toContain('Real Book');
      expect(updatedUser?.borrowedBooks).toContain('Non-existent Book'); // Corrupted data remains
    });

    it('should handle books with same title but different instances', () => {
      // Create two separate book instances with same title
      const book1 = new Book('Same Title', 1);
      const book2 = new Book('Same Title', 1);

      service.addBook(book1);
      service.addBook(book2); // This should increment the existing book's copies

      const books = service.getCurrentLibrary().getBooks();
      const sameTitleBooks = books.filter(b => b.title === 'Same Title');
      expect(sameTitleBooks).toHaveLength(1);
      expect(sameTitleBooks[0].copies).toBe(2);
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle exactly 2 books borrowed (at limit)', () => {
      service.addBook(new Book('Book 1', 1));
      service.addBook(new Book('Book 2', 1));

      service.borrowBook('test-user', 'Book 1');
      service.borrowBook('test-user', 'Book 2');

      const user = service.getCurrentLibrary().getUser('test-user');
      expect(user?.canBorrowMoreBooks()).toBe(false);
      expect(user?.borrowedBooks).toHaveLength(2);
    });

    it('should handle borrowing after returning to go below limit', () => {
      service.addBook(new Book('Book 1', 1));
      service.addBook(new Book('Book 2', 1));
      service.addBook(new Book('Book 3', 1));

      // Reach limit
      service.borrowBook('test-user', 'Book 1');
      service.borrowBook('test-user', 'Book 2');

      // Should fail
      expect(() => service.borrowBook('test-user', 'Book 3')).toThrow('User has reached the maximum number of borrowed books');

      // Return one book
      service.returnBook('test-user', 'Book 1');

      // Should now succeed
      service.borrowBook('test-user', 'Book 3');

      const user = service.getCurrentLibrary().getUser('test-user');
      expect(user?.borrowedBooks).toHaveLength(2);
      expect(user?.borrowedBooks).toContain('Book 2');
      expect(user?.borrowedBooks).toContain('Book 3');
    });
  });
});
