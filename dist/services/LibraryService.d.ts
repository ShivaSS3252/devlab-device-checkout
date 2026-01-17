import { Library } from '../domain/Library';
import { User } from '../domain/User';
import { Book } from '../domain/Book';
export declare class LibraryService {
    private library;
    constructor(library: Library);
    viewBooks(): readonly Book[];
    borrowBook(userId: string, bookTitle: string): Library;
    returnBook(userId: string, bookTitle: string): Library;
    addBook(book: Book): Library;
    addUser(user: User): Library;
    getCurrentLibrary(): Library;
}
//# sourceMappingURL=LibraryService.d.ts.map