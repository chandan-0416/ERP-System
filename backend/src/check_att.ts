import { prisma } from './config/db';

async function check() {
  const now = new Date();
  const noon = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0, 0));
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

  console.log('Noon:', noon.toISOString());
  console.log('Start:', start.toISOString());
  console.log('End:', end.toISOString());
  console.log('Is start <= noon <= end?', start <= noon && noon <= end);
}

check().catch(console.error).finally(() => prisma.$disconnect());
