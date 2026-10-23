import type { Opportunity, Verification } from './types.js';

export function isExpired(opp: Pick<Opportunity, 'deadline'>, now: Date): boolean {
  return now.getTime() > new Date(opp.deadline).getTime();
}

export function daysLeft(opp: Pick<Opportunity, 'deadline'>, now: Date): number {
  const diff = new Date(opp.deadline).getTime() - now.getTime();
  return Math.ceil(diff / 86400000);
}

export function formatDaysLeft(opp: Pick<Opportunity, 'deadline'>, now: Date): string {
  if (isExpired(opp, now)) {
    return 'Closed';
  }
  const days = daysLeft(opp, now);
  if (days <= 0) {
    return 'Closes today';
  }
  if (days === 1) {
    return 'Closes in 1 day';
  }
  return `Closes in ${days} days`;
}

export function isClosingSoon(opp: Pick<Opportunity, 'deadline'>, now: Date): boolean {
  if (isExpired(opp, now)) return false;
  const diff = new Date(opp.deadline).getTime() - now.getTime();
  return diff <= 3 * 86400000;
}

export function inDeadlineRescue(opp: Pick<Opportunity, 'deadline'>, now: Date): boolean {
  if (isExpired(opp, now)) return false;
  const diff = new Date(opp.deadline).getTime() - now.getTime();
  return diff <= 7 * 86400000;
}

export function displayVerification(
  opp: Pick<Opportunity, 'deadline' | 'verification'>,
  now: Date
): Verification | 'expired' {
  if (isExpired(opp, now)) {
    return 'expired';
  }
  return opp.verification;
}

export function formatISTDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatISTDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
