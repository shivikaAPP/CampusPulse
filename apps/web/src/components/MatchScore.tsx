import { Link } from 'react-router-dom';
import type { MatchResult } from '@campusplus/shared';
import styles from './MatchScore.module.css';

interface MatchScoreProps {
  match: MatchResult | null;
  profileEmpty: boolean;
  detailed?: boolean;
}

export function MatchScore({ match, profileEmpty, detailed = false }: MatchScoreProps) {
  if (profileEmpty) {
    return (
      <div className={styles.container}>
        <p className={styles.emptyPrompt}>
          Add your skills and interests to see match scores.{' '}
          <Link to="/profile" className={styles.emptyLink}>
            Edit profile
          </Link>
        </p>
      </div>
    );
  }

  if (!match) {
    return null;
  }

  const labelClass =
    match.label === 'Strong'
      ? styles.strong
      : match.label === 'Good'
      ? styles.good
      : match.label === 'Fair'
      ? styles.fair
      : styles.low;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.scoreRow}>
          <span className={styles.scoreNumber}>{match.total}</span>
          <span className={styles.scoreTotal}>/ 100</span>
        </div>
        <span className={`${styles.label} ${labelClass}`}>{match.label}</span>
      </div>

      <div className={styles.barTrack} aria-hidden="true">
        <div
          className={styles.barFill}
          style={{ width: `${Math.max(0, Math.min(100, match.total))}%` }}
        />
      </div>

      <p className={styles.summary}>{match.summary}</p>

      {match.estimated && (
        <p className={styles.estimatedNotice}>
          Estimated. Add the missing details in your profile for a more accurate score.
        </p>
      )}

      {detailed && match.factors.length > 0 && (
        <div style={{ marginTop: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {match.factors.map((f) => (
            <div
              key={f.factor}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 'var(--font-size-xs)',
                borderTop: '1px solid var(--border)',
                paddingTop: 'var(--space-1)',
              }}
            >
              <span style={{ textTransform: 'capitalize', color: 'var(--text)' }}>
                {f.factor}: {f.reason}
              </span>
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                {f.points}/{f.max}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
