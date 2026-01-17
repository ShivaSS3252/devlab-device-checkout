import { Library } from '../src/domain/Library';
import { Book } from '../src/domain/Book';
import { User } from '../src/domain/User';
import { LibraryService } from '../src/services/LibraryService';
import { BorrowLimitError } from '../src/errors/BorrowLimitError';
import { DuplicateBorrowError } from '../src/errors/DuplicateBorrowError';

describe('Borrowing Books', () => {
  let library: Library;
  let service: LibraryService;
  let user: User;

  beforeEach(() => {
    user = new User('user1', 'John Doe');
    library = new Library();
    service = new LibraryService(library);
    service.addUser(user);
  });

  it('should allow borrowing a book when user has capacity', () => {
    const book = new Book('Book 1', 1);
    service.addBook(book);

    const updatedLibrary = service.borrowBook('user1', 'Book 1');

    const updatedUser = updatedLibrary.getUser('user1');
    expect(updatedUser?.borrowedBooks).toContain('Book 1');
    expect(updatedLibrary.getBooks().find(b => b.title === 'Book 1')).toBeUndefined();
  });

  it('should decrement book copies when multiple copies exist', () => {
    const book = new Book('Book 1', 2);
    service.addBook(book);

    service.borrowBook('user1', 'Book 1');

    const remainingBook = service.getCurrentLibrary().findBook('Book 1');
    expect(remainingBook?.copies).toBe(1);
  });

  it('should remove book from library when only one copy exists', () => {
    const book = new Book('Book 1', 1);
    service.addBook(book);

    service.borrowBook('user1', 'Book 1');

    const remainingBook = service.getCurrentLibrary().findBook('Book 1');
    expect(remainingBook).toBeUndefined();
  });

  it('should throw BorrowLimitError when user tries to borrow beyond limit', () => {
    service.addBook(new Book('Book 1', 1));
    service.addBook(new Book('Book 2', 1));
    service.addBook(new Book('Book 3', 1));

    service.borrowBook('user1', 'Book 1');
    service.borrowBook('user1', 'Book 2');

    expect(() => service.borrowBook('user1', 'Book 3')).toThrow('User has reached the maximum number of borrowed books');
  });

  it('should throw DuplicateBorrowError when user tries to borrow same book twice', () => {
    const book = new Book('Book 1', 2);
    service.addBook(book);

    service.borrowBook('user1', 'Book 1');

    expect(() => service.borrowBook('user1', 'Book 1')).toThrow('User cannot borrow the same book twice');
  });

  it('should throw error when user not found', () => {
    service.addBook(new Book('Book 1', 1));

    expect(() => service.borrowBook('nonexistent', 'Book 1')).toThrow('User not found');
  });

  it('should throw error when book not available', () => {
    expect(() => service.borrowBook('user1', 'Nonexistent Book')).toThrow('Book not available');
  });

  it('should throw error when trying to borrow book with no copies', () => {
    const book = new Book('Book 1', 0);
    service.addBook(book);

    expect(() => service.borrowBook('user1', 'Book 1')).toThrow('Book not available');
  });
});
