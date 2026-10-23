import type { Opportunity, Profile } from './types.js';

export interface FactorResult {
  factor: 'skills' | 'interests' | 'budget' | 'location' | 'experience';
  points: number;
  max: number;
  reason: string;
  neutral: boolean;
}

export interface MatchResult {
  total: number;
  label: 'Strong' | 'Good' | 'Fair' | 'Low';
  factors: FactorResult[];
  summary: string;
  estimated: boolean;
}

export function isProfileEmpty(profile: Profile): boolean {
  return profile.skills.length === 0 && profile.interests.length === 0;
}

const LEVEL_MAP = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

export function computeMatch(profile: Profile, opportunity: Opportunity): MatchResult {
  const factors: FactorResult[] = [];

  // 1. Skills (30)
  if (profile.skills.length === 0) {
    factors.push({
      factor: 'skills',
      points: 15,
      max: 30,
      reason: 'No skills listed in profile',
      neutral: true,
    });
  } else if (opportunity.skills.length === 0) {
    factors.push({
      factor: 'skills',
      points: 30,
      max: 30,
      reason: 'No specific skills required',
      neutral: false,
    });
  } else {
    const userSkills = new Set(profile.skills.map((s) => s.toLowerCase()));
    const overlap = opportunity.skills.filter((s) => userSkills.has(s.toLowerCase())).length;
    const points = Math.round((30 * overlap) / opportunity.skills.length);
    factors.push({
      factor: 'skills',
      points,
      max: 30,
      reason: `Matches ${overlap} of ${opportunity.skills.length} skills for this listing`,
      neutral: false,
    });
  }

  // 2. Interests (25)
  if (profile.interests.length === 0) {
    factors.push({
      factor: 'interests',
      points: 12,
      max: 25,
      reason: 'No interests listed in profile',
      neutral: true,
    });
  } else if (opportunity.topics.length === 0) {
    factors.push({
      factor: 'interests',
      points: 12,
      max: 25,
      reason: 'No topics listed for listing',
      neutral: true,
    });
  } else {
    const userTopics = new Set(profile.interests.map((t) => t.toLowerCase()));
    const overlap = opportunity.topics.filter((t) => userTopics.has(t.toLowerCase())).length;
    let points = 0;
    let reason = 'Does not match your listed interests';
    if (overlap === 1) {
      points = 18;
      reason = 'Matches 1 topic of interest';
    } else if (overlap >= 2) {
      points = 25;
      reason = `Matches ${overlap} topics of interest`;
    }
    factors.push({
      factor: 'interests',
      points,
      max: 25,
      reason,
      neutral: false,
    });
  }

  // 3. Budget (20)
  if (opportunity.fee === 0) {
    factors.push({
      factor: 'budget',
      points: 20,
      max: 20,
      reason: 'Free, within your budget',
      neutral: false,
    });
  } else if (profile.maxBudget === null) {
    factors.push({
      factor: 'budget',
      points: 10,
      max: 20,
      reason: `Fee is ₹${opportunity.fee}, budget not specified in profile`,
      neutral: true,
    });
  } else if (opportunity.fee <= profile.maxBudget) {
    factors.push({
      factor: 'budget',
      points: 20,
      max: 20,
      reason: `Fee ₹${opportunity.fee} is within your budget of ₹${profile.maxBudget}`,
      neutral: false,
    });
  } else {
    factors.push({
      factor: 'budget',
      points: 0,
      max: 20,
      reason: `Fee ₹${opportunity.fee} exceeds your budget of ₹${profile.maxBudget}`,
      neutral: false,
    });
  }

  // 4. Location and mode (15)
  const profileCity = profile.city.trim().toLowerCase();
  const oppCity = (opportunity.city ?? '').trim().toLowerCase();
  const hasProfileLocation = Boolean(profile.preferredMode || profileCity);

  if (!hasProfileLocation) {
    factors.push({
      factor: 'location',
      points: 8,
      max: 15,
      reason: 'Location and mode preference not set in profile',
      neutral: true,
    });
  } else if (opportunity.mode === 'online') {
    const points =
      profile.preferredMode === 'online' || profile.preferredMode === 'any' ? 15 : 8;
    factors.push({
      factor: 'location',
      points,
      max: 15,
      reason: 'Held online, so distance does not matter',
      neutral: false,
    });
  } else if (opportunity.mode === 'offline') {
    const isCityMatch = profileCity.length > 0 && oppCity === profileCity;
    if (isCityMatch) {
      const points = profile.preferredMode === 'online' ? 9 : 15;
      factors.push({
        factor: 'location',
        points,
        max: 15,
        reason: `Held offline in your city (${opportunity.city})`,
        neutral: false,
      });
    } else {
      factors.push({
        factor: 'location',
        points: 0,
        max: 15,
        reason: `Held offline in ${opportunity.city}, outside your city`,
        neutral: false,
      });
    }
  } else {
    // hybrid
    const isCityMatch = profileCity.length > 0 && oppCity === profileCity;
    if (isCityMatch) {
      factors.push({
        factor: 'location',
        points: 15,
        max: 15,
        reason: `Hybrid event in your city (${opportunity.city})`,
        neutral: false,
      });
    } else {
      factors.push({
        factor: 'location',
        points: 10,
        max: 15,
        reason: `Hybrid event in ${opportunity.city}, can join online`,
        neutral: false,
      });
    }
  }

  // 5. Experience (10)
  if (profile.level === null) {
    factors.push({
      factor: 'experience',
      points: 5,
      max: 10,
      reason: 'Experience level not set in profile',
      neutral: true,
    });
  } else {
    const profileLvl = LEVEL_MAP[profile.level];
    const listingLvl = LEVEL_MAP[opportunity.level];
    const diff = listingLvl - profileLvl;

    let points = 5;
    let reason = 'Two levels below your experience';
    if (diff === 0) {
      points = 10;
      reason = 'Matches your experience level';
    } else if (diff === 1) {
      points = 5;
      reason = 'One level above your experience';
    } else if (diff === 2) {
      points = 0;
      reason = 'Two levels above your experience';
    } else if (diff === -1) {
      points = 7;
      reason = 'One level below your experience';
    } else if (diff === -2) {
      points = 5;
      reason = 'Two levels below your experience';
    }

    factors.push({
      factor: 'experience',
      points,
      max: 10,
      reason,
      neutral: false,
    });
  }

  const total = factors.reduce((sum, f) => sum + f.points, 0);

  let label: MatchResult['label'] = 'Low';
  if (total >= 80) label = 'Strong';
  else if (total >= 60) label = 'Good';
  else if (total >= 40) label = 'Fair';

  const estimated = factors.some((f) => f.neutral);

  // Generate summary by finding the top 2 factors by percentage score
  const sortedFactors = [...factors].sort((a, b) => {
    const ratioA = a.points / a.max;
    const ratioB = b.points / b.max;
    return ratioB - ratioA;
  });

  const factorSnippets: Record<FactorResult['factor'], string> = {
    skills: 'fits your skills',
    interests: 'matches your interests',
    budget: opportunity.fee === 0 ? 'is free' : 'is within your budget',
    location: opportunity.mode === 'online' ? 'is online' : 'matches your location',
    experience: 'matches your experience level',
  };

  const top1 = sortedFactors[0];
  const top2 = sortedFactors[1];
  const snippet1 = factorSnippets[top1.factor];
  const snippet2 = factorSnippets[top2.factor];

  const summary = `${label} match because it ${snippet1} and ${snippet2}.`;

  return {
    total,
    label,
    factors,
    summary,
    estimated,
  };
}
