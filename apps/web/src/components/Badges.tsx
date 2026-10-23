import { Check, Users, CircleHelp, Clock, FlaskConical, AlarmClock } from 'lucide-react';
import styles from './Badges.module.css';

export function FeeBadge({ fee }: { fee: number }) {
  if (fee === 0) {
    return <span className={`${styles.badge} ${styles.free}`}>Free</span>;
  }
  return <span className={`${styles.badge} ${styles.paid}`}>₹{fee}</span>;
}

export function VerificationBadge({ status }: { status: 'verified' | 'community' | 'unverified' | 'expired' }) {
  if (status === 'verified') {
    return (
      <span className={`${styles.badge} ${styles.verified}`}>
        <Check size={12} strokeWidth={1.75} aria-hidden="true" />
        Verified
      </span>
    );
  }

  if (status === 'community') {
    return (
      <span className={`${styles.badge} ${styles.community}`}>
        <Users size={12} strokeWidth={1.75} aria-hidden="true" />
        Community reported
      </span>
    );
  }

  if (status === 'expired') {
    return (
      <span className={`${styles.badge} ${styles.expired}`}>
        <Clock size={12} strokeWidth={1.75} aria-hidden="true" />
        Expired
      </span>
    );
  }

  return (
    <span className={`${styles.badge} ${styles.unverified}`}>
      <CircleHelp size={12} strokeWidth={1.75} aria-hidden="true" />
      Unverified
    </span>
  );
}

export function DemoBadge() {
  return (
    <span className={`${styles.badge} ${styles.demo}`}>
      <FlaskConical size={12} strokeWidth={1.75} aria-hidden="true" />
      Demo data
    </span>
  );
}

export function ClosingSoonBadge() {
  return (
    <span className={`${styles.badge} ${styles.closingSoon}`}>
      <AlarmClock size={12} strokeWidth={1.75} aria-hidden="true" />
      Closing soon
    </span>
  );
}
