import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, Search, LogIn } from 'lucide-react';
import { useProfile } from '../state/ProfileContext.js';
import styles from './Header.module.css';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isStorageSupported } = useProfile();

  const navItems = [
    { label: 'Discover', path: '/' },
    { label: 'Explore', path: '/explore' },
    { label: 'Saved', path: '/saved' },
    { label: 'Applications', path: '/applications' },
    { label: 'Profile', path: '/profile' },
  ];

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {!isStorageSupported && (
        <div className={styles.storageWarning}>
          Your data cannot be saved in this browser. Local storage is unavailable.
        </div>
      )}

      <header className={styles.header}>
        <div className={`container ${styles.inner}`}>
          <Link to="/" className={styles.brand} aria-label="CampusPlus home">
            <svg
              className={styles.logoIcon}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 32 32"
              width="32"
              height="32"
              aria-hidden="true"
            >
              <rect width="32" height="32" rx="6" fill="#22D3EE" />
              <path
                d="M18.5 10.6A7 7 0 1 0 18.5 21.4"
                fill="none"
                stroke="#0B1020"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M24.5 13.5v5M22 16h5"
                fill="none"
                stroke="#0B1020"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <span className={styles.brandName}>CampusPlus</span>
          </Link>

          <nav className={styles.nav} aria-label="Primary navigation">
            <ul className={styles.navList}>
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `${styles.navLink} ${isActive ? styles.activeLink : ''}`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Link
              to="/explore"
              className={styles.menuButton}
              aria-label="Search opportunities"
              title="Search opportunities"
            >
              <Search size={18} strokeWidth={1.75} aria-hidden="true" />
            </Link>

            <Link
              to="/login"
              className={styles.menuButton}
              aria-label="Student login"
              title="Student login"
            >
              <LogIn size={18} strokeWidth={1.75} aria-hidden="true" />
            </Link>

            <button
              type="button"
              className={styles.menuButton}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X size={20} strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <Menu size={20} strokeWidth={1.75} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className={styles.mobileMenu} aria-label="Mobile navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `${styles.mobileNavLink} ${isActive ? styles.mobileActiveLink : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}
