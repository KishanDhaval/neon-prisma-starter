const { prisma } = require('../src/db');

async function seed() {
  console.log('🌱 Seeding database...');

  await prisma.user.deleteMany();

  await prisma.user.createMany({
    data: [
      { name: 'Alice Johnson',  email: 'alice@example.com',  password: 'hashed_password_1' },
      { name: 'Bob Smith',      email: 'bob@example.com',    password: 'hashed_password_2' },
      { name: 'Charlie Brown',  email: 'charlie@example.com',password: 'hashed_password_3' },
    ],
  });

  console.log('✅ Database seeded with 3 users');
}

seed()
  .catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
