import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import devLabReducer from './deviceSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    devlab: devLabReducer,
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
