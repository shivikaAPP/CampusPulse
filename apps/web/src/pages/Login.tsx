import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, Eye, EyeOff, CheckCircle2, User, LogOut } from 'lucide-react';
import { Seo } from '../seo/Seo.js';
import { STATIC_PAGES } from '../seo/pages.js';
import styles from './Login.module.css';

const SESSION_STORAGE_KEY = 'cp.v1.student_session';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeUser, setActiveUser] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.email) {
          setActiveUser(parsed.email);
        }
      }
    } catch {
      // storage unavailable
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    try {
      if (rememberMe) {
        localStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({
            email: trimmedEmail,
            loggedInAt: new Date().toISOString(),
          })
        );
      }
      setActiveUser(trimmedEmail);
      setSuccessMsg('Signed in successfully. Redirecting to your opportunities...');
      setTimeout(() => {
        navigate('/explore');
      }, 1200);
    } catch {
      setActiveUser(trimmedEmail);
      setSuccessMsg('Signed in for this session. Redirecting...');
      setTimeout(() => {
        navigate('/explore');
      }, 1200);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // ignore
    }
    setActiveUser(null);
    setEmail('');
    setPassword('');
    setSuccessMsg('Signed out of student session.');
  };

  return (
    <div className={`container ${styles.loginPage}`}>
      <Seo
        title={STATIC_PAGES.login.title}
        description={STATIC_PAGES.login.description}
        path={STATIC_PAGES.login.path}
        noindex={STATIC_PAGES.login.noindex}
      />

      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconWrapper} aria-hidden="true">
            <LogIn size={24} strokeWidth={2} />
          </div>
          <h1 className={styles.title}>{STATIC_PAGES.login.h1}</h1>
          <p className={styles.subtitle}>
            Access your saved listings, applications, and personalized match scores.
          </p>
        </div>

        {activeUser ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className={styles.statusSuccess}>
              <User size={18} strokeWidth={2} aria-hidden="true" />
              <span>Signed in as <strong>{activeUser}</strong></span>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button
                type="button"
                onClick={() => navigate('/explore')}
                className={styles.submitBtn}
                style={{ flex: 1 }}
              >
                Go to opportunities
              </button>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  backgroundColor: 'var(--surface-raised)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-3)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <LogOut size={16} strokeWidth={1.75} aria-hidden="true" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="student-email" className={styles.label}>
                College or student email
              </label>
              <div className={styles.inputWrapper}>
                <Mail size={18} strokeWidth={1.75} className={styles.inputIcon} aria-hidden="true" />
                <input
                  id="student-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@college.edu"
                  className={styles.input}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="student-password" className={styles.label}>
                Password
              </label>
              <div className={styles.inputWrapper}>
                <Lock size={18} strokeWidth={1.75} className={styles.inputIcon} aria-hidden="true" />
                <input
                  id="student-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className={styles.input}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className={styles.togglePasswordBtn}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={18} strokeWidth={1.75} aria-hidden="true" />
                  ) : (
                    <Eye size={18} strokeWidth={1.75} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div className={styles.checkboxRow}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className={styles.checkboxInput}
                />
                <span>Remember me on this device</span>
              </label>
            </div>

            <button type="submit" className={styles.submitBtn}>
              <LogIn size={18} strokeWidth={2} aria-hidden="true" />
              <span>Log in as student</span>
            </button>
          </form>
        )}

        {successMsg && (
          <div className={styles.statusSuccess} role="status">
            <CheckCircle2 size={18} strokeWidth={2} aria-hidden="true" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className={styles.statusError} role="alert">
            <span>{errorMsg}</span>
          </div>
        )}

        <div className={styles.footerLinks}>
          <div>
            Need to update your local preferences?{' '}
            <Link to="/profile">Edit student profile</Link>
          </div>
          <div>
            Looking for moderator access?{' '}
            <Link to="/admin">Open moderation console</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
