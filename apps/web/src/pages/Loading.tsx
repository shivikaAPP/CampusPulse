import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, Circle, ArrowRight, UserCheck } from 'lucide-react';
import { Seo } from '../seo/Seo.js';
import { STATIC_PAGES } from '../seo/pages.js';
import styles from './Loading.module.css';

interface LoadingStage {
  label: string;
  durationMs: number;
}

const STAGES: LoadingStage[] = [
  { label: 'Connecting to opportunities repository', durationMs: 600 },
  { label: 'Filtering verified college listings and deadlines', durationMs: 800 },
  { label: 'Calculating match scores from your profile', durationMs: 700 },
  { label: 'Dashboard ready', durationMs: 400 },
];

export function Loading() {
  const [currentStage, setCurrentStage] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentStage >= STAGES.length - 1) {
      return;
    }
    const timer = setTimeout(() => {
      setCurrentStage((prev) => Math.min(prev + 1, STAGES.length - 1));
    }, STAGES[currentStage].durationMs);

    return () => clearTimeout(timer);
  }, [currentStage]);

  const progressPercent = Math.round(((currentStage + 1) / STAGES.length) * 100);
  const isComplete = currentStage === STAGES.length - 1;

  return (
    <div className={`container ${styles.loadingPage}`}>
      <Seo
        title={STATIC_PAGES.loading.title}
        description={STATIC_PAGES.loading.description}
        path={STATIC_PAGES.loading.path}
        noindex={STATIC_PAGES.loading.noindex}
      />

      <div className={styles.centerBox}>
        <div className={styles.logoWrapper} aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            width="36"
            height="36"
            aria-hidden="true"
          >
            <rect width="32" height="32" rx="6" fill="#22D3EE" />
            <path
              d="M18.5 10.6A7 7 0 1 0 18.5 21.4"
              fill="none"
              stroke="#0B1020"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M24.5 13.5v5M22 16h5"
              fill="none"
              stroke="#0B1020"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h1 className={styles.title}>{STATIC_PAGES.loading.h1}</h1>
        <p className={styles.description}>
          Preparing verified hackathons, internships, and workshops for your profile.
        </p>

        <div className={styles.progressContainer}>
          <div
            className={styles.progressBarBg}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Loading progress"
          >
            <div
              className={styles.progressBarFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <ul className={styles.stageList}>
            {STAGES.map((stage, idx) => {
              const isPast = idx < currentStage;
              const isCurrent = idx === currentStage;

              return (
                <li
                  key={stage.label}
                  className={`${styles.stageItem} ${
                    isPast || (isComplete && idx === STAGES.length - 1)
                      ? styles.stageComplete
                      : isCurrent
                      ? styles.stageActive
                      : ''
                  }`}
                >
                  <span className={styles.stageBullet} aria-hidden="true">
                    {isPast || (isComplete && idx === STAGES.length - 1) ? (
                      <CheckCircle2 size={16} strokeWidth={2.5} style={{ color: 'var(--success)' }} />
                    ) : isCurrent ? (
                      <Loader2 size={16} strokeWidth={2} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Circle size={14} strokeWidth={1.5} style={{ color: 'var(--border)' }} />
                    )}
                  </span>
                  <span>{stage.label}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className={styles.skeletonSection} aria-hidden="true">
          <div className={styles.skeletonHeader}>
            <div className={styles.skeletonBadge} />
            <div className={styles.skeletonDate} />
          </div>
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonSub} />
          <div className={styles.skeletonTags}>
            <div className={styles.skeletonTag} />
            <div className={styles.skeletonTag} />
            <div className={styles.skeletonTag} />
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => navigate('/explore')}
            className={styles.actionButton}
          >
            <span>Browse opportunities</span>
            <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
          </button>

          <Link to="/login" className={styles.secondaryButton}>
            <UserCheck size={16} strokeWidth={2} aria-hidden="true" />
            <span>Go to Student Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Loading;
