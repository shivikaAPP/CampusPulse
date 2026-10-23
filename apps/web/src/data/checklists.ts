import type { Category, Mode } from '@campusplus/shared';

export interface ChecklistItem {
  id: string;
  text: string;
  source: 'suggested' | 'organizer';
}

export function getChecklistItems(
  category: Category,
  mode: Mode,
  manualChecks: string[] = []
): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  // Organizer manual checks first if present
  manualChecks.forEach((check, index) => {
    items.push({
      id: `manual-${index}`,
      text: check,
      source: 'organizer',
    });
  });

  // Suggested category templates
  if (category === 'internship') {
    items.push(
      { id: 'internship-review-jd', text: 'Review the job description', source: 'suggested' },
      { id: 'internship-check-eligibility', text: 'Check eligibility', source: 'suggested' },
      { id: 'internship-update-resume', text: 'Update your resume', source: 'suggested' },
      { id: 'internship-prep-docs', text: 'Prepare requested documents', source: 'suggested' },
      { id: 'internship-open-official', text: 'Open the official application page', source: 'suggested' },
      { id: 'internship-mark-applied', text: 'Mark as applied after you apply', source: 'suggested' }
    );
  } else if (category === 'hackathon') {
    items.push(
      { id: 'hackathon-review-theme', text: 'Review theme and rules', source: 'suggested' },
      { id: 'hackathon-check-team', text: 'Check team requirements', source: 'suggested' },
      { id: 'hackathon-list-skills', text: 'List the skills and tools you need', source: 'suggested' },
      { id: 'hackathon-prep-idea', text: 'Prepare a project idea', source: 'suggested' },
      { id: 'hackathon-register', text: 'Complete official registration', source: 'suggested' },
      { id: 'hackathon-track-status', text: 'Track your registration status', source: 'suggested' }
    );
  } else if (category === 'workshop') {
    items.push(
      { id: 'workshop-check-venue', text: 'Check venue and date', source: 'suggested' },
      { id: 'workshop-confirm-fee', text: 'Confirm the registration fee', source: 'suggested' },
      { id: 'workshop-review-materials', text: 'Review required materials', source: 'suggested' }
    );
    if (mode === 'offline' || mode === 'hybrid') {
      items.push({ id: 'workshop-plan-travel', text: 'Plan travel if needed', source: 'suggested' });
    }
    items.push(
      { id: 'workshop-register', text: 'Complete registration', source: 'suggested' },
      { id: 'workshop-keep-upcoming', text: 'Keep the event in your upcoming list', source: 'suggested' }
    );
  } else {
    // competition and meetup
    items.push(
      { id: `${category}-review-rules`, text: 'Review rules or agenda', source: 'suggested' },
      { id: `${category}-check-eligibility`, text: 'Check eligibility', source: 'suggested' },
      { id: `${category}-confirm-fee-date`, text: 'Confirm fee and date', source: 'suggested' },
      { id: `${category}-complete-registration`, text: 'Complete registration', source: 'suggested' },
      { id: `${category}-mark-applied`, text: 'Mark as applied', source: 'suggested' }
    );
  }

  return items;
}
