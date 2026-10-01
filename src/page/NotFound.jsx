import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main style={{ padding: 24 }}>
      <h1>404: Page not found</h1>
      <Link to="/">Back to home</Link>
    </main>
  );
}