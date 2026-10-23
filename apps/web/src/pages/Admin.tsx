import { useState } from 'react';
import { Shield } from 'lucide-react';
import { Seo } from '../seo/Seo.js';
import { STATIC_PAGES } from '../seo/pages.js';
import styles from './Admin.module.css';

export function Admin() {
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('Admin moderation API is accessible when backend server is running in API mode.');
  };

  return (
    <div className={`container ${styles.adminPage}`}>
      <Seo
        title={STATIC_PAGES.admin.title}
        description={STATIC_PAGES.admin.description}
        path={STATIC_PAGES.admin.path}
        noindex={STATIC_PAGES.admin.noindex}
      />

      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Shield size={24} strokeWidth={1.75} style={{ color: 'var(--accent)' }} aria-hidden="true" />
          <h1 className={styles.title}>{STATIC_PAGES.admin.h1}</h1>
        </div>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          Moderation console for CampusPlus listing verification, reports review, and submissions.
        </p>
      </header>

      <div className={styles.card}>
        <p className={styles.notice}>
          Access to moderation tools requires an administrator session cookie authenticated against the backend API.
        </p>

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="admin-password" className={styles.label}>
              Moderator Passcode
            </label>
            <input
              id="admin-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className={styles.input}
            />
          </div>

          <button type="submit" className={styles.loginBtn}>
            Log in to console
          </button>
        </form>

        {msg && (
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--warning)', margin: 0 }}>
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}
export default Admin;
