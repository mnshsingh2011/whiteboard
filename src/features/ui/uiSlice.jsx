import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: { tool: 'select', color: '#1c2330' },
  reducers: {
    setTool: (state, { payload }) => { state.tool = payload; },
    setColor: (state, { payload }) => { state.color = payload; },
  },
});

export const { setTool, setColor } = uiSlice.actions;
export default uiSlice.reducer;