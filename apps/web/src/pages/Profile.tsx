import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { SKILLS, TOPICS } from '@campusplus/shared';
import type { Profile as ProfileType, Level } from '@campusplus/shared';
import { useProfile } from '../state/ProfileContext.js';
import { Seo } from '../seo/Seo.js';
import { STATIC_PAGES } from '../seo/pages.js';
import styles from './Profile.module.css';

export function Profile() {
  const { profile, updateProfile, resetAllData } = useProfile();
  const [formData, setFormData] = useState<ProfileType>(profile);
  const [savedNotice, setSavedNotice] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleTextChange = (field: keyof ProfileType, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleYearChange = (val: string) => {
    const num = val === '' ? null : parseInt(val, 10);
    setFormData((prev) => ({ ...prev, year: num }));
  };

  const handleLevelChange = (val: string) => {
    const level = val === '' ? null : (val as Level);
    setFormData((prev) => ({ ...prev, level }));
  };

  const handleModeChange = (val: string) => {
    const mode = val === '' ? null : (val as 'online' | 'offline' | 'any');
    setFormData((prev) => ({ ...prev, preferredMode: mode }));
  };

  const handleBudgetChange = (val: string) => {
    if (val === '') {
      setFormData((prev) => ({ ...prev, maxBudget: null }));
    } else {
      const num = parseInt(val, 10);
      setFormData((prev) => ({ ...prev, maxBudget: isNaN(num) ? null : Math.max(0, num) }));
    }
  };

  const toggleSkill = (slug: string) => {
    setFormData((prev) => {
      const exists = prev.skills.includes(slug);
      return {
        ...prev,
        skills: exists ? prev.skills.filter((s) => s !== slug) : [...prev.skills, slug],
      };
    });
  };

  const toggleInterest = (slug: string) => {
    setFormData((prev) => {
      const exists = prev.interests.includes(slug);
      return {
        ...prev,
        interests: exists ? prev.interests.filter((i) => i !== slug) : [...prev.interests, slug],
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleDeleteData = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    resetAllData();
  };

  return (
    <div className={`container ${styles.profilePage}`}>
      <Seo
        title={STATIC_PAGES.profile.title}
        description={STATIC_PAGES.profile.description}
        path={STATIC_PAGES.profile.path}
        noindex={STATIC_PAGES.profile.noindex}
      />

      <header className={styles.header}>
        <h1 className={styles.title}>{STATIC_PAGES.profile.h1}</h1>
        <p className={styles.privacyNotice}>
          Your profile stays in this browser. We do not store student profiles on any remote server.
        </p>
      </header>

      <form onSubmit={handleSubmit} className={styles.form}>
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Basic Information</legend>

          <div className={styles.field}>
            <label htmlFor="profile-displayName" className={styles.label}>
              Display name
            </label>
            <input
              id="profile-displayName"
              type="text"
              value={formData.displayName}
              onChange={(e) => handleTextChange('displayName', e.target.value)}
              placeholder="Your name"
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="profile-college" className={styles.label}>
              College / University
            </label>
            <input
              id="profile-college"
              type="text"
              value={formData.college}
              onChange={(e) => handleTextChange('college', e.target.value)}
              placeholder="e.g. Delhi Technological University"
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="profile-city" className={styles.label}>
              City
            </label>
            <input
              id="profile-city"
              type="text"
              value={formData.city}
              onChange={(e) => handleTextChange('city', e.target.value)}
              placeholder="e.g. Delhi, Greater Noida, Bengaluru"
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="profile-year" className={styles.label}>
              Year of study
            </label>
            <select
              id="profile-year"
              value={formData.year ?? ''}
              onChange={(e) => handleYearChange(e.target.value)}
              className={styles.select}
            >
              <option value="">Not specified</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
              <option value="5">Year 5</option>
            </select>
          </div>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Skills & Interests</legend>

          <div className={styles.field}>
            <span className={styles.label}>Skills you know or practice</span>
            <div className={styles.chipGroup}>
              {SKILLS.map((skill) => {
                const selected = formData.skills.includes(skill.slug);
                return (
                  <button
                    key={skill.slug}
                    type="button"
                    onClick={() => toggleSkill(skill.slug)}
                    className={`${styles.chip} ${selected ? styles.chipSelected : ''}`}
                    aria-pressed={selected}
                  >
                    {skill.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Topics of interest</span>
            <div className={styles.chipGroup}>
              {TOPICS.map((topic) => {
                const selected = formData.interests.includes(topic.slug);
                return (
                  <button
                    key={topic.slug}
                    type="button"
                    onClick={() => toggleInterest(topic.slug)}
                    className={`${styles.chip} ${selected ? styles.chipSelected : ''}`}
                    aria-pressed={selected}
                  >
                    {topic.label}
                  </button>
                );
              })}
            </div>
          </div>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Preferences & Budget</legend>

          <div className={styles.field}>
            <label htmlFor="profile-level" className={styles.label}>
              Experience level
            </label>
            <select
              id="profile-level"
              value={formData.level ?? ''}
              onChange={(e) => handleLevelChange(e.target.value)}
              className={styles.select}
            >
              <option value="">Not specified</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="profile-mode" className={styles.label}>
              Preferred mode
            </label>
            <select
              id="profile-mode"
              value={formData.preferredMode ?? ''}
              onChange={(e) => handleModeChange(e.target.value)}
              className={styles.select}
            >
              <option value="">Not specified</option>
              <option value="online">Online only</option>
              <option value="offline">Offline only</option>
              <option value="any">Any mode</option>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="profile-budget" className={styles.label}>
              Maximum budget (in ₹ INR, enter 0 for free only)
            </label>
            <input
              id="profile-budget"
              type="number"
              min="0"
              step="50"
              value={formData.maxBudget ?? ''}
              onChange={(e) => handleBudgetChange(e.target.value)}
              placeholder="e.g. 0 or 500"
              className={styles.input}
            />
          </div>
        </fieldset>

        <div className={styles.actions}>
          <button type="submit" className={styles.saveBtn}>
            Save profile
          </button>

          <button
            type="button"
            onClick={handleDeleteData}
            className={styles.deleteBtn}
          >
            <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" />
            <span>
              {confirmDelete ? 'Click again to confirm delete' : 'Delete my data on this device'}
            </span>
          </button>
        </div>

        {savedNotice && (
          <p className={styles.saveSuccess} role="status">
            Profile saved successfully.
          </p>
        )}
      </form>
    </div>
  );
}
export default Profile;
