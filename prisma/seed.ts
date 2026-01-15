import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      password: hashedPassword,
      name: 'John Doe',
      username: 'johndoe',
      category: 'Technology',
      userType: 'BUSINESS',
      companyName: 'Tech Innovations Inc',
      bio: 'CEO of Tech Innovations',
    },
  });

  await prisma.post.create({
    data: {
      type: 'IMAGE',
      content: 'Excited to announce our new product launch! 🚀',
      images: ['https://images.unsplash.com/photo-1460925895917-afdab827c52f'],
      category: 'Technology',
      tags: ['product', 'launch', 'innovation'],
      authorId: user1.id,
    },
  });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
