import { createSlice, nanoid, current } from '@reduxjs/toolkit';

const initialState = {
  present: { byId: {}, order: [] }, // shapes right now
  past: [],                         // history for undo
  future: [],                       // history for redo
  selectedId: null,
};

// Save the current shapes into history before any change
const snapshot = (state) => {
  state.past.push(current(state.present));
  state.future = []; // a new change clears the redo history
};

const boardSlice = createSlice({
  name: 'board',
  initialState,
  reducers: {
    addShape: {
      reducer(state, { payload }) {
        snapshot(state);
        state.present.byId[payload.id] = payload;
        state.present.order.push(payload.id);
        state.selectedId = payload.id;
      },
      // prepare() runs first and adds a unique id to the shape
      prepare: (shape) => ({ payload: { id: nanoid(), ...shape } }),
    },
    updateShape(state, { payload: { id, changes } }) {
      if (!state.present.byId[id]) return;
      snapshot(state);
      Object.assign(state.present.byId[id], changes);
    },
    deleteSelected(state) {
      const id = state.selectedId;
      if (!id) return;
      snapshot(state);
      delete state.present.byId[id];
      state.present.order = state.present.order.filter((x) => x !== id);
      state.selectedId = null;
    },
    select(state, { payload }) {
      state.selectedId = payload;
    },
    undo(state) {
      if (!state.past.length) return;
      state.future.push(current(state.present));
      state.present = state.past.pop();
      state.selectedId = null;
    },
    redo(state) {
      if (!state.future.length) return;
      state.past.push(current(state.present));
      state.present = state.future.pop();
      state.selectedId = null;
    },
  },
});

export const { addShape, updateShape, deleteSelected, select, undo, redo } = boardSlice.actions;
export default boardSlice.reducer;