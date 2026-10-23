import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  ExternalLink,
  Flag,
  AlertTriangle,
} from 'lucide-react';
import type { Opportunity } from '@campusplus/shared';
import {
  isExpired,
  formatISTDate,
  formatISTDateTime,
  displayVerification,
  computeMatch,
  isProfileEmpty,
  checkEligibility,
  SKILL_LABELS,
  TOPIC_LABELS,
} from '@campusplus/shared';
import { repository } from '../data/index.js';
import { useProfile } from '../state/ProfileContext.js';
import { useSaved } from '../state/saved.js';
import { useApplications, type ApplicationStatus } from '../state/applications.js';
import { Seo } from '../seo/Seo.js';
import { FeeBadge, VerificationBadge, DemoBadge, ClosingSoonBadge } from '../components/Badges.js';
import { MatchScore } from '../components/MatchScore.js';
import { EligibilityPanel } from '../components/EligibilityPanel.js';
import { ActionPath } from '../components/ActionPath.js';
import { ReportDialog } from '../components/ReportDialog.js';
import { EmptyState } from '../components/EmptyState.js';
import styles from './Detail.module.css';

export function Detail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useProfile();
  const { isSaved, toggleSave } = useSaved();
  const { getApplicationStatus, setApplicationStatus } = useApplications();

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const now = useMemo(() => new Date(), []);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    repository
      .getOpportunity(id)
      .then((data) => {
        if (mounted) {
          setOpportunity(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Failed to load opportunity');
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className={`container ${styles.detailPage}`}>
        <p style={{ color: 'var(--text-muted)' }}>Loading listing...</p>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className={`container ${styles.detailPage}`}>
        <Seo
          title="Listing not found | CampusPlus"
          description="This opportunity does not exist or has been removed from CampusPlus."
          path={`/opportunities/${id || ''}`}
          noindex={true}
        />
        <EmptyState
          title="This listing does not exist or has been removed"
          description="The opportunity may have expired, or the identifier might be mistyped."
          action={{
            label: 'Browse all opportunities',
            href: '/explore',
          }}
        />
      </div>
    );
  }

  const expired = isExpired(opportunity, now);
  const deadlineFormatted = formatISTDate(opportunity.deadline);
  const verification = displayVerification(opportunity, now);
  const profileEmpty = isProfileEmpty(profile);
  const match = expired ? null : computeMatch(profile, opportunity);
  const eligibilityResult = checkEligibility(profile, opportunity);
  const saved = isSaved(opportunity.id);
  const currentAppStatus = getApplicationStatus(opportunity.id);

  // SEO Description
  const rawDesc = `${opportunity.title} by ${opportunity.organizer}. ${opportunity.category}, ${
    opportunity.fee === 0 ? 'Free' : `₹${opportunity.fee}`
  }, register by ${deadlineFormatted}.`;
  const seoDesc = rawDesc.length > 160 ? rawDesc.slice(0, 157) + '...' : rawDesc;

  const modeCityLabel =
    opportunity.mode === 'online'
      ? 'Online'
      : opportunity.mode === 'hybrid'
      ? `Hybrid (${opportunity.city})`
      : `Offline (${opportunity.city})`;

  const statuses: { label: string; value: ApplicationStatus }[] = [
    { label: 'Interested', value: 'interested' },
    { label: 'Applied', value: 'applied' },
    { label: 'Shortlisted', value: 'shortlisted' },
    { label: 'Completed', value: 'completed' },
  ];

  return (
    <article className={`container ${styles.detailPage}`}>
      <Seo
        title={`${opportunity.title} | CampusPlus`}
        description={seoDesc}
        path={`/opportunities/${opportunity.id}`}
        noindex={opportunity.isDemo || expired}
      />

      <Link to="/explore" className={styles.backLink}>
        <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
        <span>Back to listings</span>
      </Link>

      {expired && (
        <div className={styles.expiredBanner} role="alert">
          <AlertTriangle size={18} strokeWidth={1.75} aria-hidden="true" />
          <span>Registration closed on {deadlineFormatted}</span>
        </div>
      )}

      {/* 1. Title and organizer */}
      <section className={styles.headerSection}>
        <h1 className={styles.title}>{opportunity.title}</h1>
        <p className={styles.organizer}>{opportunity.organizer}</p>
      </section>

      {/* 2. Badges row */}
      <div className={styles.badgesRow}>
        {opportunity.isDemo && <DemoBadge />}
        <FeeBadge fee={opportunity.fee} />
        <VerificationBadge status={verification} />
        {!expired && <ClosingSoonBadge />}
      </div>

      {/* 3. Key facts */}
      <section className={styles.keyFactsGrid} aria-label="Key facts">
        <div className={styles.factItem}>
          <span className={styles.factLabel}>Registration Fee</span>
          <span className={styles.factValue}>
            {opportunity.fee === 0 ? 'Free' : `₹${opportunity.fee}`}
          </span>
        </div>

        {opportunity.additionalCostsNote && (
          <div className={styles.factItem}>
            <span className={styles.factLabel}>Additional Costs</span>
            <span className={styles.factValue}>{opportunity.additionalCostsNote}</span>
          </div>
        )}

        <div className={styles.factItem}>
          <span className={styles.factLabel}>Mode and Location</span>
          <span className={styles.factValue}>{modeCityLabel}</span>
        </div>

        {opportunity.eventDate && (
          <div className={styles.factItem}>
            <span className={styles.factLabel}>Event Date</span>
            <span className={styles.factValue}>{formatISTDate(opportunity.eventDate)}</span>
          </div>
        )}

        <div className={styles.factItem}>
          <span className={styles.factLabel}>Registration Deadline</span>
          <span className={styles.factValue}>{deadlineFormatted}</span>
        </div>
      </section>

      {/* 4. Description */}
      <section className={styles.section} aria-labelledby="desc-heading">
        <h2 id="desc-heading" className={styles.sectionHeading}>
          Description
        </h2>
        <p className={styles.description}>{opportunity.description}</p>
      </section>

      {/* 5. Benefits */}
      {opportunity.benefits.length > 0 && (
        <section className={styles.section} aria-labelledby="benefits-heading">
          <h2 id="benefits-heading" className={styles.sectionHeading}>
            Benefits
          </h2>
          <ul style={{ paddingLeft: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            {opportunity.benefits.map((benefit, idx) => (
              <li key={idx} style={{ color: 'var(--text)', fontSize: 'var(--font-size-sm)' }}>
                {benefit}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 6. Skills & Topics */}
      {(opportunity.skills.length > 0 || opportunity.topics.length > 0) && (
        <section className={styles.section} aria-labelledby="skills-heading">
          <h2 id="skills-heading" className={styles.sectionHeading}>
            Skills and Topics
          </h2>
          <div className={styles.tagList}>
            {opportunity.skills.map((s) => (
              <span key={s} className={styles.tag}>
                {SKILL_LABELS[s] || s}
              </span>
            ))}
            {opportunity.topics.map((t) => (
              <span key={t} className={styles.tag}>
                {TOPIC_LABELS[t] || t}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* 7. Eligibility result with reasons */}
      <EligibilityPanel result={eligibilityResult} />

      {/* 8. Match score with per factor breakdown */}
      {!expired && (
        <section className={styles.section} aria-labelledby="match-heading">
          <h2 id="match-heading" className={styles.sectionHeading}>
            Match score breakdown
          </h2>
          <MatchScore match={match} profileEmpty={profileEmpty} detailed={true} />
        </section>
      )}

      {/* 9. Verification block */}
      <section className={styles.verificationBlock} aria-labelledby="verification-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 id="verification-heading" className={styles.sectionHeading}>
            Verification details
          </h2>
          <VerificationBadge status={verification} />
        </div>

        <div className={styles.verificationMeta}>
          {opportunity.sourceUrl ? (
            <p style={{ margin: 0 }}>
              Source verification link:{' '}
              <a
                href={opportunity.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent)', textDecoration: 'underline' }}
              >
                Official announcement page
              </a>
            </p>
          ) : (
            <p style={{ margin: 0 }}>
              {opportunity.isDemo
                ? 'Sample listing created for demonstration. No source link available.'
                : 'Unverified listing from community submission.'}
            </p>
          )}

          {opportunity.lastCheckedAt && (
            <p style={{ margin: 0 }}>
              Last verified by moderator on: {formatISTDateTime(opportunity.lastCheckedAt)}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setReportModalOpen(true)}
          className={styles.reportBtn}
        >
          <Flag size={12} strokeWidth={1.75} aria-hidden="true" />
          <span>Report listing</span>
        </button>
      </section>

      {/* 10. Preparation checklist */}
      <ActionPath
        opportunityId={opportunity.id}
        category={opportunity.category}
        mode={opportunity.mode}
        manualChecks={opportunity.eligibility.manualChecks}
      />

      {/* 11. Actions */}
      <section className={styles.actionsCard} aria-label="Opportunity actions">
        <div className={styles.mainActionButtons}>
          {!expired && (
            <>
              {opportunity.applicationUrl ? (
                <a
                  href={opportunity.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.primaryBtn}
                >
                  <span>Open official page</span>
                  <ExternalLink size={16} strokeWidth={1.75} aria-hidden="true" />
                </a>
              ) : (
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                  No official page is linked for this listing
                </span>
              )}
            </>
          )}

          <button
            type="button"
            onClick={() => toggleSave(opportunity.id)}
            className={styles.secondaryBtn}
            aria-label={saved ? 'Remove saved opportunity' : 'Save opportunity'}
          >
            <Bookmark
              size={16}
              strokeWidth={1.75}
              fill={saved ? 'currentColor' : 'none'}
              aria-hidden="true"
            />
            <span>{saved ? 'Saved' : 'Save opportunity'}</span>
          </button>
        </div>

        <div className={styles.statusSelectorRow}>
          <span className={styles.statusLabel}>
            Update application status (student managed):
          </span>
          <div className={styles.statusButtons}>
            {statuses.map((s) => {
              const active = currentAppStatus === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() =>
                    setApplicationStatus(opportunity.id, active ? null : s.value)
                  }
                  className={`${styles.statusChip} ${active ? styles.statusChipActive : ''}`}
                  aria-pressed={active}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <ReportDialog
        opportunity={opportunity}
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />
    </article>
  );
}
export default Detail;
