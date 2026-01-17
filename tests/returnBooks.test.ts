import { Library } from '../src/domain/Library';
import { Book } from '../src/domain/Book';
import { User } from '../src/domain/User';
import { LibraryService } from '../src/services/LibraryService';

describe('Returning Books', () => {
  let library: Library;
  let service: LibraryService;
  let user: User;

  beforeEach(() => {
    user = new User('user1', 'John Doe');
    library = new Library();
    service = new LibraryService(library);
    service.addUser(user);
  });

  it('should allow returning a borrowed book', () => {
    const book = new Book('Book 1', 1);
    service.addBook(book);
    service.borrowBook('user1', 'Book 1');

    const updatedLibrary = service.returnBook('user1', 'Book 1');

    const updatedUser = updatedLibrary.getUser('user1');
    expect(updatedUser?.borrowedBooks).not.toContain('Book 1');
    expect(updatedLibrary.findBook('Book 1')).toBeDefined();
  });

  it('should increment book copies when returning to existing book', () => {
    const originalBook = new Book('Book 1', 2);
    service.addBook(originalBook);
    service.borrowBook('user1', 'Book 1'); // Now 1 copy left

    service.returnBook('user1', 'Book 1');

    const returnedBook = service.getCurrentLibrary().findBook('Book 1');
    expect(returnedBook?.copies).toBe(2);
  });

  it('should add new book entry when returning book not in library', () => {
    // User borrows a book, then library somehow loses the record
    // Simulate by manually setting user's borrowed books
    const userWithBorrowedBook = new User('user1', 'John Doe', ['Book 1']);
    library = new Library([], [userWithBorrowedBook]);
    service = new LibraryService(library);

    service.returnBook('user1', 'Book 1');

    const returnedBook = service.getCurrentLibrary().findBook('Book 1');
    expect(returnedBook?.copies).toBe(1);
  });

  it('should throw error when user not found', () => {
    expect(() => service.returnBook('nonexistent', 'Book 1')).toThrow('User not found');
  });

  it('should throw error when user tries to return book they did not borrow', () => {
    expect(() => service.returnBook('user1', 'Book 1')).toThrow('Book not borrowed by user');
  });

  it('should handle returning one book while user has multiple borrowed books', () => {
    service.addBook(new Book('Book 1', 1));
    service.addBook(new Book('Book 2', 1));

    service.borrowBook('user1', 'Book 1');
    service.borrowBook('user1', 'Book 2');

    service.returnBook('user1', 'Book 1');

    const updatedUser = service.getCurrentLibrary().getUser('user1');
    expect(updatedUser?.borrowedBooks).toEqual(['Book 2']);
    expect(service.getCurrentLibrary().findBook('Book 1')).toBeDefined();
    expect(service.getCurrentLibrary().findBook('Book 2')).toBeUndefined();
  });
});
