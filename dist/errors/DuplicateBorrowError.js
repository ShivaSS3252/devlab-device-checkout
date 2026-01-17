"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DuplicateBorrowError = void 0;
class DuplicateBorrowError extends Error {
    constructor(message = 'User cannot borrow the same book twice') {
        super(message);
        this.name = 'DuplicateBorrowError';
    }
}
exports.DuplicateBorrowError = DuplicateBorrowError;
//# sourceMappingURL=DuplicateBorrowError.js.map