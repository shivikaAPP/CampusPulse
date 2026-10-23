import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export function Footer() {
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || 'contact@campusplus.in';

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.topRow}>
          <p className={styles.tagline}>Discover More. Miss Nothing. Build Your Future.</p>
          <div className={styles.links}>
            <Link to="/submit" className={styles.footerLink}>
              Submit opportunity
            </Link>
            <Link to="/terms" className={styles.footerLink}>
              Terms
            </Link>
            <Link to="/privacy" className={styles.footerLink}>
              Privacy
            </Link>
            <a href={`mailto:${contactEmail}`} className={styles.footerLink}>
              Contact
            </a>
          </div>
        </div>
        <p className={styles.notice}>
          Listings come from third party sources. Check the official page before you apply.
        </p>
      </div>
    </footer>
  );
}
