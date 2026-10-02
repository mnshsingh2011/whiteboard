import { createSelector } from '@reduxjs/toolkit';

const selectPresent = (state) => state.board.present;
const selectSelectedId = (state) => state.board.selectedId;

export const selectShapes = createSelector([selectPresent], ({ byId, order }) =>
  order.map((id) => byId[id])
);

// Direct lookup by id (fast), returns the same object until that shape changes
export const selectSelectedShape = createSelector(
  [selectPresent, selectSelectedId],
  ({ byId }, id) => (id ? byId[id] ?? null : null)
);