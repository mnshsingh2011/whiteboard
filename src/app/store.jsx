import { configureStore } from '@reduxjs/toolkit';
import board from '../features/board/boardSlice';
import ui from '../features/ui/uiSlice';

export const store = configureStore({
  reducer: { board, ui },
});