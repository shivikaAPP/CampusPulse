import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { Opportunity } from '@campusplus/shared';
import { repository } from '../data/index.js';
import styles from './ReportDialog.module.css';

interface ReportDialogProps {
  opportunity: Opportunity;
  isOpen: boolean;
  onClose: () => void;
}

export function ReportDialog({ opportunity, isOpen, onClose }: ReportDialogProps) {
  const [reason, setReason] = useState<'expired' | 'looks_fake' | 'wrong_details' | 'broken_link' | 'other'>('expired');
  const [details, setDetails] = useState('');
  const [email, setEmail] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || 'contact@campusplus.in';
  const isLocalSource = import.meta.env.VITE_DATA_SOURCE !== 'api';

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const mailtoSubject = encodeURIComponent(`[Report Listing] ${opportunity.id}: ${opportunity.title}`);
  const mailtoBody = encodeURIComponent(
    `Opportunity ID: ${opportunity.id}\nTitle: ${opportunity.title}\nReason: ${reason}\nDetails: ${details}\n`
  );
  const mailtoLink = `mailto:${contactEmail}?subject=${mailtoSubject}&body=${mailtoBody}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocalSource) {
      window.location.href = mailtoLink;
      onClose();
      return;
    }

    const res = await repository.submitReport({
      opportunityId: opportunity.id,
      reason,
      details: details.slice(0, 500) || undefined,
      contactEmail: email || undefined,
    });

    if (res.ok) {
      setStatusMsg('Report submitted. Thank you for helping keep listings accurate.');
      setTimeout(() => {
        onClose();
        setStatusMsg(null);
      }, 2000);
    } else {
      setStatusMsg(res.message);
    }
  };

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div className={styles.modal} ref={modalRef}>
        <div className={styles.header}>
          <h2 id="report-modal-title" className={styles.title}>
            Report listing
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        {statusMsg ? (
          <p className={styles.mailtoNotice}>{statusMsg}</p>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <label htmlFor="report-reason" className={styles.label}>
                Reason
              </label>
              <select
                id="report-reason"
                className={styles.select}
                value={reason}
                onChange={(e) => setReason(e.target.value as typeof reason)}
              >
                <option value="expired">Expired deadline</option>
                <option value="looks_fake">Looks inaccurate or fake</option>
                <option value="wrong_details">Wrong details or fee</option>
                <option value="broken_link">Broken source link</option>
                <option value="other">Other issue</option>
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="report-details" className={styles.label}>
                Additional notes (optional, max 500 characters)
              </label>
              <textarea
                id="report-details"
                className={styles.textarea}
                maxLength={500}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Explain what is incorrect or broken about this listing"
              />
            </div>

            {!isLocalSource && (
              <div className={styles.fieldGroup}>
                <label htmlFor="report-email" className={styles.label}>
                  Contact email (optional)
                </label>
                <input
                  id="report-email"
                  type="email"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                />
              </div>
            )}

            {isLocalSource && (
              <p className={styles.mailtoNotice}>
                CampusPlus is currently operating with local records. Submitting will open your
                email client to send this report directly to our moderation desk.
              </p>
            )}

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={onClose}
              >
                Cancel
              </button>
              <button type="submit" className={styles.submitBtn}>
                {isLocalSource ? 'Report by email' : 'Submit report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
