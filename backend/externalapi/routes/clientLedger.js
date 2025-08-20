const express = require('express');
const router = express.Router();
const jwtAuth = require('../../shared/middleware/jwtAuth');
const database = require('../utils/database');

// GET /api/client-ledger/:userId - Get client ledger data (exactly like the frontend image)
router.get('/:userId', jwtAuth(), async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.userId;

    // Users can only view their own ledger
    if (userId !== requestingUserId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    console.log('🔍 [CLIENT_LEDGER] Fetching ledger for user:', userId);

    // Get all settled bets for this user
    const settledBets = await database.findMany('Bet', { 
      userId: userId,
      status: { in: ['WON', 'LOST'] }
    });

    // Get user's current credit limit
    const user = await database.findOne('User', { id: userId });
    const creditLimit = user.creditLimit || 0;

    // Calculate ledger summary (exactly like the frontend image)
    const totalCredit = settledBets.reduce((sum, bet) => sum + (bet.wonAmount || 0), 0);
    const totalDebit = settledBets.reduce((sum, bet) => sum + (bet.lostAmount || 0), 0);
    const netProfit = totalCredit - totalDebit;

    // Format ledger entries (exactly like the frontend image)
    const ledgerEntries = settledBets.map(bet => {
      // Get match details
      const match = bet.match; // This will be populated by the relation
      
      return {
        id: bet.id,
        matchName: match ? `${match.title} - ${match.startTime ? new Date(match.startTime).toLocaleDateString('en-GB') + ' ' + new Date(match.startTime).toLocaleTimeString('en-GB', { hour12: true }) : 'N/A'}` : 'Unknown Match',
        wonBy: bet.result || 'Unknown',
        won: bet.status === 'WON' ? bet.wonAmount : 0,
        lost: bet.status === 'LOST' ? bet.lostAmount : 0,
        balance: bet.status === 'WON' ? 
          bet.wonAmount : 
          -bet.lostAmount,
        matchId: bet.matchId,
        betId: bet.id,
        settledAt: bet.settledAt,
        odds: bet.odds,
        stake: bet.stake,
        selectionName: bet.selectionName,
        marketName: bet.marketName
      };
    });

    // Sort by settlement date (most recent first)
    ledgerEntries.sort((a, b) => new Date(b.settledAt) - new Date(a.settledAt));

    // Calculate running balance for each entry
    let runningBalance = 0;
    for (let i = ledgerEntries.length - 1; i >= 0; i--) {
      const entry = ledgerEntries[i];
      if (entry.won > 0) {
        runningBalance += entry.won;
      } else if (entry.lost > 0) {
        runningBalance -= entry.lost;
      }
      entry.balance = runningBalance;
    }

    // Format response exactly like the frontend image
    const response = {
      success: true,
      data: {
        // Summary section (like the purple section in the image)
        summary: {
          credit: totalCredit,
          debit: totalDebit,
          profitLoss: netProfit,
          creditLimit: creditLimit
        },
        
        // Ledger entries (like the table in the image)
        ledger: ledgerEntries,
        
        // Metadata
        totalEntries: ledgerEntries.length,
        wonBets: settledBets.filter(b => b.status === 'WON').length,
        lostBets: settledBets.filter(b => b.status === 'LOST').length
      }
    };

    console.log('✅ [CLIENT_LEDGER] Ledger data prepared:', {
      userId: userId,
      totalEntries: ledgerEntries.length,
      totalCredit: totalCredit,
      totalDebit: totalDebit,
      netProfit: netProfit
    });

    res.json(response);

  } catch (error) {
    console.error('❌ [CLIENT_LEDGER] Error fetching ledger:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client ledger',
      details: error.message
    });
  }
});

// GET /api/client-ledger/:userId/summary - Get just the summary (credit, debit, P/L)
router.get('/:userId/summary', jwtAuth(), async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.userId;

    // Users can only view their own ledger summary
    if (userId !== requestingUserId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Get all settled bets for this user
    const settledBets = await database.findMany('Bet', { 
      userId: userId,
      status: { in: ['WON', 'LOST'] }
    });

    // Get user's current credit limit
    const user = await database.findOne('User', { id: userId });
    const creditLimit = user.creditLimit || 0;

    // Calculate summary
    const totalCredit = settledBets.reduce((sum, bet) => sum + (bet.wonAmount || 0), 0);
    const totalDebit = settledBets.filter(b => b.status === 'LOST').reduce((sum, bet) => sum + bet.stake, 0);
    const netProfit = totalCredit - totalDebit;

    res.json({
      success: true,
      data: {
        credit: totalCredit,
        debit: totalDebit,
        profitLoss: netProfit,
        creditLimit: creditLimit,
        totalBets: settledBets.length,
        wonBets: settledBets.filter(b => b.status === 'WON').length,
        lostBets: settledBets.filter(b => b.status === 'LOST').length
      }
    });

  } catch (error) {
    console.error('❌ [CLIENT_LEDGER] Error fetching summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ledger summary',
      details: error.message
    });
  }
});

// GET /api/client-ledger/:userId/export - Export ledger data for download
router.get('/:userId/export', jwtAuth(), async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.userId;

    // Users can only export their own ledger
    if (userId !== requestingUserId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Get all settled bets for this user
    const settledBets = await database.findMany('Bet', { 
      userId: userId,
      status: { in: ['WON', 'LOST'] }
    });

    // Format for CSV export
    const csvData = settledBets.map(bet => ({
      'Bet ID': bet.id,
      'Match': bet.match?.title || 'Unknown',
      'Date': bet.settledAt ? new Date(bet.settledAt).toLocaleDateString() : 'N/A',
      'Selection': bet.selectionName || 'N/A',
      'Odds': bet.odds,
      'Stake': bet.stake,
      'Result': bet.result || 'N/A',
      'Won': bet.status === 'WON' ? bet.wonAmount : 0,
      'Lost': bet.status === 'LOST' ? bet.lostAmount : 0,
      'Status': bet.status
    }));

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="ledger_${userId}_${new Date().toISOString().split('T')[0]}.csv"`);

    // Convert to CSV format
    const csvHeaders = Object.keys(csvData[0] || {}).join(',');
    const csvRows = csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','));
    const csvContent = [csvHeaders, ...csvRows].join('\n');

    res.send(csvContent);

  } catch (error) {
    console.error('❌ [CLIENT_LEDGER] Error exporting ledger:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export ledger',
      details: error.message
    });
  }
});

module.exports = router;
