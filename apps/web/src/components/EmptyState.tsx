import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper} aria-hidden="true">
        {icon || <Search size={24} strokeWidth={1.75} />}
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {action && (
        <>
          {action.href ? (
            <a href={action.href} className={styles.actionBtn}>
              {action.label}
            </a>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className={styles.actionBtn}
            >
              {action.label}
            </button>
          )}
        </>
      )}
    </div>
  );
}
