import { z } from 'zod';
import { SKILLS, TOPICS } from './vocab.js';

const validSkillSlugs = new Set(SKILLS.map((s) => s.slug));
const validTopicSlugs = new Set(TOPICS.map((t) => t.slug));

export const CategorySchema = z.enum(['hackathon', 'internship', 'workshop', 'competition', 'meetup']);
export const ModeSchema = z.enum(['online', 'offline', 'hybrid']);
export const LevelSchema = z.enum(['beginner', 'intermediate', 'advanced']);
export const VerificationSchema = z.enum(['verified', 'community', 'unverified']);
export const TravelInfoSchema = z.enum(['required', 'not_required', 'unknown']);

export const EligibilitySchema = z.object({
  minYear: z.number().int().min(1).max(5).nullable(),
  maxYear: z.number().int().min(1).max(5).nullable(),
  allowedColleges: z.array(z.string()).nullable(),
  manualChecks: z.array(z.string()),
}).strict();

export const BaseOpportunityObject = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  category: CategorySchema,
  organizer: z.string().min(1),
  description: z.string().min(1),
  benefits: z.array(z.string()),
  fee: z.number().int().min(0),
  additionalCostsNote: z.string().nullable(),
  travelInfo: TravelInfoSchema,
  mode: ModeSchema,
  city: z.string().nullable(),
  skills: z.array(z.string()).refine((arr) => arr.every((s) => validSkillSlugs.has(s)), {
    message: 'All skills must be valid slugs from vocabulary',
  }),
  topics: z.array(z.string()).refine((arr) => arr.every((t) => validTopicSlugs.has(t)), {
    message: 'All topics must be valid slugs from vocabulary',
  }),
  level: LevelSchema,
  eligibility: EligibilitySchema,
  deadline: z.string().refine((val) => !isNaN(Date.parse(val)) && /[+-]\d{2}:\d{2}$|Z$/.test(val), {
    message: 'Deadline must be valid ISO 8601 date with timezone offset',
  }),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  applicationUrl: z.string().url().startsWith('https://').nullable(),
  sourceUrl: z.string().url().startsWith('https://').nullable(),
  verification: VerificationSchema,
  lastCheckedAt: z.string().nullable(),
  isDemo: z.boolean(),
  createdAt: z.string(),
}).strict();

export const OpportunitySchema = BaseOpportunityObject.superRefine((data, ctx) => {
  // mode === 'online' implies city === null
  if (data.mode === 'online' && data.city !== null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'City must be null when mode is online',
      path: ['city'],
    });
  }
  // mode === 'offline' | 'hybrid' requires city
  if ((data.mode === 'offline' || data.mode === 'hybrid') && (!data.city || data.city.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'City is required when mode is offline or hybrid',
      path: ['city'],
    });
  }
  // verification === 'verified' requires sourceUrl and lastCheckedAt
  if (data.verification === 'verified') {
    if (!data.sourceUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Verified listings must have a sourceUrl',
        path: ['sourceUrl'],
      });
    }
    if (!data.lastCheckedAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Verified listings must have a lastCheckedAt date',
        path: ['lastCheckedAt'],
      });
    }
  }
  // isDemo === true implies verification !== 'verified', applicationUrl === null, sourceUrl === null, lastCheckedAt === null
  if (data.isDemo) {
    if (data.verification === 'verified') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Demo listing cannot be marked verified',
        path: ['verification'],
      });
    }
    if (data.applicationUrl !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Demo listing cannot have an applicationUrl',
        path: ['applicationUrl'],
      });
    }
    if (data.sourceUrl !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Demo listing cannot have a sourceUrl',
        path: ['sourceUrl'],
      });
    }
    if (data.lastCheckedAt !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Demo listing cannot have lastCheckedAt',
        path: ['lastCheckedAt'],
      });
    }
  }
});

export const ProfileSchema = z.object({
  displayName: z.string(),
  college: z.string(),
  city: z.string(),
  year: z.number().int().min(1).max(5).nullable(),
  skills: z.array(z.string()),
  interests: z.array(z.string()),
  level: LevelSchema.nullable(),
  preferredMode: z.enum(['online', 'offline', 'any']).nullable(),
  maxBudget: z.number().int().min(0).nullable(),
}).strict();

export const ReportInputSchema = z.object({
  opportunityId: z.string().min(1),
  reason: z.enum(['expired', 'looks_fake', 'wrong_details', 'broken_link', 'other']),
  details: z.string().max(500).optional(),
  contactEmail: z.string().email().optional(),
  website: z.string().optional(), // Honeypot field
}).strict();

export const SubmissionInputSchema = z.object({
  title: z.string().min(1),
  category: CategorySchema,
  organizer: z.string().min(1),
  description: z.string().min(1),
  fee: z.number().int().min(0),
  mode: ModeSchema,
  city: z.string().nullable(),
  skills: z.array(z.string()).refine((arr) => arr.every((s) => validSkillSlugs.has(s)), {
    message: 'All skills must be valid slugs from vocabulary',
  }),
  topics: z.array(z.string()).refine((arr) => arr.every((t) => validTopicSlugs.has(t)), {
    message: 'All topics must be valid slugs from vocabulary',
  }),
  level: LevelSchema,
  deadline: z.string().refine((val) => !isNaN(Date.parse(val)) && /[+-]\d{2}:\d{2}$|Z$/.test(val), {
    message: 'Deadline must be valid ISO 8601 date with timezone offset',
  }),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  applicationUrl: z.string().url().startsWith('https://').nullable().optional(),
  sourceUrl: z.string().url().startsWith('https://').nullable().optional(),
  submitterEmail: z.string().email().optional(),
  website: z.string().optional(), // Honeypot field
}).strict();

export const AdminLoginSchema = z.object({
  password: z.string().min(1),
}).strict();

export const AdminUpdateReportSchema = z.object({
  status: z.enum(['reviewed', 'dismissed']),
}).strict();

export const CreateOpportunitySchema = BaseOpportunityObject.omit({
  createdAt: true,
}).extend({
  id: z.string().regex(/^[a-z0-9-]+$/).optional(),
});

export const UpdateOpportunitySchema = BaseOpportunityObject.partial().omit({
  id: true,
  createdAt: true,
}).strict();

export type ReportInput = z.infer<typeof ReportInputSchema>;
export type SubmissionInput = z.infer<typeof SubmissionInputSchema>;
export type CreateOpportunityInput = z.infer<typeof CreateOpportunitySchema>;
export type UpdateOpportunityInput = z.infer<typeof UpdateOpportunitySchema>;
