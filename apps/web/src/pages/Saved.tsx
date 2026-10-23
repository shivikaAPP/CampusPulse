import { useState, useEffect, useMemo } from 'react';
import type { Opportunity } from '@campusplus/shared';
import { repository } from '../data/index.js';
import { useSaved } from '../state/saved.js';
import { Seo } from '../seo/Seo.js';
import { STATIC_PAGES } from '../seo/pages.js';
import { OpportunityCard } from '../components/OpportunityCard.js';
import { EmptyState } from '../components/EmptyState.js';
import styles from './Saved.module.css';

export function Saved() {
  const { savedIds } = useSaved();
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

  const savedOpportunities = useMemo(() => {
    const savedSet = new Set(savedIds);
    return opportunities.filter((o) => savedSet.has(o.id));
  }, [opportunities, savedIds]);

  return (
    <div className={`container ${styles.savedPage}`}>
      <Seo
        title={STATIC_PAGES.saved.title}
        description={STATIC_PAGES.saved.description}
        path={STATIC_PAGES.saved.path}
        noindex={STATIC_PAGES.saved.noindex}
      />

      <header className={styles.header}>
        <h1 className={styles.title}>{STATIC_PAGES.saved.h1}</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          Your saved hackathons, internships and workshops on this device.
        </p>
      </header>

      {loading ? (
        <div style={{ padding: 'var(--space-8) 0', color: 'var(--text-muted)' }}>
          Loading saved opportunities...
        </div>
      ) : savedOpportunities.length === 0 ? (
        <EmptyState
          title="You have not saved any opportunities"
          description="Browse listings and use the bookmark button to keep them here."
          action={{
            label: 'Browse listings',
            href: '/explore',
          }}
        />
      ) : (
        <div className={styles.grid}>
          {savedOpportunities.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} now={now} />
          ))}
        </div>
      )}
    </div>
  );
}
export default Saved;
