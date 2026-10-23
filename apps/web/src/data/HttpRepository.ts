import type { Opportunity, ReportInput, SubmissionInput } from '@campusplus/shared';
import type { Repository } from './Repository.js';

export class HttpRepository implements Repository {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || (import.meta.env.VITE_API_URL || 'http://localhost:8787') + '/api/v1';
  }

  async listOpportunities(): Promise<Opportunity[]> {
    const res = await fetch(`${this.baseUrl}/opportunities`);
    if (!res.ok) {
      throw new Error(`Failed to load opportunities: ${res.statusText}`);
    }
    return res.json();
  }

  async getOpportunity(id: string): Promise<Opportunity | null> {
    const res = await fetch(`${this.baseUrl}/opportunities/${encodeURIComponent(id)}`);
    if (res.status === 404) {
      return null;
    }
    if (!res.ok) {
      throw new Error(`Failed to load opportunity: ${res.statusText}`);
    }
    return res.json();
  }

  async submitReport(input: ReportInput): Promise<{ ok: true } | { ok: false; message: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (res.ok) {
        return { ok: true };
      }
      const data = await res.json().catch(() => null);
      return { ok: false, message: data?.error?.message || 'Failed to submit report.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      return { ok: false, message: msg };
    }
  }

  async submitOpportunity(input: SubmissionInput): Promise<{ ok: true } | { ok: false; message: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (res.ok) {
        return { ok: true };
      }
      const data = await res.json().catch(() => null);
      return { ok: false, message: data?.error?.message || 'Failed to submit opportunity.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      return { ok: false, message: msg };
    }
  }
}
