import { prisma } from './db';

async function seedTestData() {
  try {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        firebaseUid: 'test-user-1',
        email: 'test@churnistic.com',
        displayName: 'Test User',
      },
    });
    console.log('✅ Created test user:', user);

    // Create a test company
    const company = await prisma.company.create({
      data: {
        name: 'Acme Corp',
        industry: 'Technology',
        size: '11-50',
        website: 'https://acme.example.com',
      },
    });
    console.log('✅ Created test company:', company);

    // Create some test customers
    const customers = await Promise.all([
      prisma.customer.create({
        data: {
          companyId: company.id,
          email: 'customer1@example.com',
          name: 'John Doe',
          status: 'active',
          lastActive: new Date(),
        },
      }),
      prisma.customer.create({
        data: {
          companyId: company.id,
          email: 'customer2@example.com',
          name: 'Jane Smith',
          status: 'at_risk',
          lastActive: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        },
      }),
      prisma.customer.create({
        data: {
          companyId: company.id,
          email: 'customer3@example.com',
          name: 'Bob Wilson',
          status: 'churned',
          lastActive: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
          churnedAt: new Date(),
        },
      }),
    ]);
    console.log('✅ Created test customers:', customers);

    console.log('✅ All test data created successfully!');
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestData(); 