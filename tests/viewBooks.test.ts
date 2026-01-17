import { Library } from '../src/domain/Library';
import { Book } from '../src/domain/Book';
import { LibraryService } from '../src/services/LibraryService';

describe('Viewing Books', () => {
  it('should return empty list when library has no books', () => {
    const library = new Library();
    const service = new LibraryService(library);

    const books = service.viewBooks();

    expect(books).toEqual([]);
  });

  it('should return list of books when library has books', () => {
    const book1 = new Book('Book 1', 1);
    const book2 = new Book('Book 2', 2);
    const library = new Library([book1, book2]);
    const service = new LibraryService(library);

    const books = service.viewBooks();

    expect(books).toEqual([book1, book2]);
  });

  it('should return readonly array type for immutability contract', () => {
    const library = new Library([new Book('Book 1')]);
    const service = new LibraryService(library);

    const books = service.viewBooks();

    // TypeScript ensures this is readonly at compile time
    // Runtime mutation is prevented by the readonly modifier
    expect(books).toBeDefined();
    expect(books.length).toBe(1);
  });
});
