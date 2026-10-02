import { memo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTool, setColor } from '../ui/uiSlice';
import { undo, redo, deleteSelected } from './boardSlice';

const TOOLS = [
  ['select', '↖ Select'],
  ['rect', '▭ Rectangle'],
  ['ellipse', '◯ Ellipse'],
];
const COLORS = ['#1c2330', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b'];

// memo + a stable onSelect means a button re-renders only when its own props change
const ToolButton = memo(function ToolButton({ id, label, active, onSelect }) {
  return (
    <button
      onClick={() => onSelect(id)}
      style={{
        padding: '6px 10px',
        border: '1px solid #ddd',
        borderRadius: 8,
        background: active ? '#4f46e5' : '#fff',
        color: active ? '#fff' : 'inherit',
      }}
    >
      {label}
    </button>
  );
});

const ColorSwatch = memo(function ColorSwatch({ value, active, onPick }) {
  return (
    <button
      aria-label={`Color ${value}`}
      onClick={() => onPick(value)}
      style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: value,
        padding: 0,
        border: active ? '3px solid #4f46e5' : '2px solid #fff',
        boxShadow: '0 0 0 1px #ddd',
      }}
    />
  );
});

const Divider = () => <span style={{ width: 1, height: 22, background: '#ddd' }} />;

const Toolbar = memo(function Toolbar() {
  const dispatch = useDispatch();
  const tool = useSelector((s) => s.ui.tool);
  const color = useSelector((s) => s.ui.color);
  const canUndo = useSelector((s) => s.board.past.length > 0);
  const canRedo = useSelector((s) => s.board.future.length > 0);

  // Stable function identities, so the memoized children don't re-render
  const onTool = useCallback((id) => dispatch(setTool(id)), [dispatch]);
  const onColor = useCallback((c) => dispatch(setColor(c)), [dispatch]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 1,
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        flexWrap: 'wrap',
        background: '#fff',
        padding: 6,
        borderRadius: 12,
        boxShadow: '0 2px 12px rgba(0,0,0,.12)',
      }}
    >
      {TOOLS.map(([id, label]) => (
        <ToolButton key={id} id={id} label={label} active={tool === id} onSelect={onTool} />
      ))}
      <Divider />
      {COLORS.map((c) => (
        <ColorSwatch key={c} value={c} active={color === c} onPick={onColor} />
      ))}
      <Divider />
      <button disabled={!canUndo} onClick={() => dispatch(undo())}>↶ Undo</button>
      <button disabled={!canRedo} onClick={() => dispatch(redo())}>↷ Redo</button>
      <button onClick={() => dispatch(deleteSelected())}>🗑 Delete</button>
    </div>
  );
});

export default Toolbar;
