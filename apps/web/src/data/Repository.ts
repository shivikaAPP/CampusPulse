import type { Opportunity, ReportInput, SubmissionInput } from '@campusplus/shared';

export interface Repository {
  listOpportunities(): Promise<Opportunity[]>;
  getOpportunity(id: string): Promise<Opportunity | null>;
  submitReport(input: ReportInput): Promise<{ ok: true } | { ok: false; message: string }>;
  submitOpportunity(input: SubmissionInput): Promise<{ ok: true } | { ok: false; message: string }>;
}
