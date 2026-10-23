import { Link } from 'react-router-dom';
import {
  Bookmark,
  Terminal,
  Briefcase,
  BookOpen,
  Trophy,
  Users,
  MapPin,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import type { Opportunity, Category } from '@campusplus/shared';
import {
  isExpired,
  formatDaysLeft,
  formatISTDate,
  displayVerification,
  computeMatch,
  isProfileEmpty,
} from '@campusplus/shared';
import { useProfile } from '../state/ProfileContext.js';
import { useSaved } from '../state/saved.js';
import { FeeBadge, VerificationBadge, DemoBadge, ClosingSoonBadge } from './Badges.js';
import { MatchScore } from './MatchScore.js';
import styles from './OpportunityCard.module.css';

interface OpportunityCardProps {
  opportunity: Opportunity;
  now?: Date;
}

function CategoryIcon({ category }: { category: Category }) {
  const size = 14;
  const strokeWidth = 1.75;
  switch (category) {
    case 'hackathon':
      return <Terminal size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
    case 'internship':
      return <Briefcase size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
    case 'workshop':
      return <BookOpen size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
    case 'competition':
      return <Trophy size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
    case 'meetup':
      return <Users size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
  }
}

export function OpportunityCard({ opportunity, now = new Date() }: OpportunityCardProps) {
  const { profile } = useProfile();
  const { isSaved, toggleSave } = useSaved();

  const expired = isExpired(opportunity, now);
  const deadlineText = formatDaysLeft(opportunity, now);
  const formattedDeadlineDate = formatISTDate(opportunity.deadline);
  const verification = displayVerification(opportunity, now);
  const profileEmpty = isProfileEmpty(profile);
  const match = expired ? null : computeMatch(profile, opportunity);
  const saved = isSaved(opportunity.id);

  const modeCityLabel =
    opportunity.mode === 'online'
      ? 'Online'
      : opportunity.mode === 'hybrid'
      ? `Hybrid, ${opportunity.city}`
      : `Offline, ${opportunity.city}`;

  return (
    <article className={`${styles.card} ${expired ? styles.expiredCard : ''}`}>
      <div className={styles.topRow}>
        <div className={styles.categoryGroup}>
          <CategoryIcon category={opportunity.category} />
          <span>{opportunity.category}</span>
        </div>
        <div className={styles.badgesRow}>
          {opportunity.isDemo && <DemoBadge />}
          <FeeBadge fee={opportunity.fee} />
          {deadlineText.startsWith('Closes') && !expired && <ClosingSoonBadge />}
          <VerificationBadge status={verification} />
        </div>
      </div>

      <div>
        <h3 className={styles.title}>
          <Link to={`/opportunities/${opportunity.id}`} className={styles.titleLink}>
            {opportunity.title}
          </Link>
        </h3>
        <p className={styles.organizer}>{opportunity.organizer}</p>
      </div>

      <div className={styles.detailsGrid}>
        <span className={styles.detailItem}>
          <MapPin size={14} strokeWidth={1.75} aria-hidden="true" />
          <span>{modeCityLabel}</span>
        </span>
        <span className={`${styles.detailItem} ${styles.deadlineItem}`}>
          <Calendar size={14} strokeWidth={1.75} aria-hidden="true" />
          <span>
            {deadlineText} ({formattedDeadlineDate})
          </span>
        </span>
      </div>

      {!expired && <MatchScore match={match} profileEmpty={profileEmpty} />}

      <div className={styles.actionsRow}>
        <Link to={`/opportunities/${opportunity.id}`} className={styles.viewLink}>
          <span>View details</span>
          <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
        </Link>
        <button
          type="button"
          onClick={() => toggleSave(opportunity.id)}
          className={`${styles.bookmarkBtn} ${saved ? styles.bookmarked : ''}`}
          aria-label={saved ? 'Remove from saved' : 'Save opportunity'}
          title={saved ? 'Remove from saved' : 'Save opportunity'}
        >
          <Bookmark size={18} strokeWidth={1.75} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
