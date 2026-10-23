import type { Category, Mode } from '@campusplus/shared';
import { getChecklistItems } from '../data/checklists.js';
import { useChecklists } from '../state/checklists.js';
import styles from './ActionPath.module.css';

interface ActionPathProps {
  opportunityId: string;
  category: Category;
  mode: Mode;
  manualChecks: string[];
}

export function ActionPath({
  opportunityId,
  category,
  mode,
  manualChecks,
}: ActionPathProps) {
  const { getCompletedTasks, toggleTask } = useChecklists();
  const completed = getCompletedTasks(opportunityId);
  const items = getChecklistItems(category, mode, manualChecks);

  const completedCount = items.filter((item) => completed.includes(item.id)).length;

  return (
    <section className={styles.container} aria-labelledby="actionpath-heading">
      <div className={styles.header}>
        <h3 id="actionpath-heading" className={styles.title}>
          Preparation checklist
        </h3>
        <span className={styles.counter}>
          {completedCount} of {items.length} completed
        </span>
      </div>

      <ul className={styles.list}>
        {items.map((item) => {
          const isDone = completed.includes(item.id);
          const inputId = `task-${opportunityId}-${item.id}`;
          return (
            <li
              key={item.id}
              className={`${styles.item} ${isDone ? styles.itemCompleted : ''}`}
            >
              <input
                id={inputId}
                type="checkbox"
                checked={isDone}
                onChange={() => toggleTask(opportunityId, item.id)}
                className={styles.checkbox}
              />
              <div className={styles.content}>
                <label
                  htmlFor={inputId}
                  className={`${styles.taskText} ${isDone ? styles.taskTextCompleted : ''}`}
                >
                  {item.text}
                </label>
                <span
                  className={`${styles.badge} ${
                    item.source === 'organizer'
                      ? styles.organizerBadge
                      : styles.suggestedBadge
                  }`}
                >
                  {item.source === 'organizer' ? 'From the organizer' : 'Suggested'}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
