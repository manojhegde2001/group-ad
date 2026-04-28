import { PrismaClient, UserType, VerificationStatus, PostType, EventStatus, AccountVisibility } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  console.log('🧹 Cleaning database...');
  await prisma.postLike.deleteMany();
  await prisma.postComment.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.boardPost.deleteMany();
  await prisma.board.deleteMany();
  await prisma.post.deleteMany();
  await prisma.eventEnrollment.deleteMany();
  await prisma.event.deleteMany();
  await prisma.userTypeChangeRequest.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.connection.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();
  await prisma.category.deleteMany();
  console.log('✅ Database cleaned.');

  // ============================================================================
  // 1. CREATE CATEGORIES
  // ============================================================================

  const categories = [
    { name: 'Technology', slug: 'technology', icon: '💻', description: 'Software, IT, and tech companies' },
    { name: 'Healthcare', slug: 'healthcare', icon: '🏥', description: 'Medical and healthcare services' },
    { name: 'Finance', slug: 'finance', icon: '💰', description: 'Banking, insurance, and financial services' },
    { name: 'Education', slug: 'education', icon: '📚', description: 'Educational institutions and e-learning' },
    { name: 'Real Estate', slug: 'real-estate', icon: '🏠', description: 'Property and real estate' },
    { name: 'Manufacturing', slug: 'manufacturing', icon: '🏭', description: 'Production and manufacturing' },
    { name: 'Retail', slug: 'retail', icon: '🛍️', description: 'Retail and e-commerce' },
    { name: 'Marketing', slug: 'marketing', icon: '📈', description: 'Advertising and marketing services' },
    { name: 'Renewable Energy', slug: 'renewable-energy', icon: '⚡', description: 'Green energy and sustainability' },
    { name: 'Food & Beverage', slug: 'food-beverage', icon: '🍽️', description: 'Restaurants and food services' },
  ];

  const createdCategories = [];
  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    createdCategories.push(category);
    console.log(`✅ Category created: ${category.name}`);
  }

  // ============================================================================
  // 2. CREATE ADMIN USER
  // ============================================================================

  const adminPassword = await bcrypt.hash('Admin@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@groupad.com' },
    update: {},
    create: {
      email: 'admin@groupad.com',
      password: adminPassword,
      name: 'Admin User',
      username: 'admin',
      userType: UserType.ADMIN,
      verificationStatus: VerificationStatus.VERIFIED,
      verifiedAt: new Date(),
      isProfileCompleted: true,
      profileCompletedAt: new Date(),
      categoryId: createdCategories[0].id, // Technology
      bio: 'Platform administrator with full access to manage users, events, and content.',
      location: 'Bengaluru, Karnataka',
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // ============================================================================
  // 3. CREATE SAMPLE COMPANIES
  // ============================================================================

  const companies = [
    {
      name: 'Tech Innovations Pvt Ltd',
      slug: 'tech-innovations',
      industry: 'Technology',
      description: 'Leading software development and IT consulting company',
      location: 'Bengaluru, Karnataka',
      website: 'https://techinnovations.example.com',
      gstNumber: '29ABCDE1234F1Z5',
      isVerified: true,
      verifiedAt: new Date(),
    },
    {
      name: 'HealthCare Solutions',
      slug: 'healthcare-solutions',
      industry: 'Healthcare',
      description: 'Healthcare technology and medical equipment provider',
      location: 'Mumbai, Maharashtra',
      website: 'https://healthcaresolutions.example.com',
      gstNumber: '27ABCDE5678G2Z1',
      isVerified: true,
      verifiedAt: new Date(),
    },
    {
      name: 'Green Energy Corp',
      slug: 'green-energy-corp',
      industry: 'Renewable Energy',
      description: 'Solar and renewable energy solutions',
      location: 'Pune, Maharashtra',
      website: 'https://greenenergy.example.com',
      gstNumber: '27ABCDE9012H3Z2',
      isVerified: false,
    },
  ];

  const createdCompanies = [];
  for (const company of companies) {
    const createdCompany = await prisma.company.upsert({
      where: { slug: company.slug },
      update: {},
      create: company,
    });
    createdCompanies.push(createdCompany);
    console.log(`✅ Company created: ${createdCompany.name}`);
  }

  // ============================================================================
  // 4. CREATE BUSINESS USERS (Verified & Unverified)
  // ============================================================================

  const businessUsers = [
    {
      email: 'john@techinnovations.com',
      password: await bcrypt.hash('Password@123', 10),
      name: 'John Doe',
      username: 'johndoe',
      userType: UserType.BUSINESS,
      verificationStatus: VerificationStatus.VERIFIED,
      verifiedAt: new Date(),
      companyId: createdCompanies[0].id,
      categoryId: createdCategories[0].id, // Technology
      bio: 'Tech entrepreneur and software architect',
      location: 'Bengaluru, Karnataka',
      phone: '+91 98765 43210',
      turnover: '10-50cr',
      companySize: '50-200',
      linkedin: 'https://linkedin.com/in/johndoe',
      isProfileCompleted: true,
    },
    {
      email: 'sarah@healthcaresolutions.com',
      password: await bcrypt.hash('Password@123', 10),
      name: 'Sarah Johnson',
      username: 'sarahjohnson',
      userType: UserType.BUSINESS,
      verificationStatus: VerificationStatus.VERIFIED,
      verifiedAt: new Date(),
      companyId: createdCompanies[1].id,
      categoryId: createdCategories[1].id, // Healthcare
      bio: 'Healthcare innovator and medical tech specialist',
      location: 'Mumbai, Maharashtra',
      phone: '+91 98765 43211',
      turnover: '50-100cr',
      companySize: '200-500',
      linkedin: 'https://linkedin.com/in/sarahjohnson',
      isProfileCompleted: true,
    },
    {
      email: 'mike@greenenergy.com',
      password: await bcrypt.hash('Password@123', 10),
      name: 'Mike Wilson',
      username: 'mikewilson',
      userType: UserType.BUSINESS,
      verificationStatus: VerificationStatus.PENDING,
      companyId: createdCompanies[2].id,
      categoryId: createdCategories[8].id, // Renewable Energy
      bio: 'Green energy advocate and sustainability expert',
      location: 'Pune, Maharashtra',
      phone: '+91 98765 43212',
      turnover: '5-10cr',
      companySize: '10-50',
      isProfileCompleted: true,
    },
  ];

  const createdBusinessUsers = [];
  for (const user of businessUsers) {
    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
    createdBusinessUsers.push(createdUser);
    console.log(`✅ Business user created: ${createdUser.name}`);
  }

  // ============================================================================
  // 5. CREATE INDIVIDUAL USERS
  // ============================================================================

  const individualUsers = [
    {
      email: 'alice@example.com',
      password: await bcrypt.hash('Password@123', 10),
      name: 'Alice Smith',
      username: 'alicesmith',
      userType: UserType.INDIVIDUAL,
      verificationStatus: VerificationStatus.UNVERIFIED,
      categoryId: createdCategories[7].id, // Marketing
      bio: 'Digital marketing specialist and content creator',
      location: 'Bengaluru, Karnataka',
      interests: ['Marketing', 'Social Media', 'Content Creation'],
      isProfileCompleted: true,
    },
    {
      email: 'bob@example.com',
      password: await bcrypt.hash('Password@123', 10),
      name: 'Bob Brown',
      username: 'bobbrown',
      userType: UserType.INDIVIDUAL,
      verificationStatus: VerificationStatus.UNVERIFIED,
      categoryId: createdCategories[2].id, // Finance
      bio: 'Financial analyst and investment consultant',
      location: 'Mumbai, Maharashtra',
      interests: ['Finance', 'Investment', 'Stock Market'],
      isProfileCompleted: true,
    },
  ];

  const createdIndividualUsers = [];
  for (const user of individualUsers) {
    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
    createdIndividualUsers.push(createdUser);
    console.log(`✅ Individual user created: ${createdUser.name}`);
  }

  // ============================================================================
  // 6. CREATE SAMPLE POSTS (DISABLED)
  // ============================================================================
/*
  const posts = [
    {
      type: PostType.TEXT,
      content: 'Excited to announce our new AI-powered analytics platform! 🚀 #TechInnovation #AI',
      tags: ['AI', 'Analytics', 'Technology'],
      categoryId: createdCategories[0].id, // Technology
      visibility: AccountVisibility.PUBLIC,
      userId: createdBusinessUsers[0].id,
      companyId: createdCompanies[0].id,
      views: 150,
      likes: 25,
      shares: 5,
    },
    {
      type: PostType.TEXT,
      content: 'Launching our telemedicine platform next month. Healthcare is going digital! 💊📱',
      tags: ['Healthcare', 'Telemedicine', 'Digital Health'],
      categoryId: createdCategories[1].id, // Healthcare
      visibility: AccountVisibility.PUBLIC,
      userId: createdBusinessUsers[1].id,
      companyId: createdCompanies[1].id,
      views: 200,
      likes: 40,
      shares: 10,
    },
    {
      type: PostType.TEXT,
      content: 'Solar energy adoption is growing rapidly in India. Join the green revolution! ☀️🌱',
      tags: ['Solar', 'Renewable Energy', 'Sustainability'],
      categoryId: createdCategories[8].id, // Renewable Energy
      visibility: AccountVisibility.PUBLIC,
      userId: createdBusinessUsers[2].id,
      companyId: createdCompanies[2].id,
      views: 80,
      likes: 15,
      shares: 3,
    },
    {
      type: PostType.TEXT,
      content: 'Top 5 digital marketing trends for 2026. Check out my latest blog post!',
      tags: ['Marketing', 'Digital Marketing', 'Trends'],
      categoryId: createdCategories[7].id, // Marketing
      visibility: AccountVisibility.PUBLIC,
      userId: createdIndividualUsers[0].id,
      views: 50,
      likes: 8,
      shares: 2,
    },
  ];

  for (const post of posts) {
    await prisma.post.create({
      data: post,
    });
  }
  console.log('✅ Sample posts created');
*/

  // ============================================================================
  // 7. CREATE SAMPLE EVENTS
  // ============================================================================

  const events = [
    {
      title: 'Tech Summit 2026',
      slug: 'tech-summit-2026',
      description: 'Annual technology conference featuring industry leaders and innovative startups. Join us for a full day of keynotes, workshops, and networking sessions focused on the future of AI, cloud computing, and digital transformation.',
      eventType: 'CONFERENCE',
      categoryId: createdCategories[0].id, // Technology
      startDate: new Date('2026-05-20T09:00:00'),
      endDate: new Date('2026-05-20T17:00:00'),
      timezone: 'Asia/Kolkata',
      isOnline: false,
      venue: 'Bengaluru International Convention Centre',
      city: 'Bengaluru',
      state: 'Karnataka',
      maxAttendees: 500,
      currentAttendees: 0,
      visibility: AccountVisibility.PUBLIC,
      status: EventStatus.PUBLISHED,
      organizerId: createdBusinessUsers[0].id,
      companyId: createdCompanies[0].id,
      targetUserTypes: ['INDIVIDUAL', 'BUSINESS'],
      targetCategoryIds: [createdCategories[0].id],
    },
    {
      title: 'Healthcare Innovation Webinar',
      slug: 'healthcare-innovation-webinar',
      description: 'Online webinar discussing latest trends in healthcare technology and telemedicine',
      eventType: 'WEBINAR',
      categoryId: createdCategories[1].id, // Healthcare
      startDate: new Date('2026-06-10T15:00:00'),
      endDate: new Date('2026-06-10T16:30:00'),
      timezone: 'Asia/Kolkata',
      isOnline: true,
      meetingLink: 'https://meet.example.com/healthcare-webinar',
      maxAttendees: 1000,
      currentAttendees: 0,
      visibility: AccountVisibility.PUBLIC,
      status: EventStatus.PUBLISHED,
      organizerId: createdBusinessUsers[1].id,
      companyId: createdCompanies[1].id,
      targetUserTypes: ['BUSINESS'],
      targetCategoryIds: [createdCategories[1].id],
      targetTurnoverRange: '10-50cr',
    },
    {
      title: 'Renewable Energy Workshop',
      slug: 'renewable-energy-workshop',
      description: 'Hands-on workshop on solar panel installation and maintenance',
      eventType: 'WORKSHOP',
      categoryId: createdCategories[8].id, // Renewable Energy
      startDate: new Date('2026-07-10T10:00:00'),
      endDate: new Date('2026-07-10T16:00:00'),
      timezone: 'Asia/Kolkata',
      isOnline: false,
      venue: 'Pune Energy Center',
      city: 'Pune',
      state: 'Maharashtra',
      maxAttendees: 50,
      currentAttendees: 0,
      visibility: AccountVisibility.PUBLIC,
      status: EventStatus.PUBLISHED,
      organizerId: admin.id,
      targetUserTypes: ['INDIVIDUAL', 'BUSINESS'],
      targetCategoryIds: [createdCategories[8].id],
    },
  ];

  for (const event of events) {
    await prisma.event.upsert({
      where: { slug: event.slug },
      update: {},
      create: event,
    });
  }
  console.log('✅ Sample events created');

  // ============================================================================
  // 8. SUMMARY
  // ============================================================================

  console.log('\n🎉 Database seeding completed!\n');
  console.log('📊 Summary:');
  console.log(`   • 10 Categories`);
  console.log(`   • 1 Admin user`);
  console.log(`   • 3 Companies (2 verified, 1 pending)`);
  console.log(`   • 3 Business users (2 verified, 1 pending)`);
  console.log(`   • 2 Individual users`);
  console.log(`   • 0 Sample posts`);
  console.log(`   • 3 Sample events`);
  console.log('\n🔑 Login Credentials:');
  console.log('   Admin:');
  console.log('   • Email: admin@groupad.com');
  console.log('   • Password: Admin@123\n');
  console.log('   Business Users:');
  console.log('   • Email: john@techinnovations.com | Password: Password@123');
  console.log('   • Email: sarah@healthcaresolutions.com | Password: Password@123');
  console.log('   • Email: mike@greenenergy.com | Password: Password@123\n');
  console.log('   Individual Users:');
  console.log('   • Email: alice@example.com | Password: Password@123');
  console.log('   • Email: bob@example.com | Password: Password@123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });