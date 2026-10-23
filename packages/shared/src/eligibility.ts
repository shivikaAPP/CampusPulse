import type { Opportunity, Profile } from './types.js';

export type EligibilityStatus = 'eligible' | 'possibly_eligible' | 'likely_not_eligible';

export interface EligibilityResult {
  status: EligibilityStatus;
  statusLabel: string;
  reasons: string[];
  needsInfo: string[];
  manualChecks: string[];
}

export function checkEligibility(profile: Profile, opportunity: Opportunity): EligibilityResult {
  const failedRequirements: string[] = [];
  const needsInfo: string[] = [];
  const el = opportunity.eligibility;

  // 1. Year check
  const hasYearReq = el.minYear !== null || el.maxYear !== null;
  if (hasYearReq) {
    if (profile.year === null) {
      needsInfo.push('Year of study not set in profile');
    } else {
      if (el.minYear !== null && profile.year < el.minYear) {
        failedRequirements.push(`Requires at least year ${el.minYear} of study (your profile indicates year ${profile.year})`);
      } else if (el.maxYear !== null && profile.year > el.maxYear) {
        failedRequirements.push(`Requires at most year ${el.maxYear} of study (your profile indicates year ${profile.year})`);
      }
    }
  }

  // 2. College check
  if (el.allowedColleges !== null && el.allowedColleges.length > 0) {
    const userCollege = profile.college.trim().toLowerCase();
    if (!userCollege) {
      needsInfo.push('College name not set in profile');
    } else {
      const allowed = el.allowedColleges.map((c) => c.trim().toLowerCase());
      if (!allowed.includes(userCollege)) {
        failedRequirements.push(`Open only to students from specified colleges: ${el.allowedColleges.join(', ')}`);
      }
    }
  }

  // Determine status
  if (failedRequirements.length > 0) {
    return {
      status: 'likely_not_eligible',
      statusLabel: 'Likely not eligible, a stated requirement is not met',
      reasons: failedRequirements,
      needsInfo,
      manualChecks: el.manualChecks,
    };
  }

  if (needsInfo.length > 0) {
    return {
      status: 'possibly_eligible',
      statusLabel: 'Possibly eligible, more information needed',
      reasons: [],
      needsInfo,
      manualChecks: el.manualChecks,
    };
  }

  return {
    status: 'eligible',
    statusLabel: 'Eligible based on provided information',
    reasons: ['Meets all stated eligibility criteria'],
    needsInfo: [],
    manualChecks: el.manualChecks,
  };
}
