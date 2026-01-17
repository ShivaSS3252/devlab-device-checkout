"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const borrowing_1 = require("../constants/borrowing");
class User {
    constructor(id, name, borrowedBooks = []) {
        this.id = id;
        this.name = name;
        this.borrowedBooks = borrowedBooks;
    }
    canBorrowMoreBooks() {
        return this.borrowedBooks.length < borrowing_1.MAX_BOOKS_PER_USER;
    }
    hasBorrowedBook(bookTitle) {
        return this.borrowedBooks.includes(bookTitle);
    }
    borrowBook(bookTitle) {
        if (!this.canBorrowMoreBooks()) {
            throw new Error('Cannot borrow more books');
        }
        if (this.hasBorrowedBook(bookTitle)) {
            throw new Error('Already borrowed this book');
        }
        return new User(this.id, this.name, [...this.borrowedBooks, bookTitle]);
    }
    returnBook(bookTitle) {
        if (!this.hasBorrowedBook(bookTitle)) {
            throw new Error('Book not borrowed by user');
        }
        return new User(this.id, this.name, this.borrowedBooks.filter(title => title !== bookTitle));
    }
}
exports.User = User;
//# sourceMappingURL=User.js.map