/**
 * One-off backfill: populates Post.imageMeta (per-image { w, h }, index-aligned
 * with Post.images) for posts created before dimensions were captured at upload.
 *
 * Run:  npx tsx scripts/backfill-image-dimensions.ts [--dry-run] [--limit=N]
 *
 * Safe to re-run — only posts whose imageMeta is still null are touched, and it
 * never mutates storage (it only reads image bytes to measure them).
 */
import { loadEnvFile } from 'node:process';
import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';

// Load a local env file when running from a dev checkout; in deployed
// environments the variables are already present in process.env.
for (const file of ['.env', '.env.local']) {
  try {
    loadEnvFile(file);
  } catch {
    /* file absent — try the next / fall back to the ambient environment */
  }
}

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1]) || Infinity;
const CONCURRENCY = 8;

type MetaEntry = { w: number; h: number } | null;

const isVideo = (src: string) =>
  src.includes('/video/upload/') || /\.(mp4|mov|avi|webm|mkv)/i.test(src);

async function measure(url: string): Promise<MetaEntry> {
  if (!url || isVideo(url)) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`  fetch ${res.status} for ${url}`);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const { width, height } = await sharp(buf).metadata();
    return width && height ? { w: width, h: height } : null;
  } catch (err) {
    console.warn(`  failed ${url}:`, (err as Error).message);
    return null;
  }
}

async function run() {
  const posts = await prisma.post.findMany({
    where: { NOT: { images: { isEmpty: true } } },
    select: { id: true, images: true, imageMeta: true },
    orderBy: { createdAt: 'desc' },
  });

  // Skip posts already backfilled (imageMeta present and length-aligned).
  const pending = posts.filter(
    (p) => !Array.isArray(p.imageMeta) || p.imageMeta.length !== p.images.length
  );
  const target = pending.slice(0, LIMIT === Infinity ? undefined : LIMIT);
  console.log(`${target.length} post(s) to backfill${DRY_RUN ? ' (dry run)' : ''}`);

  let done = 0;
  for (let i = 0; i < target.length; i += CONCURRENCY) {
    const batch = target.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (post) => {
        const imageMeta = await Promise.all(post.images.map(measure));
        done++;
        const summary = imageMeta.map((m) => (m ? `${m.w}x${m.h}` : 'null')).join(', ');
        console.log(`[${done}/${target.length}] ${post.id} → [${summary}]`);
        if (!DRY_RUN) {
          await prisma.post.update({ where: { id: post.id }, data: { imageMeta } });
        }
      })
    );
  }

  console.log('Done.');
}

run()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
