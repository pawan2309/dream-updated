import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSampleMatches() {
  try {
    console.log('Creating sample live matches...');
    
    // Create sample live matches
    const sampleMatches = [
      {
        title: 'India vs Australia - 1st T20I',
        externalId: 'IND_AUS_T20_001',
        gameId: 'cricket_t20_001',
        tournament: 'T20 International Series',
        startTime: new Date(),
        isLive: true,
        marketId: 'market_001',
        section: [
          { name: 'Match Winner', odds: { home: 1.85, away: 2.10 } },
          { name: 'Total Runs', odds: { over: 1.75, under: 2.05 } }
        ],
        status: 'LIVE'
      },
      {
        title: 'England vs South Africa - 2nd ODI',
        externalId: 'ENG_SA_ODI_002',
        gameId: 'cricket_odi_002',
        tournament: 'ODI Series',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        isLive: true,
        marketId: 'market_002',
        section: [
          { name: 'Match Winner', odds: { home: 1.95, away: 1.90 } },
          { name: 'Top Batsman', odds: { player1: 3.50, player2: 4.20 } }
        ],
        status: 'LIVE'
      },
      {
        title: 'Pakistan vs New Zealand - 3rd Test',
        externalId: 'PAK_NZ_TEST_003',
        gameId: 'cricket_test_003',
        tournament: 'Test Series',
        startTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        isLive: true,
        marketId: 'market_003',
        section: [
          { name: 'Match Winner', odds: { home: 2.15, away: 1.75 } },
          { name: 'Total Wickets', odds: { over: 1.60, under: 2.30 } }
        ],
        status: 'LIVE'
      }
    ];

    for (const matchData of sampleMatches) {
      // Check if match already exists
      const existingMatch = await prisma.match.findUnique({
        where: { externalId: matchData.externalId }
      });

      if (existingMatch) {
        console.log(`✅ Match already exists: ${matchData.title}`);
      } else {
        const match = await prisma.match.create({
          data: matchData
        });
        console.log(`✅ Created match: ${matchData.title}`);
      }
    }

    console.log('Sample matches created successfully!');
    
    // Verify live matches
    const liveMatches = await prisma.match.findMany({
      where: { isLive: true }
    });
    
    console.log(`📊 Total live matches in database: ${liveMatches.length}`);
    liveMatches.forEach(match => {
      console.log(`   - ${match.title} (${match.status})`);
    });

  } catch (error) {
    console.error('Error creating sample matches:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleMatches(); 