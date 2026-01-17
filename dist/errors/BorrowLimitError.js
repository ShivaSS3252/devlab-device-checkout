"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BorrowLimitError = void 0;
class BorrowLimitError extends Error {
    constructor(message = 'User has reached the maximum number of borrowed books') {
        super(message);
        this.name = 'BorrowLimitError';
    }
}
exports.BorrowLimitError = BorrowLimitError;
//# sourceMappingURL=BorrowLimitError.js.map