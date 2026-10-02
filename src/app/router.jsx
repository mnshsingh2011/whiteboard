import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Home from '../page/Home';
import NotFound from '../page/NotFound';

const BoardPage = lazy(() => import('../page/BoardPage'));

export const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  {
    path: '/board/:boardId',
    element: (
      <Suspense fallback={<p style={{ padding: 24 }}>Loading board…</p>}>
        <BoardPage />
      </Suspense>
    ),
  },
  { path: '*', element: <NotFound /> },
]);