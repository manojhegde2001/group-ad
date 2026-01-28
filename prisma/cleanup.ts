// Quick cleanup script - Run this to clear existing data before seeding
// Save as: prisma/cleanup.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 Cleaning up database...');

  // Delete in correct order (respecting foreign keys)
  await prisma.eventEnrollment.deleteMany({});
  console.log('✅ Deleted all event enrollments');

  await prisma.event.deleteMany({});
  console.log('✅ Deleted all events');

  await prisma.post.deleteMany({});
  console.log('✅ Deleted all posts');

  await prisma.userTypeChangeRequest.deleteMany({});
  console.log('✅ Deleted all user type change requests');

  await prisma.user.deleteMany({});
  console.log('✅ Deleted all users');

  await prisma.company.deleteMany({});
  console.log('✅ Deleted all companies');

  await prisma.category.deleteMany({});
  console.log('✅ Deleted all categories');

  console.log('\n🎉 Database cleaned successfully!');
  console.log('Now run: npx prisma db seed');
}

cleanup()
  .catch((e) => {
    console.error('❌ Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });