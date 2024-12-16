import { prisma } from './db';

async function verifyData() {
  try {
    const users = await prisma.user.findMany();
    console.log('\n📊 Users:', users);

    const companies = await prisma.company.findMany();
    console.log('\n📊 Companies:', companies);

    const customers = await prisma.customer.findMany();
    console.log('\n📊 Customers:', customers);

    console.log('\n✅ Data verification complete!');
  } catch (error) {
    console.error('❌ Error verifying data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyData(); 