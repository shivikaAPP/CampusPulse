import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { OpportunitySchema, type Opportunity } from '@campusplus/shared';
import { client, db, ensureTables } from '../db/client.js';
import { getOpportunityForAdmin, insertOpportunity } from '../db/queries.js';

export async function seedDemoListings(): Promise<number> {
  await ensureTables(client);

  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const demoPath = path.resolve(currentDir, '../../../web/src/data/listings.demo.json');

  const content = await fs.readFile(demoPath, 'utf8');
  const listings: unknown[] = JSON.parse(content);

  let insertedCount = 0;

  for (const raw of listings) {
    const parsed = OpportunitySchema.parse(raw);
    const existing = await getOpportunityForAdmin(db, parsed.id);
    if (!existing) {
      await insertOpportunity(db, parsed as Opportunity);
      insertedCount++;
    }
  }

  return insertedCount;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDemoListings()
    .then((count) => {
      console.log(`Seeding complete. Inserted ${count} new demo opportunities.`);
      client.close();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error seeding demo opportunities:', err);
      client.close();
      process.exit(1);
    });
}
