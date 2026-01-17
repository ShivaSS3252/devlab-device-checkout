"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibraryService = void 0;
const Book_1 = require("../domain/Book");
const BorrowLimitError_1 = require("../errors/BorrowLimitError");
const DuplicateBorrowError_1 = require("../errors/DuplicateBorrowError");
class LibraryService {
    constructor(library) {
        this.library = library;
    }
    viewBooks() {
        return this.library.getBooks();
    }
    borrowBook(userId, bookTitle) {
        const user = this.library.getUser(userId);
        if (!user) {
            throw new Error('User not found');
        }
        const book = this.library.findBook(bookTitle);
        if (!book || !book.hasCopies()) {
            throw new Error('Book not available');
        }
        if (!user.canBorrowMoreBooks()) {
            throw new BorrowLimitError_1.BorrowLimitError();
        }
        if (user.hasBorrowedBook(bookTitle)) {
            throw new DuplicateBorrowError_1.DuplicateBorrowError();
        }
        const updatedUser = user.borrowBook(bookTitle);
        const updatedLibrary = this.library.updateUser(updatedUser);
        const finalLibrary = updatedLibrary.removeBook(bookTitle);
        this.library = finalLibrary;
        return finalLibrary;
    }
    returnBook(userId, bookTitle) {
        const user = this.library.getUser(userId);
        if (!user) {
            throw new Error('User not found');
        }
        if (!user.hasBorrowedBook(bookTitle)) {
            throw new Error('Book not borrowed by user');
        }
        const updatedUser = user.returnBook(bookTitle);
        const updatedLibrary = this.library.updateUser(updatedUser);
        const bookToReturn = new Book_1.Book(bookTitle, 1);
        const finalLibrary = updatedLibrary.addBook(bookToReturn);
        this.library = finalLibrary;
        return finalLibrary;
    }
    addBook(book) {
        const updatedLibrary = this.library.addBook(book);
        this.library = updatedLibrary;
        return updatedLibrary;
    }
    addUser(user) {
        const updatedLibrary = this.library.addUser(user);
        this.library = updatedLibrary;
        return updatedLibrary;
    }
    getCurrentLibrary() {
        return this.library;
    }
}
exports.LibraryService = LibraryService;
//# sourceMappingURL=LibraryService.js.map