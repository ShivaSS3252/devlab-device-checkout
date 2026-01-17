"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Book = void 0;
class Book {
    constructor(title, copies = 1) {
        this.title = title;
        this.copies = copies;
    }
    hasCopies() {
        return this.copies > 0;
    }
    decrementCopies() {
        if (!this.hasCopies()) {
            throw new Error('No copies available');
        }
        return new Book(this.title, this.copies - 1);
    }
    incrementCopies() {
        return new Book(this.title, this.copies + 1);
    }
}
exports.Book = Book;
//# sourceMappingURL=Book.js.map