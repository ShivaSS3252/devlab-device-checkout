import { Book } from './Book';
import { User } from './User';
export declare class Library {
    readonly books: readonly Book[];
    readonly users: readonly User[];
    constructor(books?: readonly Book[], users?: readonly User[]);
    addBook(book: Book): Library;
    removeBook(bookTitle: string): Library;
    addUser(user: User): Library;
    updateUser(user: User): Library;
    getBooks(): readonly Book[];
    getUser(userId: string): User | undefined;
    findBook(bookTitle: string): Book | undefined;
}
//# sourceMappingURL=Library.d.ts.map