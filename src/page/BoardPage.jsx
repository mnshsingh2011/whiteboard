import { Link, useParams } from 'react-router-dom';
import Canvas from '../features/board/Canvas';
import Toolbar from '../features/board/Toolbar';
import { useHotkeys } from '../hooks/useHotkeys';

export default function BoardPage() {
  const { boardId } = useParams();
  useHotkeys();

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Toolbar />
      <Link to="/" style={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}>
        All boards
      </Link>
      <Canvas key={boardId} />
    </div>
  );
}