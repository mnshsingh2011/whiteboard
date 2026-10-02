import { createSelector } from '@reduxjs/toolkit';

const selectPresent = (state) => state.board.present;

// Turns { byId, order } into an array of shapes.
// It recomputes only when the shapes change, so components get the same array otherwise.
export const selectShapes = createSelector([selectPresent], ({ byId, order }) =>
  order.map((id) => byId[id])
);