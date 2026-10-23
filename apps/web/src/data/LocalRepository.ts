import type { Opportunity, ReportInput, SubmissionInput } from '@campusplus/shared';
import type { Repository } from './Repository.js';

export class LocalRepository implements Repository {
  private cache: Opportunity[] | null = null;

  async listOpportunities(): Promise<Opportunity[]> {
    if (this.cache) {
      return this.cache;
    }

    const [demoModule, realModule] = await Promise.all([
      import('./listings.demo.json'),
      import('./listings.real.json'),
    ]);

    const demoListings: Opportunity[] = (demoModule.default || demoModule) as Opportunity[];
    const realListings: Opportunity[] = (realModule.default || realModule) as Opportunity[];

    // Merge demo and real listings
    this.cache = [...realListings, ...demoListings];
    return this.cache;
  }

  async getOpportunity(id: string): Promise<Opportunity | null> {
    const list = await this.listOpportunities();
    return list.find((item) => item.id === id) || null;
  }

  async submitReport(_input: ReportInput): Promise<{ ok: true } | { ok: false; message: string }> {
    return {
      ok: false,
      message: 'Local repository does not support direct report submission. Use email reporting.',
    };
  }

  async submitOpportunity(_input: SubmissionInput): Promise<{ ok: true } | { ok: false; message: string }> {
    return {
      ok: false,
      message: 'Local repository does not support online submissions.',
    };
  }
}
