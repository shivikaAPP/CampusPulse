import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Opportunity } from '@campusplus/shared';
import {
  isExpired,
  isClosingSoon,
  inDeadlineRescue,
  computeMatch,
  isProfileEmpty,
  SKILL_LABELS,
  TOPIC_LABELS,
} from '@campusplus/shared';
import { repository } from '../data/index.js';
import { useProfile } from '../state/ProfileContext.js';
import { Seo } from '../seo/Seo.js';
import { STATIC_PAGES } from '../seo/pages.js';
import { FilterBar, type FilterState } from '../components/FilterBar.js';
import { OpportunityCard } from '../components/OpportunityCard.js';
import { EmptyState } from '../components/EmptyState.js';
import styles from './Explore.module.css';

export function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useProfile();
  const now = useMemo(() => new Date(), []);

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Failed to load opportunities');
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Sync state from URL search params
  const defaultSort = isProfileEmpty(profile) ? 'deadline' : 'match';
  const filters: FilterState = useMemo(() => ({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || 'all',
    fee: searchParams.get('fee') || 'all',
    mode: searchParams.get('mode') || 'all',
    level: searchParams.get('level') || 'all',
    skill: searchParams.get('skill') || 'all',
    city: searchParams.get('city') || 'all',
    deadline: searchParams.get('deadline') || 'all',
    verifiedOnly: searchParams.get('verifiedOnly') === 'true',
    showExpired: searchParams.get('showExpired') === 'true',
    sort: searchParams.get('sort') || defaultSort,
  }), [searchParams, defaultSort]);

  const handleFilterChange = useCallback(
    (key: keyof FilterState, val: string | boolean) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (typeof val === 'boolean') {
          if (val) next.set(key, 'true');
          else next.delete(key);
        } else if (val === '' || val === 'all') {
          next.delete(key);
        } else {
          next.set(key, val);
        }
        return next;
      });
    },
    [setSearchParams]
  );

  const handleResetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const availableCities = useMemo(() => {
    const set = new Set<string>();
    opportunities.forEach((o) => {
      if (o.city) set.add(o.city);
    });
    return Array.from(set).sort();
  }, [opportunities]);

  // Filtering and sorting logic
  const filteredListings = useMemo(() => {
    return opportunities.filter((opp) => {
      // 1. Expired check
      const expired = isExpired(opp, now);
      if (expired && !filters.showExpired) {
        return false;
      }

      // 2. Verified only check
      if (filters.verifiedOnly && opp.verification !== 'verified') {
        return false;
      }

      // 3. Category check
      if (filters.category !== 'all' && opp.category !== filters.category) {
        return false;
      }

      // 4. Fee check
      if (filters.fee === 'free' && opp.fee > 0) return false;
      if (filters.fee === 'paid' && opp.fee === 0) return false;

      // 5. Mode check
      if (filters.mode !== 'all' && opp.mode !== filters.mode) {
        return false;
      }

      // 6. Level check
      if (filters.level !== 'all' && opp.level !== filters.level) {
        return false;
      }

      // 7. Skill check
      if (filters.skill !== 'all' && !opp.skills.includes(filters.skill)) {
        return false;
      }

      // 8. City check
      if (filters.city !== 'all') {
        if (!opp.city || opp.city.trim().toLowerCase() !== filters.city.trim().toLowerCase()) {
          return false;
        }
      }

      // 9. Deadline check
      if (filters.deadline === 'closing-soon') {
        if (!isClosingSoon(opp, now)) return false;
      } else if (filters.deadline === 'this-week') {
        if (!inDeadlineRescue(opp, now)) return false;
      }

      // 10. Search query text match
      if (filters.search.trim()) {
        const queryTerms = filters.search.trim().toLowerCase().split(/\s+/);
        const skillText = opp.skills.map((s) => SKILL_LABELS[s] || s).join(' ');
        const topicText = opp.topics.map((t) => TOPIC_LABELS[t] || t).join(' ');
        const searchableText = `${opp.title} ${opp.organizer} ${opp.city || ''} ${opp.description} ${skillText} ${topicText}`.toLowerCase();

        const allTermsMatch = queryTerms.every((term) => searchableText.includes(term));
        if (!allTermsMatch) return false;
      }

      return true;
    });
  }, [opportunities, filters, now]);

  // Sort
  const sortedListings = useMemo(() => {
    const list = [...filteredListings];
    if (filters.sort === 'deadline') {
      return list.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    }
    if (filters.sort === 'recent') {
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    // Default: match score
    return list.sort((a, b) => {
      const scoreA = computeMatch(profile, a).total;
      const scoreB = computeMatch(profile, b).total;
      return scoreB - scoreA;
    });
  }, [filteredListings, filters.sort, profile]);

  return (
    <div className={`container ${styles.explorePage}`}>
      <Seo
        title={STATIC_PAGES.explore.title}
        description={STATIC_PAGES.explore.description}
        path={STATIC_PAGES.explore.path}
      />

      <header className={styles.header}>
        <h1 className={styles.title}>{STATIC_PAGES.explore.h1}</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          Filter opportunities by category, fee, mode, required skills, city and deadline.
        </p>
      </header>

      <FilterBar
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        availableCities={availableCities}
      />

      <div className={styles.resultsMeta}>
        <span>
          {sortedListings.length} {sortedListings.length === 1 ? 'listing matches' : 'listings match'}
        </span>
        {filters.showExpired && <span>(including expired)</span>}
      </div>

      {loading ? (
        <div style={{ padding: 'var(--space-8) 0', color: 'var(--text-muted)' }}>
          Loading listings...
        </div>
      ) : error ? (
        <div style={{ padding: 'var(--space-8) 0', color: 'var(--danger)' }}>
          Error loading listings: {error}
        </div>
      ) : sortedListings.length === 0 ? (
        filters.verifiedOnly ? (
          <EmptyState
            title="No verified listings yet"
            description="A listing is marked verified after a moderator checks its source."
            action={{
              label: 'Turn off verified only filter',
              onClick: () => handleFilterChange('verifiedOnly', false),
            }}
          />
        ) : (
          <EmptyState
            title="No listings match these filters"
            description="Try removing some filters or clearing your search term to see more opportunities."
            action={{
              label: 'Reset filters',
              onClick: handleResetFilters,
            }}
          />
        )
      ) : (
        <div className={styles.grid}>
          {sortedListings.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} now={now} />
          ))}
        </div>
      )}
    </div>
  );
}
export default Explore;
