import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Opportunity } from '@campusplus/shared';
import { formatDaysLeft, isExpired } from '@campusplus/shared';
import { repository } from '../data/index.js';
import { useApplications, type ApplicationStatus } from '../state/applications.js';
import { Seo } from '../seo/Seo.js';
import { STATIC_PAGES } from '../seo/pages.js';
import { EmptyState } from '../components/EmptyState.js';
import styles from './Applications.module.css';

const COLUMNS: { id: ApplicationStatus; title: string }[] = [
  { id: 'interested', title: 'Interested' },
  { id: 'applied', title: 'Applied' },
  { id: 'shortlisted', title: 'Shortlisted' },
  { id: 'completed', title: 'Completed' },
];

export function Applications() {
  const { applications, setApplicationStatus } = useApplications();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const now = useMemo(() => new Date(), []);

  useEffect(() => {
    let mounted = true;
    repository
      .listOpportunities()
      .then((data) => {
        if (mounted) {
          setOpportunities(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const oppsById = useMemo(() => {
    const map = new Map<string, Opportunity>();
    opportunities.forEach((o) => map.set(o.id, o));
    return map;
  }, [opportunities]);

  // Group applications by status (only for listings that exist)
  const grouped = useMemo(() => {
    const result: Record<ApplicationStatus, { id: string; opp: Opportunity; updatedAt: string }[]> = {
      interested: [],
      applied: [],
      shortlisted: [],
      completed: [],
    };

    Object.entries(applications).forEach(([id, entry]) => {
      const opp = oppsById.get(id);
      if (opp && result[entry.status]) {
        result[entry.status].push({ id, opp, updatedAt: entry.updatedAt });
      }
    });

    return result;
  }, [applications, oppsById]);

  const totalTracked = Object.values(applications).length;

  return (
    <div className={`container ${styles.applicationsPage}`}>
      <Seo
        title={STATIC_PAGES.applications.title}
        description={STATIC_PAGES.applications.description}
        path={STATIC_PAGES.applications.path}
        noindex={STATIC_PAGES.applications.noindex}
      />

      <header className={styles.header}>
        <h1 className={styles.title}>{STATIC_PAGES.applications.h1}</h1>
        <p className={styles.notice}>
          You update these statuses yourself. CampusPlus does not receive updates from organizers
          or employers.
        </p>
      </header>

      {loading ? (
        <div style={{ padding: 'var(--space-8) 0', color: 'var(--text-muted)' }}>
          Loading application tracker...
        </div>
      ) : totalTracked === 0 ? (
        <EmptyState
          title="No applications tracked yet"
          description="When you find an opportunity you like, update its application status to track your progress here."
          action={{
            label: 'Browse listings',
            href: '/explore',
          }}
        />
      ) : (
        <div className={styles.boardGrid}>
          {COLUMNS.map((col) => {
            const items = grouped[col.id] || [];
            return (
              <div key={col.id} className={styles.column}>
                <div className={styles.columnHeader}>
                  <h2 className={styles.columnTitle}>{col.title}</h2>
                  <span className={styles.countBadge}>{items.length}</span>
                </div>

                <div className={styles.cardsList}>
                  {items.length === 0 ? (
                    <div className={styles.emptyColumnNotice}>No listings</div>
                  ) : (
                    items.map(({ id, opp }) => {
                      const expired = isExpired(opp, now);
                      const deadlineText = formatDaysLeft(opp, now);
                      return (
                        <div key={id} className={styles.cardItem}>
                          <h3 className={styles.cardTitle}>
                            <Link to={`/opportunities/${id}`} className={styles.cardLink}>
                              {opp.title}
                            </Link>
                          </h3>

                          <div className={styles.cardMeta}>
                            <span>{opp.organizer}</span>
                            <span style={{ color: expired ? 'var(--danger)' : 'var(--text-muted)' }}>
                              {deadlineText}
                            </span>
                          </div>

                          <label htmlFor={`status-${id}`} className="sr-only">
                            Change status for {opp.title}
                          </label>
                          <select
                            id={`status-${id}`}
                            value={col.id}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'remove') {
                                setApplicationStatus(id, null);
                              } else {
                                setApplicationStatus(id, val as ApplicationStatus);
                              }
                            }}
                            className={styles.statusSelect}
                          >
                            <option value="interested">Interested</option>
                            <option value="applied">Applied</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="completed">Completed</option>
                            <option value="remove">Remove from tracker</option>
                          </select>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
export default Applications;
