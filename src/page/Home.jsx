import { Link, useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const createBoard = () => navigate(`/board/${crypto.randomUUID().slice(0, 8)}`);

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
      <h1>Whiteboard</h1>
      <p>Your boards will appear here.</p>
      <button onClick={createBoard}>+ New board</button>
      <p>Or open the <Link to="/board/default">default board</Link>.</p>
    </main>
  );
}