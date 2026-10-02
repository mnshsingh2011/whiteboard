import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { undo, redo, deleteSelected } from '../features/board/boardSlice';
import { setTool } from '../features/ui/uiSlice';

const TOOL_KEYS = { v: 'select', h: 'hand', r: 'rect', o: 'ellipse' };

export function useHotkeys() {
  const dispatch = useDispatch();

  useEffect(() => {
    const onKey = (e) => {
      // Don't hijack keys while the user is typing in a field
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();

      if (mod && k === 'z') {
        e.preventDefault();
        dispatch(e.shiftKey ? redo() : undo());
      } else if (mod && k === 'y') {
        e.preventDefault();
        dispatch(redo());
      } else if (k === 'delete' || k === 'backspace') {
        dispatch(deleteSelected());
      } else if (!mod && TOOL_KEYS[k]) {
        dispatch(setTool(TOOL_KEYS[k]));
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey); // cleanup on unmount
  }, [dispatch]);
}