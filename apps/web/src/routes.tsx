import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home.js';

// Lazy loaded routes (all routes except Home)
const Explore = lazy(() => import('./pages/Explore.js'));
const Detail = lazy(() => import('./pages/Detail.js'));
const Saved = lazy(() => import('./pages/Saved.js'));
const Applications = lazy(() => import('./pages/Applications.js'));
const Profile = lazy(() => import('./pages/Profile.js'));
const Submit = lazy(() => import('./pages/Submit.js'));
const Terms = lazy(() => import('./pages/Terms.js'));
const Privacy = lazy(() => import('./pages/Privacy.js'));
const Admin = lazy(() => import('./pages/Admin.js'));
const Loading = lazy(() => import('./pages/Loading.js'));
const Login = lazy(() => import('./pages/Login.js'));
const NotFound = lazy(() => import('./pages/NotFound.js'));

function RouteLoadingFallback() {
  return (
    <div className="container" style={{ padding: 'var(--space-8) var(--gutter)' }}>
      <div
        style={{
          height: '240px',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        Loading...
      </div>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/opportunities/:id" element={<Detail />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/submit" element={<Submit />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/loading" element={<Loading />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
