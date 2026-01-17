import { Library } from '../src/domain/Library';
import { Book } from '../src/domain/Book';
import { User } from '../src/domain/User';
import { LibraryService } from '../src/services/LibraryService';

describe('Admin Functionality', () => {
  let library: Library;
  let service: LibraryService;
  let adminUser: User;
  let regularUser: User;

  beforeEach(() => {
    adminUser = new User('admin1', 'Admin User');
    regularUser = new User('user1', 'Regular User');
    library = new Library();
    service = new LibraryService(library);
    service.addUser(adminUser);
    service.addUser(regularUser);
  });

  describe('Admin Borrowing Books as User', () => {
    it('should allow admin to borrow books like a regular user', () => {
      const book = new Book('Admin Book', 1);
      service.addBook(book);

      const updatedLibrary = service.borrowBook('admin1', 'Admin Book');

      const updatedAdmin = updatedLibrary.getUser('admin1');
      expect(updatedAdmin?.borrowedBooks).toContain('Admin Book');
      expect(updatedLibrary.getBooks().find(b => b.title === 'Admin Book')).toBeUndefined();
    });

    it('should enforce same borrowing limits for admin users', () => {
      service.addBook(new Book('Book 1', 1));
      service.addBook(new Book('Book 2', 1));
      service.addBook(new Book('Book 3', 1));

      // Admin borrows 2 books (at limit)
      service.borrowBook('admin1', 'Book 1');
      service.borrowBook('admin1', 'Book 2');

      // Third book should fail with BorrowLimitError
      expect(() => service.borrowBook('admin1', 'Book 3')).toThrow('User has reached the maximum number of borrowed books');
    });

    it('should prevent admin from borrowing same book twice', () => {
      const book = new Book('Duplicate Book', 2);
      service.addBook(book);

      service.borrowBook('admin1', 'Duplicate Book');

      expect(() => service.borrowBook('admin1', 'Duplicate Book')).toThrow('User cannot borrow the same book twice');
    });
  });

  describe('Admin Viewing User Borrowing Data', () => {
    it('should allow admin to view all users and their borrowed books', () => {
      // Set up users with borrowed books
      service.addBook(new Book('Book 1', 1));
      service.addBook(new Book('Book 2', 1));
      service.addBook(new Book('Book 3', 1));

      service.borrowBook('user1', 'Book 1');
      service.borrowBook('admin1', 'Book 2');

      const currentLibrary = service.getCurrentLibrary();
      const allUsers = currentLibrary.getUsers();

      expect(allUsers).toHaveLength(2);

      const regularUser = allUsers.find(u => u.id === 'user1');
      const admin = allUsers.find(u => u.id === 'admin1');

      expect(regularUser?.borrowedBooks).toContain('Book 1');
      expect(admin?.borrowedBooks).toContain('Book 2');
    });

    it('should show empty borrowed books list for users who havent borrowed', () => {
      const currentLibrary = service.getCurrentLibrary();
      const allUsers = currentLibrary.getUsers();

      allUsers.forEach(user => {
        expect(user.borrowedBooks).toEqual([]);
      });
    });

    it('should track multiple books borrowed by single user', () => {
      service.addBook(new Book('Book 1', 1));
      service.addBook(new Book('Book 2', 1));

      service.borrowBook('user1', 'Book 1');
      service.borrowBook('user1', 'Book 2');

      const currentLibrary = service.getCurrentLibrary();
      const user = currentLibrary.getUser('user1');

      expect(user?.borrowedBooks).toHaveLength(2);
      expect(user?.borrowedBooks).toContain('Book 1');
      expect(user?.borrowedBooks).toContain('Book 2');
    });
  });

  describe('Stock Manipulation Prevention', () => {
    it('should prevent borrowing books with zero copies', () => {
      const book = new Book('Out of Stock', 0);
      service.addBook(book);

      expect(() => service.borrowBook('user1', 'Out of Stock')).toThrow('Book not available');
    });

    it('should prevent borrowing non-existent books', () => {
      expect(() => service.borrowBook('user1', 'Non-existent Book')).toThrow('Book not available');
    });

    it('should handle borrowing last copy correctly', () => {
      const book = new Book('Last Copy', 1);
      service.addBook(book);

      service.borrowBook('user1', 'Last Copy');

      // Book should be completely removed from inventory
      const currentLibrary = service.getCurrentLibrary();
      expect(currentLibrary.findBook('Last Copy')).toBeUndefined();

      // But user should have it borrowed
      const user = currentLibrary.getUser('user1');
      expect(user?.borrowedBooks).toContain('Last Copy');
    });

    it('should maintain correct inventory count with multiple copies', () => {
      const book = new Book('Multiple Copies', 3);
      service.addBook(book);

      service.borrowBook('user1', 'Multiple Copies');

      const currentLibrary = service.getCurrentLibrary();
      const remainingBook = currentLibrary.findBook('Multiple Copies');
      expect(remainingBook?.copies).toBe(2);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle borrowing when user is at exact limit', () => {
      service.addBook(new Book('Book 1', 1));
      service.addBook(new Book('Book 2', 1));

      // Borrow exactly at limit (2 books)
      service.borrowBook('user1', 'Book 1');
      service.borrowBook('user1', 'Book 2');

      const user = service.getCurrentLibrary().getUser('user1');
      expect(user?.borrowedBooks).toHaveLength(2);
      expect(user?.canBorrowMoreBooks()).toBe(false);
    });

    it('should handle return of non-existent borrowed book gracefully', () => {
      service.addBook(new Book('Book 1', 1));

      expect(() => service.returnBook('user1', 'Book 1')).toThrow('Book not borrowed by user');
    });

    it('should handle operations on non-existent users', () => {
      service.addBook(new Book('Book 1', 1));

      expect(() => service.borrowBook('nonexistent-user', 'Book 1')).toThrow('User not found');
      expect(() => service.returnBook('nonexistent-user', 'Book 1')).toThrow('User not found');
    });

    it('should handle empty library operations', () => {
      const emptyLibrary = service.getCurrentLibrary();
      expect(emptyLibrary.getBooks()).toHaveLength(0);
      expect(emptyLibrary.getUsers()).toHaveLength(2); // Admin and regular user added in beforeEach
    });

    it('should handle multiple users borrowing same book title', () => {
      // Add multiple copies
      service.addBook(new Book('Popular Book', 2));

      // Two different users borrow the same title
      service.borrowBook('user1', 'Popular Book');

      const anotherUser = new User('user2', 'Another User');
      service.addUser(anotherUser);
      service.borrowBook('user2', 'Popular Book');

      const currentLibrary = service.getCurrentLibrary();
      const user1 = currentLibrary.getUser('user1');
      const user2 = currentLibrary.getUser('user2');

      expect(user1?.borrowedBooks).toContain('Popular Book');
      expect(user2?.borrowedBooks).toContain('Popular Book');

      // Book should be completely borrowed out
      expect(currentLibrary.findBook('Popular Book')).toBeUndefined();
    });
  });

  describe('Admin vs Regular User Behavior Consistency', () => {
    it('should apply same rules to admin and regular users', () => {
      service.addBook(new Book('Book 1', 1));
      service.addBook(new Book('Book 2', 1));
      service.addBook(new Book('Book 3', 1));
      service.addBook(new Book('Book 4', 1));

      // Admin borrows up to limit (2 books)
      service.borrowBook('admin1', 'Book 1');
      service.borrowBook('admin1', 'Book 2');

      // Admin should be blocked from borrowing more
      expect(() => service.borrowBook('admin1', 'Book 3')).toThrow('User has reached the maximum number of borrowed books');

      // But regular user can still borrow
      service.borrowBook('user1', 'Book 3');
      service.borrowBook('user1', 'Book 4');

      const currentLibrary = service.getCurrentLibrary();
      expect(currentLibrary.getUser('admin1')?.borrowedBooks).toHaveLength(2);
      expect(currentLibrary.getUser('user1')?.borrowedBooks).toHaveLength(2);
    });

    it('should maintain separate borrowing records for admin and users', () => {
      service.addBook(new Book('Shared Book', 2));

      service.borrowBook('admin1', 'Shared Book');

      const admin = service.getCurrentLibrary().getUser('admin1');
      expect(admin?.borrowedBooks).toContain('Shared Book');

      // Admin borrowing shouldn't affect regular user borrowing
      service.borrowBook('user1', 'Shared Book');

      const user = service.getCurrentLibrary().getUser('user1');
      expect(user?.borrowedBooks).toContain('Shared Book');
    });
  });
});
