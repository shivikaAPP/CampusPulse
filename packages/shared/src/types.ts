export type Category = 'hackathon' | 'internship' | 'workshop' | 'competition' | 'meetup';
export type Mode = 'online' | 'offline' | 'hybrid';
export type Level = 'beginner' | 'intermediate' | 'advanced';
export type Verification = 'verified' | 'community' | 'unverified';
export type TravelInfo = 'required' | 'not_required' | 'unknown';

export interface Eligibility {
  minYear: number | null;            // year of study, 1 to 5
  maxYear: number | null;
  allowedColleges: string[] | null;  // null means open to all colleges
  manualChecks: string[];            // requirements the app cannot compare, shown as "Confirm on the official page"
}

export interface Opportunity {
  id: string;
  title: string;
  category: Category;
  organizer: string;
  description: string;
  benefits: string[];
  fee: number;                       // INR whole rupees, 0 means free
  additionalCostsNote: string | null;
  travelInfo: TravelInfo;
  mode: Mode;
  city: string | null;               // null for online
  skills: string[];                  // slugs from vocab.ts, skills the listing needs or uses
  topics: string[];                  // slugs from vocab.ts
  level: Level;
  eligibility: Eligibility;
  deadline: string;                  // ISO 8601 with offset, for example 2026-11-20T23:59:00+05:30
  eventDate: string | null;          // YYYY-MM-DD
  applicationUrl: string | null;     // official link supplied by the source, never invented
  sourceUrl: string | null;
  verification: Verification;
  lastCheckedAt: string | null;      // ISO 8601
  isDemo: boolean;
  createdAt: string;                 // ISO 8601
}

export interface Profile {
  displayName: string;
  college: string;
  city: string;
  year: number | null;               // 1 to 5
  skills: string[];
  interests: string[];               // topic slugs
  level: Level | null;
  preferredMode: 'online' | 'offline' | 'any' | null;
  maxBudget: number | null;          // INR, 0 means free only, null means not set
}
