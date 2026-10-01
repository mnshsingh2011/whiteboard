import { Link, useParams } from 'react-router-dom';

export default function BoardPage() {
  const { boardId } = useParams();
  return (
    <div style={{ padding: 24 }}>
      <Link to="/">All boards</Link>
      <h2>Board: {boardId}</h2>
    </div>
  );
}