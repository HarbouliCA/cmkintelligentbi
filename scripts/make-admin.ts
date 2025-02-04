const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.update({
    where: { email: 'TaniaRegidot@PLENYABEAUTYCMK.onmicrosoft.com' },
    data: { 
      role: 'ADMIN',
      emailVerified: new Date() // Set email as verified
    },
  });
  console.log('Updated user:', user);
  await prisma.$disconnect();
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
