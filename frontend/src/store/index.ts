import { configureStore } from '@reduxjs/toolkit';
import dropsReducer from './slices/dropsSlice';

export const store = configureStore({
  reducer: {
    drops: dropsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
