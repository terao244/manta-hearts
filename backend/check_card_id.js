const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCardId() {
  try {
    // クラブの2を検索
    const twoOfClubs = await prisma.card.findFirst({
      where: {
        suit: 'CLUBS',
        rank: 'TWO'
      }
    });
    
    console.log('クラブの2:', twoOfClubs);
    
    // カード28番も確認
    const card28 = await prisma.card.findUnique({
      where: { id: 28 }
    });
    
    console.log('カード28:', card28);
    
    // クラブのカードすべてを確認
    const clubCards = await prisma.card.findMany({
      where: { suit: 'CLUBS' },
      orderBy: { sortOrder: 'asc' }
    });
    
    console.log('クラブのカード:', clubCards.map(c => `ID:${c.id} ${c.rank} (sortOrder:${c.sortOrder})`));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCardId();