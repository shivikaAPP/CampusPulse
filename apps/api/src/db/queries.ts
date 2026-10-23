import { eq, isNull, desc, asc, and } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type { Opportunity, Category, Mode, Level, Verification, TravelInfo, Eligibility } from '@campusplus/shared';
import * as schema from './schema.js';

export type AppDatabase = LibSQLDatabase<typeof schema>;

export function rowToOpportunity(row: schema.OpportunityRecord): Opportunity {
  return {
    id: row.id,
    title: row.title,
    category: row.category as Category,
    organizer: row.organizer,
    description: row.description,
    benefits: JSON.parse(row.benefits) as string[],
    fee: row.fee,
    additionalCostsNote: row.additionalCostsNote,
    travelInfo: row.travelInfo as TravelInfo,
    mode: row.mode as Mode,
    city: row.city,
    skills: JSON.parse(row.skills) as string[],
    topics: JSON.parse(row.topics) as string[],
    level: row.level as Level,
    eligibility: JSON.parse(row.eligibility) as Eligibility,
    deadline: row.deadline,
    eventDate: row.eventDate,
    applicationUrl: row.applicationUrl,
    sourceUrl: row.sourceUrl,
    verification: row.verification as Verification,
    lastCheckedAt: row.lastCheckedAt,
    isDemo: Boolean(row.isDemo),
    createdAt: row.createdAt,
  };
}

export function opportunityToRow(opp: Opportunity, updatedAt = new Date().toISOString()): schema.InsertOpportunityRecord {
  return {
    id: opp.id,
    title: opp.title,
    category: opp.category,
    organizer: opp.organizer,
    description: opp.description,
    benefits: JSON.stringify(opp.benefits),
    fee: opp.fee,
    additionalCostsNote: opp.additionalCostsNote,
    travelInfo: opp.travelInfo,
    mode: opp.mode,
    city: opp.city,
    skills: JSON.stringify(opp.skills),
    topics: JSON.stringify(opp.topics),
    level: opp.level,
    eligibility: JSON.stringify(opp.eligibility),
    deadline: opp.deadline,
    eventDate: opp.eventDate,
    applicationUrl: opp.applicationUrl,
    sourceUrl: opp.sourceUrl,
    verification: opp.verification,
    lastCheckedAt: opp.lastCheckedAt,
    isDemo: opp.isDemo,
    createdAt: opp.createdAt,
    updatedAt,
    removedAt: null,
  };
}

export async function listPublicOpportunities(db: AppDatabase): Promise<Opportunity[]> {
  const rows = await db
    .select()
    .from(schema.opportunities)
    .where(isNull(schema.opportunities.removedAt))
    .limit(500);

  return rows.map(rowToOpportunity);
}

export async function getPublicOpportunityById(db: AppDatabase, id: string): Promise<Opportunity | null> {
  const rows = await db
    .select()
    .from(schema.opportunities)
    .where(and(eq(schema.opportunities.id, id), isNull(schema.opportunities.removedAt)));

  return rows.length > 0 ? rowToOpportunity(rows[0]) : null;
}

export async function listOpportunitiesForAdmin(db: AppDatabase): Promise<(Opportunity & { updatedAt: string; removedAt: string | null })[]> {
  const rows = await db
    .select()
    .from(schema.opportunities)
    .orderBy(desc(schema.opportunities.createdAt));

  return rows.map((r) => ({
    ...rowToOpportunity(r),
    updatedAt: r.updatedAt,
    removedAt: r.removedAt,
  }));
}

export async function getOpportunityForAdmin(db: AppDatabase, id: string): Promise<(Opportunity & { updatedAt: string; removedAt: string | null }) | null> {
  const rows = await db
    .select()
    .from(schema.opportunities)
    .where(eq(schema.opportunities.id, id));

  return rows.length > 0
    ? {
        ...rowToOpportunity(rows[0]),
        updatedAt: rows[0].updatedAt,
        removedAt: rows[0].removedAt,
      }
    : null;
}

export async function insertOpportunity(db: AppDatabase, opp: Opportunity): Promise<void> {
  await db.insert(schema.opportunities).values(opportunityToRow(opp));
}

export async function updateOpportunity(
  db: AppDatabase,
  id: string,
  patch: Partial<Omit<Opportunity, 'id' | 'createdAt'>>
): Promise<Opportunity | null> {
  const current = await getOpportunityForAdmin(db, id);
  if (!current) return null;

  const now = new Date().toISOString();
  const updateData: Partial<schema.InsertOpportunityRecord> = {
    updatedAt: now,
  };

  if (patch.title !== undefined) updateData.title = patch.title;
  if (patch.category !== undefined) updateData.category = patch.category;
  if (patch.organizer !== undefined) updateData.organizer = patch.organizer;
  if (patch.description !== undefined) updateData.description = patch.description;
  if (patch.benefits !== undefined) updateData.benefits = JSON.stringify(patch.benefits);
  if (patch.fee !== undefined) updateData.fee = patch.fee;
  if (patch.additionalCostsNote !== undefined) updateData.additionalCostsNote = patch.additionalCostsNote;
  if (patch.travelInfo !== undefined) updateData.travelInfo = patch.travelInfo;
  if (patch.mode !== undefined) updateData.mode = patch.mode;
  if (patch.city !== undefined) updateData.city = patch.city;
  if (patch.skills !== undefined) updateData.skills = JSON.stringify(patch.skills);
  if (patch.topics !== undefined) updateData.topics = JSON.stringify(patch.topics);
  if (patch.level !== undefined) updateData.level = patch.level;
  if (patch.eligibility !== undefined) updateData.eligibility = JSON.stringify(patch.eligibility);
  if (patch.deadline !== undefined) updateData.deadline = patch.deadline;
  if (patch.eventDate !== undefined) updateData.eventDate = patch.eventDate;
  if (patch.applicationUrl !== undefined) updateData.applicationUrl = patch.applicationUrl;
  if (patch.sourceUrl !== undefined) updateData.sourceUrl = patch.sourceUrl;
  if (patch.verification !== undefined) updateData.verification = patch.verification;
  if (patch.lastCheckedAt !== undefined) updateData.lastCheckedAt = patch.lastCheckedAt;
  if (patch.isDemo !== undefined) updateData.isDemo = patch.isDemo;

  await db
    .update(schema.opportunities)
    .set(updateData)
    .where(eq(schema.opportunities.id, id));

  const updated = await getOpportunityForAdmin(db, id);
  return updated;
}

export async function softDeleteOpportunity(db: AppDatabase, id: string): Promise<boolean> {
  const now = new Date().toISOString();
  const res = await db
    .update(schema.opportunities)
    .set({ removedAt: now, updatedAt: now })
    .where(eq(schema.opportunities.id, id));

  return (res.rowsAffected ?? 0) > 0;
}

export async function insertReport(
  db: AppDatabase,
  report: {
    id: string;
    opportunityId: string;
    reason: string;
    details?: string;
    contactEmail?: string;
  }
): Promise<void> {
  await db.insert(schema.reports).values({
    id: report.id,
    opportunityId: report.opportunityId,
    reason: report.reason,
    details: report.details || null,
    contactEmail: report.contactEmail || null,
    status: 'open',
    createdAt: new Date().toISOString(),
  });
}

export async function listReportsForAdmin(db: AppDatabase): Promise<schema.ReportRecord[]> {
  return db
    .select()
    .from(schema.reports)
    .orderBy(
      // Open reports first
      asc(schema.reports.status),
      desc(schema.reports.createdAt)
    );
}

export async function updateReportStatus(
  db: AppDatabase,
  id: string,
  status: 'reviewed' | 'dismissed'
): Promise<boolean> {
  const res = await db
    .update(schema.reports)
    .set({ status })
    .where(eq(schema.reports.id, id));

  return (res.rowsAffected ?? 0) > 0;
}

export async function insertSubmission(
  db: AppDatabase,
  submission: {
    id: string;
    data: string;
    submitterEmail?: string;
  }
): Promise<void> {
  await db.insert(schema.submissions).values({
    id: submission.id,
    data: submission.data,
    submitterEmail: submission.submitterEmail || null,
    status: 'pending',
    createdAt: new Date().toISOString(),
    reviewedAt: null,
  });
}

export async function getSubmissionById(db: AppDatabase, id: string): Promise<schema.SubmissionRecord | null> {
  const rows = await db
    .select()
    .from(schema.submissions)
    .where(eq(schema.submissions.id, id));

  return rows.length > 0 ? rows[0] : null;
}

export async function listSubmissionsForAdmin(db: AppDatabase): Promise<schema.SubmissionRecord[]> {
  return db
    .select()
    .from(schema.submissions)
    .orderBy(
      // Pending first
      asc(schema.submissions.status),
      desc(schema.submissions.createdAt)
    );
}

export async function updateSubmissionStatus(
  db: AppDatabase,
  id: string,
  status: 'approved' | 'rejected'
): Promise<boolean> {
  const now = new Date().toISOString();
  const res = await db
    .update(schema.submissions)
    .set({ status, reviewedAt: now })
    .where(eq(schema.submissions.id, id));

  return (res.rowsAffected ?? 0) > 0;
}
