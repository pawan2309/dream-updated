import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateLedgerRemarks() {
  // Find all LIMIT_UPDATE ledger entries that do not have the new remark format
  const ledgers = await prisma.ledger.findMany({
    where: {
      collection: 'LIMIT_UPDATE',
      OR: [
        { remark: { not: { startsWith: 'Coins deposit' } } },
        { remark: { not: { startsWith: 'Coins withdraw' } } },
      ],
    },
  });

  for (const entry of ledgers) {
    // Fetch user and parent info
    const user = await prisma.user.findUnique({ where: { id: entry.userId } });
    let parentName = 'System';
    if (user?.parentId) {
      const parentUser = await prisma.user.findUnique({ where: { id: user.parentId } });
      if (parentUser) {
        parentName = `${parentUser.code || ''} ${parentUser.name || ''}`.trim();
      }
    }
    // Determine previous and new limit
    // For each entry, find the previous balanceAfter (the next entry in time)
    const nextEntry = await prisma.ledger.findFirst({
      where: {
        userId: entry.userId,
        collection: 'LIMIT_UPDATE',
        createdAt: { lt: entry.createdAt },
      },
      orderBy: { createdAt: 'desc' },
    });
    const previousLimit = nextEntry ? nextEntry.balanceAfter : 0;
    const newLimit = entry.balanceAfter;
    let remark = '';
    if (entry.credit > 0) {
      remark = `Coins deposit from ${previousLimit} to ${newLimit} updated From ${parentName}`;
    } else {
      remark = `Coins withdraw from ${previousLimit} to ${newLimit} updated From ${parentName}`;
    }
    await prisma.ledger.update({
      where: { id: entry.id },
      data: { remark },
    });
    console.log(`Updated ledger ${entry.id}: ${remark}`);
  }
  console.log('Ledger remark update complete.');
}

updateLedgerRemarks().finally(() => prisma.$disconnect()); 