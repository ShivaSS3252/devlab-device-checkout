"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Library = void 0;
class Library {
    constructor(books = [], users = []) {
        this.books = books;
        this.users = users;
    }
    addBook(book) {
        const existingBookIndex = this.books.findIndex(b => b.title === book.title);
        if (existingBookIndex !== -1) {
            const existingBook = this.books[existingBookIndex];
            const updatedBook = existingBook.incrementCopies();
            const updatedBooks = [...this.books];
            updatedBooks[existingBookIndex] = updatedBook;
            return new Library(updatedBooks, this.users);
        }
        return new Library([...this.books, book], this.users);
    }
    removeBook(bookTitle) {
        const bookIndex = this.books.findIndex(b => b.title === bookTitle);
        if (bookIndex === -1) {
            return this;
        }
        const book = this.books[bookIndex];
        if (book.copies > 1) {
            const updatedBook = book.decrementCopies();
            const updatedBooks = [...this.books];
            updatedBooks[bookIndex] = updatedBook;
            return new Library(updatedBooks, this.users);
        }
        const updatedBooks = this.books.filter(b => b.title !== bookTitle);
        return new Library(updatedBooks, this.users);
    }
    addUser(user) {
        return new Library(this.books, [...this.users, user]);
    }
    updateUser(user) {
        const userIndex = this.users.findIndex(u => u.id === user.id);
        if (userIndex === -1) {
            throw new Error('User not found');
        }
        const updatedUsers = [...this.users];
        updatedUsers[userIndex] = user;
        return new Library(this.books, updatedUsers);
    }
    getBooks() {
        return this.books;
    }
    getUser(userId) {
        return this.users.find(u => u.id === userId);
    }
    findBook(bookTitle) {
        return this.books.find(b => b.title === bookTitle);
    }
}
exports.Library = Library;
//# sourceMappingURL=Library.js.map