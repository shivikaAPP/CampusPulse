import type { Opportunity, Profile } from './types.js';
import { isExpired, formatDaysLeft } from './deadline.js';
import { computeMatch, isProfileEmpty, type MatchResult } from './score.js';
import { checkEligibility } from './eligibility.js';

export interface ShortlistItem {
  opportunity: Opportunity;
  match: MatchResult | null;
  reason: string;
}

export interface ShortlistResult {
  items: ShortlistItem[];
  note: string | null;
}

export function getShortlist(
  opportunities: Opportunity[],
  profile: Profile,
  now: Date,
  excludedIds: Set<string>
): ShortlistResult {
  const profileEmpty = isProfileEmpty(profile);

  // Filter out expired and excluded listings
  const validOpportunities = opportunities.filter((opp) => {
    if (isExpired(opp, now)) return false;
    if (excludedIds.has(opp.id)) return false;
    return true;
  });

  if (profileEmpty) {
    // Empty profile: sort by nearest deadline among non-expired listings
    const sorted = [...validOpportunities].sort((a, b) => {
      const diffA = new Date(a.deadline).getTime() - now.getTime();
      const diffB = new Date(b.deadline).getTime() - now.getTime();
      if (diffA !== diffB) return diffA - diffB;
      return a.id.localeCompare(b.id);
    });

    const items: ShortlistItem[] = sorted.slice(0, 5).map((opp) => ({
      opportunity: opp,
      match: null,
      reason: formatDaysLeft(opp, now),
    }));

    return {
      items,
      note: 'Complete your profile to see tailored recommendations with match scores.',
    };
  }

  // Profile not empty
  const candidates: {
    opp: Opportunity;
    match: MatchResult;
    reason: string;
  }[] = [];

  for (const opp of validOpportunities) {
    // Check eligibility
    const elResult = checkEligibility(profile, opp);
    if (elResult.status === 'likely_not_eligible') {
      continue;
    }

    // Check budget
    if (profile.maxBudget !== null && opp.fee > profile.maxBudget) {
      continue;
    }

    const match = computeMatch(profile, opp);
    const deadlineReason = formatDaysLeft(opp, now);
    const topFactor = match.factors.reduce((best, f) => (f.points / f.max > best.points / best.max ? f : best), match.factors[0]);
    const reason = `${topFactor.reason}. ${deadlineReason}.`;

    candidates.push({
      opp,
      match,
      reason,
    });
  }

  // Sort by match total descending, then by nearest deadline, then by id
  candidates.sort((a, b) => {
    if (b.match.total !== a.match.total) {
      return b.match.total - a.match.total;
    }
    const diffA = new Date(a.opp.deadline).getTime() - now.getTime();
    const diffB = new Date(b.opp.deadline).getTime() - now.getTime();
    if (diffA !== diffB) {
      return diffA - diffB;
    }
    return a.opp.id.localeCompare(b.opp.id);
  });

  const topItems = candidates.slice(0, 5).map((c) => ({
    opportunity: c.opp,
    match: c.match,
    reason: c.reason,
  }));

  let note: string | null = null;
  if (topItems.length < 3) {
    note = 'Fewer than 3 listings fit your profile right now';
  }

  return {
    items: topItems,
    note,
  };
}
