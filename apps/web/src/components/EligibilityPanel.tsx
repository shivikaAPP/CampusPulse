import { Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import type { EligibilityResult } from '@campusplus/shared';
import styles from './EligibilityPanel.module.css';

interface EligibilityPanelProps {
  result: EligibilityResult;
}

export function EligibilityPanel({ result }: EligibilityPanelProps) {
  const { status, statusLabel, reasons, needsInfo, manualChecks } = result;

  const statusBadge =
    status === 'eligible' ? (
      <span className={`${styles.statusBadge} ${styles.statusEligible}`}>
        <CheckCircle2 size={14} strokeWidth={1.75} aria-hidden="true" />
        Eligible
      </span>
    ) : status === 'possibly_eligible' ? (
      <span className={`${styles.statusBadge} ${styles.statusPossible}`}>
        <AlertCircle size={14} strokeWidth={1.75} aria-hidden="true" />
        Needs information
      </span>
    ) : (
      <span className={`${styles.statusBadge} ${styles.statusNotEligible}`}>
        <XCircle size={14} strokeWidth={1.75} aria-hidden="true" />
        Not eligible
      </span>
    );

  return (
    <section className={styles.panel} aria-labelledby="eligibility-heading">
      <div className={styles.headingRow}>
        <h3 id="eligibility-heading" className={styles.title}>
          Eligibility check
        </h3>
        {statusBadge}
      </div>

      <p className={styles.statusMessage}>{statusLabel}</p>

      {reasons.length > 0 && (
        <div className={styles.listGroup}>
          <div className={styles.subheading}>Criteria results</div>
          <ul>
            {reasons.map((reason, idx) => (
              <li key={idx} className={styles.item}>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {needsInfo.length > 0 && (
        <div className={styles.listGroup}>
          <div className={styles.subheading}>Missing profile details</div>
          <ul>
            {needsInfo.map((info, idx) => (
              <li key={idx} className={`${styles.item} ${styles.needsInfoItem}`}>
                {info}
                <Link to="/profile" className={styles.profileLink}>
                  Add to profile
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {manualChecks.length > 0 && (
        <div className={styles.listGroup}>
          <div className={styles.subheading}>Confirm on the official page</div>
          <ul>
            {manualChecks.map((check, idx) => (
              <li key={idx} className={styles.item}>
                {check}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
