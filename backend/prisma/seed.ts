import { PrismaClient, Suit, Rank } from '@prisma/client';

const prisma = new PrismaClient();

// カードの定義
const SUITS: { value: Suit; name: string }[] = [
  { value: 'CLUBS', name: 'クラブ' },
  { value: 'DIAMONDS', name: 'ダイヤ' },
  { value: 'HEARTS', name: 'ハート' },
  { value: 'SPADES', name: 'スペード' },
];

const RANKS: {
  value: Rank;
  name: string;
  shortName: string;
  sortOrder: number;
}[] = [
  { value: 'TWO', name: '2', shortName: '2', sortOrder: 0 },
  { value: 'THREE', name: '3', shortName: '3', sortOrder: 1 },
  { value: 'FOUR', name: '4', shortName: '4', sortOrder: 2 },
  { value: 'FIVE', name: '5', shortName: '5', sortOrder: 3 },
  { value: 'SIX', name: '6', shortName: '6', sortOrder: 4 },
  { value: 'SEVEN', name: '7', shortName: '7', sortOrder: 5 },
  { value: 'EIGHT', name: '8', shortName: '8', sortOrder: 6 },
  { value: 'NINE', name: '9', shortName: '9', sortOrder: 7 },
  { value: 'TEN', name: '10', shortName: 'T', sortOrder: 8 },
  { value: 'JACK', name: 'ジャック', shortName: 'J', sortOrder: 9 },
  { value: 'QUEEN', name: 'クイーン', shortName: 'Q', sortOrder: 10 },
  { value: 'KING', name: 'キング', shortName: 'K', sortOrder: 11 },
  { value: 'ACE', name: 'エース', shortName: 'A', sortOrder: 12 },
];

// スート略記号
const SUIT_CODES: Record<Suit, string> = {
  CLUBS: 'C',
  DIAMONDS: 'D',
  HEARTS: 'H',
  SPADES: 'S',
};

async function main() {
  console.log('Starting database seed...');

  // プレイヤーの作成
  console.log('Creating players...');
  await prisma.player.createMany({
    data: [
      {
        name: 'プレイヤー1',
        displayName: 'プレイヤー1',
        displayOrder: 1,
        isActive: true,
      },
      {
        name: 'プレイヤー2',
        displayName: 'プレイヤー2',
        displayOrder: 2,
        isActive: true,
      },
      {
        name: 'プレイヤー3',
        displayName: 'プレイヤー3',
        displayOrder: 3,
        isActive: true,
      },
      {
        name: 'プレイヤー4',
        displayName: 'プレイヤー4',
        displayOrder: 4,
        isActive: true,
      },
    ],
  });

  // カードの作成
  console.log('Creating cards...');
  const cards = [];
  let sortOrder = 0;

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      // ポイント値の計算
      let pointValue = 0;
      if (suit.value === 'HEARTS') {
        pointValue = 1; // ハートは1点
      } else if (suit.value === 'SPADES' && rank.value === 'QUEEN') {
        pointValue = 13; // スペードのクイーンは13点
      }

      const code = `${rank.shortName}${SUIT_CODES[suit.value]}`;

      cards.push({
        suit: suit.value,
        rank: rank.value,
        code,
        pointValue,
        sortOrder: sortOrder++,
      });
    }
  }

  await prisma.card.createMany({
    data: cards,
  });

  // 各プレイヤーの統計データを初期化
  console.log('Creating player statistics...');
  const players = await prisma.player.findMany();

  for (const player of players) {
    await prisma.playerStatistics.create({
      data: {
        playerId: player.id,
      },
    });
  }

  console.log('Database seed completed successfully!');

  // 作成されたデータの確認
  const playerCount = await prisma.player.count();
  const cardCount = await prisma.card.count();

  console.log(`Created ${playerCount} players`);
  console.log(`Created ${cardCount} cards`);
}

main()
  .catch(e => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
