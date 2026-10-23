import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const distDir = 'apps/web/dist';

const requiredFiles = [
  'robots.txt',
  'sitemap.xml',
  'favicon.svg',
  'favicon.ico',
  'apple-touch-icon.png',
  'manifest.webmanifest',
  'og-image.png',
  'index.html',
];

for (const file of requiredFiles) {
  const fullPath = join(distDir, file);
  if (!existsSync(fullPath)) {
    console.error(`check-dist failed: Missing required file ${fullPath}`);
    process.exit(1);
  }
}

// Check index.html for meta description
const indexHtml = readFileSync(join(distDir, 'index.html'), 'utf8');
if (!indexHtml.includes('<meta name="description"')) {
  console.error('check-dist failed: dist/index.html is missing <meta name="description"');
  process.exit(1);
}

// Check that no file contains the literal YOUR_DOMAIN placeholder
function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      yield* walk(full);
    } else {
      yield full;
    }
  }
}

for (const file of walk(distDir)) {
  try {
    const content = readFileSync(file, 'utf8');
    if (content.includes('YOUR_DOMAIN')) {
      console.error(`check-dist failed: ${file} contains unreplaced placeholder YOUR_DOMAIN`);
      process.exit(1);
    }
  } catch {
    // Binary files (png, ico) may fail utf8 reading or ignore
  }
}

console.log('check-dist passed: all required files and assertions satisfied.');
