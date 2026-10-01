import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Home from '../pages/Home';
import NotFound from '../pages/NotFound';

const BoardPage = lazy(() => import('../pages/BoardPage'));

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