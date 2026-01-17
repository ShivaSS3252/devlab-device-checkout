import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import libraryReducer from './librarySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    library: libraryReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
