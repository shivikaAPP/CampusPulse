import { Search, RotateCcw } from 'lucide-react';
import { SKILLS, CATEGORIES } from '@campusplus/shared';
import styles from './FilterBar.module.css';

export interface FilterState {
  search: string;
  category: string;
  fee: string;
  mode: string;
  level: string;
  skill: string;
  city: string;
  deadline: string;
  verifiedOnly: boolean;
  showExpired: boolean;
  sort: string;
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (key: keyof FilterState, val: string | boolean) => void;
  onReset: () => void;
  availableCities: string[];
}

export function FilterBar({ filters, onChange, onReset, availableCities }: FilterBarProps) {
  return (
    <div className={styles.filterContainer}>
      <div className={styles.searchRow}>
        <div className={styles.searchInputWrapper}>
          <Search size={18} strokeWidth={1.75} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => onChange('search', e.target.value)}
            placeholder="Search by title, organizer, city, or skill"
            className={styles.searchInput}
            aria-label="Search opportunities"
          />
        </div>
        <button
          type="button"
          onClick={onReset}
          className={styles.resetBtn}
          title="Reset all filters"
        >
          <RotateCcw size={14} strokeWidth={1.75} aria-hidden="true" />
          <span>Reset filters</span>
        </button>
      </div>

      <div className={styles.filterGrid}>
        <div className={styles.selectGroup}>
          <label htmlFor="filter-category" className={styles.label}>
            Category
          </label>
          <select
            id="filter-category"
            value={filters.category}
            onChange={(e) => onChange('category', e.target.value)}
            className={styles.select}
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.selectGroup}>
          <label htmlFor="filter-fee" className={styles.label}>
            Fee
          </label>
          <select
            id="filter-fee"
            value={filters.fee}
            onChange={(e) => onChange('fee', e.target.value)}
            className={styles.select}
          >
            <option value="all">Any fee</option>
            <option value="free">Free only</option>
            <option value="paid">Paid only</option>
          </select>
        </div>

        <div className={styles.selectGroup}>
          <label htmlFor="filter-mode" className={styles.label}>
            Mode
          </label>
          <select
            id="filter-mode"
            value={filters.mode}
            onChange={(e) => onChange('mode', e.target.value)}
            className={styles.select}
          >
            <option value="all">Any mode</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>

        <div className={styles.selectGroup}>
          <label htmlFor="filter-level" className={styles.label}>
            Experience level
          </label>
          <select
            id="filter-level"
            value={filters.level}
            onChange={(e) => onChange('level', e.target.value)}
            className={styles.select}
          >
            <option value="all">Any level</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div className={styles.selectGroup}>
          <label htmlFor="filter-skill" className={styles.label}>
            Skill
          </label>
          <select
            id="filter-skill"
            value={filters.skill}
            onChange={(e) => onChange('skill', e.target.value)}
            className={styles.select}
          >
            <option value="all">All skills</option>
            {SKILLS.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.selectGroup}>
          <label htmlFor="filter-city" className={styles.label}>
            City
          </label>
          <select
            id="filter-city"
            value={filters.city}
            onChange={(e) => onChange('city', e.target.value)}
            className={styles.select}
          >
            <option value="all">All cities</option>
            {availableCities.map((c) => (
              <option key={c} value={c.toLowerCase()}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.selectGroup}>
          <label htmlFor="filter-deadline" className={styles.label}>
            Deadline
          </label>
          <select
            id="filter-deadline"
            value={filters.deadline}
            onChange={(e) => onChange('deadline', e.target.value)}
            className={styles.select}
          >
            <option value="all">All upcoming</option>
            <option value="closing-soon">Closing soon (3 days)</option>
            <option value="this-week">Closing this week (7 days)</option>
          </select>
        </div>

        <div className={styles.selectGroup}>
          <label htmlFor="filter-sort" className={styles.label}>
            Sort by
          </label>
          <select
            id="filter-sort"
            value={filters.sort}
            onChange={(e) => onChange('sort', e.target.value)}
            className={styles.select}
          >
            <option value="match">Best match</option>
            <option value="deadline">Nearest deadline</option>
            <option value="recent">Recently added</option>
          </select>
        </div>
      </div>

      <div className={styles.togglesRow}>
        <label className={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={(e) => onChange('verifiedOnly', e.target.checked)}
            className={styles.toggleCheckbox}
          />
          <span>Verified only</span>
        </label>

        <label className={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={filters.showExpired}
            onChange={(e) => onChange('showExpired', e.target.checked)}
            className={styles.toggleCheckbox}
          />
          <span>Show expired listings</span>
        </label>
      </div>
    </div>
  );
}
