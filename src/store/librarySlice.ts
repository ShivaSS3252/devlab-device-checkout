import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Book } from '@/domain/Book';
import { User } from '@/domain/User';
import { Library } from '@/domain/Library';
import { BorrowLimitError } from '@/errors/BorrowLimitError';
import { DuplicateBorrowError } from '@/errors/DuplicateBorrowError';
import { LibraryService } from '@/services/LibraryService';
import { RootState } from './index';

export interface LibraryState {
  books: Book[];
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}



const initialState: LibraryState = {
  books: [],
  users: [],
  currentUser: null,
  isLoading: false,
  error: null,
};



/**
 * Fetch books from Redux state
 * @returns Array of books from current state
 */
export const fetchBooksAsync = createAsyncThunk(
  'library/fetchBooks',
  async (_, { getState }) => {
    const state = getState() as RootState;
    return state.library.books;
  }
);

/**
 * Borrow a book for a user
 * @param params - Object containing userId and bookTitle
 * @param params.userId - ID of the user borrowing the book
 * @param params.bookTitle - Title of the book to borrow
 * @returns Updated library state with borrowed book
 */
export const borrowBookAsync = createAsyncThunk(
  'library/borrowBook',
  async ({ userId, bookTitle }: { userId: string; bookTitle: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const { books, users, currentUser } = state.library;

      // Find the user and book
      const user = currentUser || users.find((u: User) => u.id === userId);
      const book = books.find((b: Book) => b.title === bookTitle);

      if (!user) {
        throw new Error('User not found');
      }
      if (!book || book.copies === 0) {
        throw new Error('Book not available');
      }
      if (user.borrowedBooks.length >= 2) {
        throw new BorrowLimitError();
      }
      if (user.borrowedBooks.includes(bookTitle)) {
        throw new DuplicateBorrowError();
      }

      // Update book copies
      const updatedBooks = books.map((b: Book) =>
        b.title === bookTitle ? b.decrementCopies() : b
      ).filter((b: Book) => b.hasCopies()); // Remove books with 0 copies

      // Update user borrowed books
      const updatedUser = user.borrowBook(bookTitle);
      const updatedUsers = users.map((u: User) =>
        u.id === userId ? updatedUser : u
      );

      return {
        books: updatedBooks,
        users: updatedUsers,
        currentUser: updatedUser
      };
    } catch (error) {
      if (error instanceof BorrowLimitError) {
        return rejectWithValue('Borrow limit exceeded (max 2 books)');
      }
      if (error instanceof DuplicateBorrowError) {
        return rejectWithValue('You cannot borrow the same book twice');
      }
      return rejectWithValue('Failed to borrow book');
    }
  }
);

/**
 * Return a borrowed book
 * @param params - Object containing userId and bookTitle
 * @param params.userId - ID of the user returning the book
 * @param params.bookTitle - Title of the book to return
 * @returns Updated library state after book return
 */
export const returnBookAsync = createAsyncThunk(
  'library/returnBook',
  async ({ userId, bookTitle }: { userId: string; bookTitle: string }, { getState }) => {
    const state = getState() as RootState;
    const library = new LibraryService(new Library(state.library.books, state.library.users));

    const updatedLibrary = library.returnBook(userId, bookTitle);

    return {
      books: [...updatedLibrary.getBooks()],
      users: [...updatedLibrary.getUsers()],
      currentUser: updatedLibrary.getUser(userId) || null
    };
  }
);

/**
 * Add a book to the library inventory
 * @param book - Book to add to inventory
 * @returns Updated books array
 */
export const addBookAsync = createAsyncThunk(
  'library/addBook',
  async (book: Book, { getState }) => {
    const state = getState() as RootState;
    const currentBooks = state.library.books;

    // Check if book already exists
    const existingBook = currentBooks.find((b: Book) => b.title === book.title);
    const updatedBooks = existingBook
      ? currentBooks.map((b: Book) => b.title === book.title ? new Book(b.title, b.copies + book.copies) : b)
      : [...currentBooks, book];

    return updatedBooks;
  }
);

/**
 * Add a user to the library system
 * @param user - User to add to the system
 * @returns Updated users array
 */
export const addUserAsync = createAsyncThunk(
  'library/addUser',
  async (user: User, { getState }) => {
    const state = getState() as RootState;
    const currentUsers = state.library.users;
    return [...currentUsers, user];
  }
);

const librarySlice = createSlice({
  name: 'library',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
    },
    initializeLibrary: (state, action: PayloadAction<{ books: Book[]; users: User[] }>) => {
      state.books = action.payload.books;
      state.users = action.payload.users;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Books
      .addCase(fetchBooksAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBooksAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.books = action.payload;
      })
      .addCase(fetchBooksAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Borrow Book
      .addCase(borrowBookAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(borrowBookAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.books = action.payload.books;
        state.users = action.payload.users;
        state.currentUser = action.payload.currentUser;
      })
      .addCase(borrowBookAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Return Book
      .addCase(returnBookAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(returnBookAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.books = action.payload.books;
        state.users = action.payload.users;
        state.currentUser = action.payload.currentUser;
      })
      .addCase(returnBookAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Add Book
      .addCase(addBookAsync.fulfilled, (state, action) => {
        state.books = action.payload;
      })
      // Add User
      .addCase(addUserAsync.fulfilled, (state, action) => {
        state.users = action.payload;
      });
  },
});

export const { clearError, setCurrentUser, initializeLibrary } = librarySlice.actions;
export default librarySlice.reducer;
