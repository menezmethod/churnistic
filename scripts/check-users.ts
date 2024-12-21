import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany();
    console.log('All users in database:', users);
    console.log('Total users:', users.length);
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error checking users:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkUsers(); 