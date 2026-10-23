import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const opportunities = sqliteTable('opportunities', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  organizer: text('organizer').notNull(),
  description: text('description').notNull(),
  benefits: text('benefits').notNull(), // JSON string
  fee: integer('fee').notNull(),
  additionalCostsNote: text('additional_costs_note'),
  travelInfo: text('travel_info').notNull(),
  mode: text('mode').notNull(),
  city: text('city'),
  skills: text('skills').notNull(), // JSON string
  topics: text('topics').notNull(), // JSON string
  level: text('level').notNull(),
  eligibility: text('eligibility').notNull(), // JSON string
  deadline: text('deadline').notNull(),
  eventDate: text('event_date'),
  applicationUrl: text('application_url'),
  sourceUrl: text('source_url'),
  verification: text('verification').notNull(),
  lastCheckedAt: text('last_checked_at'),
  isDemo: integer('is_demo', { mode: 'boolean' }).notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  removedAt: text('removed_at'),
});

export const reports = sqliteTable('reports', {
  id: text('id').primaryKey(),
  opportunityId: text('opportunity_id')
    .notNull()
    .references(() => opportunities.id),
  reason: text('reason').notNull(),
  details: text('details'),
  contactEmail: text('contact_email'),
  status: text('status').notNull().default('open'), // 'open' | 'reviewed' | 'dismissed'
  createdAt: text('created_at').notNull(),
});

export const submissions = sqliteTable('submissions', {
  id: text('id').primaryKey(),
  data: text('data').notNull(), // JSON string of submitted fields
  submitterEmail: text('submitter_email'),
  status: text('status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
  createdAt: text('created_at').notNull(),
  reviewedAt: text('reviewed_at'),
});

export type OpportunityRecord = typeof opportunities.$inferSelect;
export type InsertOpportunityRecord = typeof opportunities.$inferInsert;
export type ReportRecord = typeof reports.$inferSelect;
export type InsertReportRecord = typeof reports.$inferInsert;
export type SubmissionRecord = typeof submissions.$inferSelect;
export type InsertSubmissionRecord = typeof submissions.$inferInsert;
