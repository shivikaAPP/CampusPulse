import { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import type { Category, Mode, Level, SubmissionInput } from '@campusplus/shared';
import { CATEGORIES } from '@campusplus/shared';
import { repository } from '../data/index.js';
import { Seo } from '../seo/Seo.js';
import { STATIC_PAGES } from '../seo/pages.js';
import styles from './Submit.module.css';

export function Submit() {
  const isLocalSource = import.meta.env.VITE_DATA_SOURCE !== 'api';
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || 'contact@campusplus.in';

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('hackathon');
  const [organizer, setOrganizer] = useState('');
  const [description, setDescription] = useState('');
  const [fee, setFee] = useState('0');
  const [mode, setMode] = useState<Mode>('online');
  const [city, setCity] = useState('');
  const [level, setLevel] = useState<Level>('intermediate');
  const [deadline, setDeadline] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [applicationUrl, setApplicationUrl] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');

  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocalSource) return;

    const payload: SubmissionInput = {
      title,
      category,
      organizer,
      description,
      fee: parseInt(fee, 10) || 0,
      mode,
      city: mode === 'online' ? null : city.trim() || null,
      skills: [],
      topics: [],
      level,
      deadline: `${deadline}T23:59:00+05:30`,
      eventDate: null,
      applicationUrl: applicationUrl.trim() || null,
      sourceUrl: sourceUrl.trim() || null,
      submitterEmail: submitterEmail.trim() || undefined,
    };

    const res = await repository.submitOpportunity(payload);
    if (res.ok) {
      setStatus({
        ok: true,
        message: 'Opportunity submitted for moderator review. Thank you for contributing.',
      });
      setTitle('');
      setDescription('');
    } else {
      setStatus({
        ok: false,
        message: res.message,
      });
    }
  };

  const mailtoSubject = encodeURIComponent('[Opportunity Submission] New student listing');
  const mailtoBody = encodeURIComponent(
    'Please include the following details in your email:\n' +
      '1. Opportunity Title:\n' +
      '2. Category (Hackathon, Internship, Workshop, Competition, Meetup):\n' +
      '3. Organizing Group / Institution:\n' +
      '4. Registration Fee (INR):\n' +
      '5. Mode (Online, Offline, Hybrid) and City:\n' +
      '6. Registration Deadline:\n' +
      '7. Official Source / Announcement Link (https://...):\n' +
      '8. Brief Description:\n'
  );
  const mailtoLink = `mailto:${contactEmail}?subject=${mailtoSubject}&body=${mailtoBody}`;

  return (
    <div className={`container ${styles.submitPage}`}>
      <Seo
        title={STATIC_PAGES.submit.title}
        description={STATIC_PAGES.submit.description}
        path={STATIC_PAGES.submit.path}
        noindex={STATIC_PAGES.submit.noindex}
      />

      <header className={styles.header}>
        <h1 className={styles.title}>{STATIC_PAGES.submit.h1}</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          Submit a student hackathon, internship, workshop or competition for review. Include the
          official source link so moderators can verify it.
        </p>
      </header>

      {isLocalSource ? (
        <div className={styles.notice}>
          <p>
            CampusPlus is currently operating with bundled demonstration data. Online form
            submissions are reviewed directly through our moderation desk email.
          </p>
          <a href={mailtoLink} className={styles.submitBtn}>
            <Mail size={16} strokeWidth={1.75} aria-hidden="true" />
            <span>Send submission by email</span>
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          {status && (
            <div
              className={`${styles.statusMessage} ${
                status.ok ? styles.statusSuccess : styles.statusError
              }`}
              role="alert"
            >
              {status.message}
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="submit-title" className={styles.label}>
              Opportunity Title
            </label>
            <input
              id="submit-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. National Student Hackathon 2026"
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="submit-category" className={styles.label}>
              Category
            </label>
            <select
              id="submit-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className={styles.select}
            >
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="submit-organizer" className={styles.label}>
              Organizer
            </label>
            <input
              id="submit-organizer"
              type="text"
              required
              value={organizer}
              onChange={(e) => setOrganizer(e.target.value)}
              placeholder="e.g. IEEE Student Branch"
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="submit-description" className={styles.label}>
              Description
            </label>
            <textarea
              id="submit-description"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of the event, eligibility, and what students will work on"
              className={styles.textarea}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="submit-fee" className={styles.label}>
              Registration Fee (INR, 0 for free)
            </label>
            <input
              id="submit-fee"
              type="number"
              min="0"
              required
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="submit-mode" className={styles.label}>
              Mode
            </label>
            <select
              id="submit-mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
              className={styles.select}
            >
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          {mode !== 'online' && (
            <div className={styles.field}>
              <label htmlFor="submit-city" className={styles.label}>
                City
              </label>
              <input
                id="submit-city"
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Delhi, Greater Noida"
                className={styles.input}
              />
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="submit-level" className={styles.label}>
              Experience level
            </label>
            <select
              id="submit-level"
              value={level}
              onChange={(e) => setLevel(e.target.value as Level)}
              className={styles.select}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="submit-deadline" className={styles.label}>
              Registration Deadline (Date)
            </label>
            <input
              id="submit-deadline"
              type="date"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="submit-source" className={styles.label}>
              Official Source URL (Required for verification, must start with https://)
            </label>
            <input
              id="submit-source"
              type="url"
              required
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="submit-appUrl" className={styles.label}>
              Official Application URL (optional, must start with https://)
            </label>
            <input
              id="submit-appUrl"
              type="url"
              value={applicationUrl}
              onChange={(e) => setApplicationUrl(e.target.value)}
              placeholder="https://..."
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="submit-email" className={styles.label}>
              Your email (optional, for follow-up questions)
            </label>
            <input
              id="submit-email"
              type="email"
              value={submitterEmail}
              onChange={(e) => setSubmitterEmail(e.target.value)}
              placeholder="your.email@example.com"
              className={styles.input}
            />
          </div>

          <button type="submit" className={styles.submitBtn}>
            <Send size={16} strokeWidth={1.75} aria-hidden="true" />
            <span>Submit opportunity for review</span>
          </button>
        </form>
      )}
    </div>
  );
}
export default Submit;
