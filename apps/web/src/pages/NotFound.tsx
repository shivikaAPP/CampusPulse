import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';
import { Seo } from '../seo/Seo.js';
import { STATIC_PAGES } from '../seo/pages.js';

export function NotFound() {
  return (
    <div
      className="container prose"
      style={{
        padding: 'var(--space-16) var(--gutter)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-4)',
      }}
    >
      <Seo
        title={STATIC_PAGES.notFound.title}
        description={STATIC_PAGES.notFound.description}
        path={STATIC_PAGES.notFound.path}
        noindex={STATIC_PAGES.notFound.noindex}
      />

      <h1>{STATIC_PAGES.notFound.h1}</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-base)', margin: 0 }}>
        The page you requested does not exist on CampusPlus. Return to the home page or browse all
        available opportunities.
      </p>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          justifyContent: 'center',
          marginTop: 'var(--space-4)',
        }}
      >
        <Link
          to="/"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--on-accent)',
            padding: '0 var(--space-6)',
            height: '40px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            textDecoration: 'none',
          }}
        >
          <Home size={16} strokeWidth={1.75} aria-hidden="true" />
          <span>Go to home page</span>
        </Link>

        <Link
          to="/explore"
          style={{
            backgroundColor: 'transparent',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            padding: '0 var(--space-4)',
            height: '40px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            textDecoration: 'none',
          }}
        >
          <Compass size={16} strokeWidth={1.75} aria-hidden="true" />
          <span>Browse all opportunities</span>
        </Link>
      </div>
    </div>
  );
}
export default NotFound;
