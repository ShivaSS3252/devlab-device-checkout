export declare class User {
    readonly id: string;
    readonly name: string;
    readonly borrowedBooks: readonly string[];
    constructor(id: string, name: string, borrowedBooks?: readonly string[]);
    canBorrowMoreBooks(): boolean;
    hasBorrowedBook(bookTitle: string): boolean;
    borrowBook(bookTitle: string): User;
    returnBook(bookTitle: string): User;
}
//# sourceMappingURL=User.d.ts.map