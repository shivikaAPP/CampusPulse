import { describe, it, expect } from 'vitest';
import { computeMatch } from './score.js';
import type { Opportunity, Profile } from './types.js';

const baseOpp: Opportunity = {
  id: 'test-opp',
  title: 'Test Opportunity',
  category: 'hackathon',
  organizer: 'Test Org',
  description: 'Test Description',
  benefits: ['Certificate'],
  fee: 0,
  additionalCostsNote: null,
  travelInfo: 'not_required',
  mode: 'online',
  city: null,
  skills: ['python', 'react'],
  topics: ['ai-ml', 'web-development'],
  level: 'intermediate',
  eligibility: {
    minYear: null,
    maxYear: null,
    allowedColleges: null,
    manualChecks: [],
  },
  deadline: '2026-11-20T23:59:00+05:30',
  eventDate: '2026-11-25',
  applicationUrl: 'https://example.com/apply',
  sourceUrl: 'https://example.com',
  verification: 'verified',
  lastCheckedAt: '2026-10-20T10:00:00+05:30',
  isDemo: false,
  createdAt: '2026-10-20T10:00:00+05:30',
};

const baseProfile: Profile = {
  displayName: 'Student',
  college: 'Test College',
  city: 'Delhi',
  year: 2,
  skills: ['python', 'react'],
  interests: ['ai-ml', 'web-development'],
  level: 'intermediate',
  preferredMode: 'online',
  maxBudget: 500,
};

describe('computeMatch', () => {
  it('computes exact points for a full match', () => {
    // skills: 2/2 overlap -> 30
    // interests: 2 overlap -> 25
    // budget: fee 0 -> 20
    // location: online + online mode -> 15
    // experience: intermediate + intermediate (diff 0) -> 10
    // Total: 30 + 25 + 20 + 15 + 10 = 100
    const res = computeMatch(baseProfile, baseOpp);
    expect(res.total).toBe(100);
    expect(res.label).toBe('Strong');
    expect(res.estimated).toBe(false);
  });

  it('gives identical results on identical calls (deterministic)', () => {
    const res1 = computeMatch(baseProfile, baseOpp);
    const res2 = computeMatch(baseProfile, baseOpp);
    expect(res1).toEqual(res2);
  });

  it('calculates neutral points when profile is empty of skills and interests', () => {
    const emptyProfile: Profile = {
      ...baseProfile,
      skills: [],
      interests: [],
      level: null,
      preferredMode: null,
      city: '',
      maxBudget: null,
    };
    const paidOpp: Opportunity = { ...baseOpp, fee: 100 };
    const res = computeMatch(emptyProfile, paidOpp);
    // skills: 15 (neutral)
    // interests: 12 (neutral)
    // budget: 10 (neutral)
    // location: 8 (neutral)
    // experience: 5 (neutral)
    // Total: 15 + 12 + 10 + 8 + 5 = 50
    expect(res.total).toBe(50);
    expect(res.label).toBe('Fair');
    expect(res.estimated).toBe(true);
  });

  it('gives same location points for online listing regardless of profile city', () => {
    const profDelhi: Profile = { ...baseProfile, city: 'Delhi', preferredMode: 'online' };
    const profBengaluru: Profile = { ...baseProfile, city: 'Bengaluru', preferredMode: 'online' };
    const resDelhi = computeMatch(profDelhi, baseOpp);
    const resBengaluru = computeMatch(profBengaluru, baseOpp);

    const locDelhi = resDelhi.factors.find((f) => f.factor === 'location');
    const locBengaluru = resBengaluru.factors.find((f) => f.factor === 'location');
    expect(locDelhi?.points).toBe(locBengaluru?.points);
    expect(locDelhi?.points).toBe(15);
  });

  it('gives 0 budget points when maxBudget is 0 and listing is paid', () => {
    const zeroBudgetProfile: Profile = { ...baseProfile, maxBudget: 0 };
    const paidOpp: Opportunity = { ...baseOpp, fee: 499 };
    const res = computeMatch(zeroBudgetProfile, paidOpp);
    const budgetFactor = res.factors.find((f) => f.factor === 'budget');
    expect(budgetFactor?.points).toBe(0);
  });
});
