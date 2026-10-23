import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import type { Opportunity } from '@campusplus/shared';
import {
  isExpired,
  isClosingSoon,
  inDeadlineRescue,
  computeMatch,
  isProfileEmpty,
  getShortlist,
} from '@campusplus/shared';
import { repository } from '../data/index.js';
import { useProfile } from '../state/ProfileContext.js';
import { useApplications } from '../state/applications.js';
import { Seo } from '../seo/Seo.js';
import { STATIC_PAGES } from '../seo/pages.js';
import { OpportunityCard } from '../components/OpportunityCard.js';
import styles from './Home.module.css';

type ChipType = 'all' | 'free' | 'near-you' | 'online' | 'offline' | 'closing-soon';

export function Home() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { applications } = useApplications();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [activeChip, setActiveChip] = useState<ChipType>('all');

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

  const availableCities = useMemo(() => {
    const set = new Set<string>();
    opportunities.forEach((o) => {
      if (o.city) set.add(o.city);
    });
    return Array.from(set).sort();
  }, [opportunities]);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (selectedCity) params.set('city', selectedCity);
    navigate(`/explore?${params.toString()}`);
  };

  const nonExpiredOpportunities = useMemo(() => {
    return opportunities.filter((o) => !isExpired(o, now));
  }, [opportunities, now]);

  // Recommended for you (up to 6)
  const recommendedListings = useMemo(() => {
    let filtered = nonExpiredOpportunities;

    if (activeChip === 'free') {
      filtered = filtered.filter((o) => o.fee === 0);
    } else if (activeChip === 'online') {
      filtered = filtered.filter((o) => o.mode === 'online' || o.mode === 'hybrid');
    } else if (activeChip === 'offline') {
      filtered = filtered.filter((o) => o.mode === 'offline' || o.mode === 'hybrid');
    } else if (activeChip === 'near-you') {
      const targetCity = (profile.city || selectedCity).trim().toLowerCase();
      filtered = filtered.filter(
        (o) =>
          (o.mode === 'offline' || o.mode === 'hybrid') &&
          o.city &&
          o.city.trim().toLowerCase() === targetCity
      );
    } else if (activeChip === 'closing-soon') {
      filtered = filtered.filter((o) => isClosingSoon(o, now));
    }

    const profileEmpty = isProfileEmpty(profile);

    if (profileEmpty) {
      // Sort by nearest deadline
      return [...filtered]
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
        .slice(0, 6);
    }

    // Sort by match score
    return [...filtered]
      .sort((a, b) => {
        const scoreA = computeMatch(profile, a).total;
        const scoreB = computeMatch(profile, b).total;
        return scoreB - scoreA;
      })
      .slice(0, 6);
  }, [nonExpiredOpportunities, activeChip, profile, selectedCity, now]);

  // Closing soon (deadline within 7 days, nearest first)
  const closingSoonList = useMemo(() => {
    return nonExpiredOpportunities
      .filter((o) => inDeadlineRescue(o, now))
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 4);
  }, [nonExpiredOpportunities, now]);

  // Shortlist today (using getShortlist helper)
  const shortlistData = useMemo(() => {
    const excluded = new Set<string>();
    Object.entries(applications).forEach(([id, entry]) => {
      if (entry.status === 'applied' || entry.status === 'shortlisted' || entry.status === 'completed') {
        excluded.add(id);
      }
    });
    return getShortlist(opportunities, profile, now, excluded);
  }, [opportunities, profile, applications, now]);

  // Recently added (4 newest by createdAt)
  const recentlyAddedList = useMemo(() => {
    return [...opportunities]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4);
  }, [opportunities]);

  return (
    <div className={`container ${styles.homeContainer}`}>
      <Seo
        title={STATIC_PAGES.home.title}
        description={STATIC_PAGES.home.description}
        path={STATIC_PAGES.home.path}
      />

      <section className={styles.hero} aria-labelledby="hero-title">
        <h1 id="hero-title" className={styles.heroH1}>
          {STATIC_PAGES.home.h1}
        </h1>
        <p className={styles.heroSubtitle}>
          Browse listings in one place, see how well each one fits your profile, check eligibility
          and keep track of what you applied to.
        </p>

        <form onSubmit={handleHeroSearch} className={styles.heroSearchRow}>
          <div className={styles.searchWrapper}>
            <Search size={20} strokeWidth={1.75} className={styles.searchIcon} aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hackathons, internships, skills"
              className={styles.searchInput}
              aria-label="Search opportunities"
            />
          </div>

          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className={styles.citySelect}
            aria-label="Select city"
          >
            <option value="">All cities</option>
            {availableCities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button type="submit" className={styles.searchButton}>
            <span>Search</span>
            <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </form>
      </section>

      <div className={styles.chipsSection} role="toolbar" aria-label="Filter opportunities">
        <button
          type="button"
          onClick={() => setActiveChip('all')}
          className={`${styles.chip} ${activeChip === 'all' ? styles.chipActive : ''}`}
          aria-pressed={activeChip === 'all'}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setActiveChip('free')}
          className={`${styles.chip} ${activeChip === 'free' ? styles.chipActive : ''}`}
          aria-pressed={activeChip === 'free'}
        >
          Free only
        </button>
        <button
          type="button"
          onClick={() => setActiveChip('near-you')}
          className={`${styles.chip} ${activeChip === 'near-you' ? styles.chipActive : ''}`}
          aria-pressed={activeChip === 'near-you'}
        >
          Near you
        </button>
        <button
          type="button"
          onClick={() => setActiveChip('online')}
          className={`${styles.chip} ${activeChip === 'online' ? styles.chipActive : ''}`}
          aria-pressed={activeChip === 'online'}
        >
          Online
        </button>
        <button
          type="button"
          onClick={() => setActiveChip('offline')}
          className={`${styles.chip} ${activeChip === 'offline' ? styles.chipActive : ''}`}
          aria-pressed={activeChip === 'offline'}
        >
          Offline
        </button>
        <button
          type="button"
          onClick={() => setActiveChip('closing-soon')}
          className={`${styles.chip} ${activeChip === 'closing-soon' ? styles.chipActive : ''}`}
          aria-pressed={activeChip === 'closing-soon'}
        >
          Closing soon
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 'var(--space-8) 0', color: 'var(--text-muted)' }}>
          Loading listings...
        </div>
      ) : error ? (
        <div style={{ padding: 'var(--space-8) 0', color: 'var(--danger)' }}>
          Error loading listings: {error}
        </div>
      ) : (
        <>
          {/* Recommended for you */}
          <section className={styles.section} aria-labelledby="recommended-heading">
            <div className={styles.sectionHeader}>
              <h2 id="recommended-heading" className={styles.sectionTitle}>
                Recommended for you
              </h2>
              <Link to="/explore" className={styles.sectionLink}>
                Browse all
              </Link>
            </div>

            {isProfileEmpty(profile) && (
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                Sorted by nearest deadline.{' '}
                <Link to="/profile" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                  Complete your profile
                </Link>{' '}
                to get calculated match scores based on your skills and location.
              </p>
            )}

            {recommendedListings.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                {activeChip === 'near-you' && !profile.city
                  ? 'No city set in your profile. Select a city or add your city in your profile to view local listings.'
                  : 'No listings match this filter right now.'}
              </p>
            ) : (
              <div className={styles.grid}>
                {recommendedListings.map((opp) => (
                  <OpportunityCard key={opp.id} opportunity={opp} now={now} />
                ))}
              </div>
            )}
          </section>

          {/* Closing soon */}
          {closingSoonList.length > 0 && (
            <section className={styles.section} aria-labelledby="closing-soon-heading">
              <div className={styles.sectionHeader}>
                <h2 id="closing-soon-heading" className={styles.sectionTitle}>
                  Closing soon
                </h2>
                <Link to="/explore?deadline=this-week" className={styles.sectionLink}>
                  View all closing this week
                </Link>
              </div>

              <div className={styles.grid}>
                {closingSoonList.map((opp) => (
                  <OpportunityCard key={opp.id} opportunity={opp} now={now} />
                ))}
              </div>
            </section>
          )}

          {/* Your shortlist today */}
          {shortlistData.items.length > 0 && (
            <section className={styles.section} aria-labelledby="shortlist-heading">
              <div className={styles.sectionHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Sparkles size={20} strokeWidth={1.75} style={{ color: 'var(--accent)' }} aria-hidden="true" />
                  <h2 id="shortlist-heading" className={styles.sectionTitle}>
                    Your shortlist today
                  </h2>
                </div>
                {shortlistData.note && (
                  <span className={styles.shortlistNote}>{shortlistData.note}</span>
                )}
              </div>

              <div className={styles.grid}>
                {shortlistData.items.map(({ opportunity: opp, reason }) => (
                  <div key={opp.id} className={styles.shortlistItem}>
                    <OpportunityCard opportunity={opp} now={now} />
                    <p className={styles.shortlistReason}>
                      <strong>Why this listing:</strong> {reason}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recently added */}
          <section className={styles.section} aria-labelledby="recent-heading">
            <div className={styles.sectionHeader}>
              <h2 id="recent-heading" className={styles.sectionTitle}>
                Recently added
              </h2>
              <Link to="/explore?sort=recent" className={styles.sectionLink}>
                View all recent
              </Link>
            </div>

            <div className={styles.grid}>
              {recentlyAddedList.map((opp) => (
                <OpportunityCard key={opp.id} opportunity={opp} now={now} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
export default Home;
