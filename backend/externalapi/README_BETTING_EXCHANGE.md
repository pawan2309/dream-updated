# Betting Exchange Backend - Enhanced Features

This document outlines the enhanced betting exchange backend features implemented to provide a comprehensive betting platform with proper risk management, commission handling, and market control.

## 🚀 **New Features Implemented**

### **1. Enhanced Bet Validation Service (`betValidationService.js`)**

#### **Market Status Validation**
- Blocks bets if market status = "SUSPENDED" or "CLOSED"
- Validates match status before allowing bets
- Real-time market status checking

#### **Odds Validation**
- Validates odds are within allowed min/max limits
- Ensures odds match latest available odds
- Prevents stale odds usage (5-second tolerance)
- Validates odds are positive and reasonable (< 1000)

#### **User Status Validation**
- Validates user authentication and account status
- Checks if user account is active and not locked
- Validates user has sufficient credit limit

#### **Balance & Exposure Validation**
- Validates user balance ≥ (stake + exposure)
- Calculates proper exposure for back/lay bets
- Ensures total exposure doesn't exceed credit limit

#### **Stake Validation**
- Validates min/max stake rules for market and user
- User-specific stake limits
- Market-specific stake constraints

#### **Anti-Spam Protection**
- Prevents duplicate bets within 10 seconds
- Same selection, odds, stake, and market combination
- Configurable time window

#### **In-Play Market Handling**
- Enforces in-play delay for live markets
- 5-second delay for odds acceptance
- Real-time market status monitoring

### **2. Exposure Calculation Service (`exposureService.js`)**

#### **Back Bet Exposure**
- Exposure = stake amount
- Simple stake-based risk calculation

#### **Lay Bet Exposure**
- Exposure = stake × (odds - 1)
- Proper liability calculation for lay bets

#### **Balance Management**
- Real-time balance and exposure updates
- Transaction-based balance modifications
- Exposure tracking across all markets

#### **Risk Management**
- Total exposure calculation per user
- Market-specific exposure breakdown
- Bet type exposure analysis
- Credit limit utilization tracking

### **3. Commission Service (`commissionService.js`)**

#### **Commission Calculation**
- User-specific commission rates
- Default 5% commission for match betting
- Support for different bet types (match, session, casino)

#### **Commission Application**
- Automatic commission deduction from winnings
- Ledger entries for all commission transactions
- Balance updates after commission

#### **Profit/Loss Distribution**
- Hierarchical profit/loss distribution
- Parent-child commission sharing
- Automatic upline balance updates
- Comprehensive distribution logging

#### **P&L Tracking**
- Net profit calculation per user per match
- Commission impact on final P&L
- Historical commission tracking

### **4. Market Management Service (`marketService.js`)**

#### **Market Status Control**
- Market suspension/activation
- Market closure for settlement
- Real-time status updates

#### **Market Operations**
- Suspend markets with reason logging
- Activate suspended markets
- Close markets for settlement
- Update market odds data

#### **Bet Acceptance Control**
- Check if market can accept bets
- Real-time market status validation
- Match status integration

### **5. Enhanced Bet Settlement (`betSettlement.js`)**

#### **Lay Bet Support**
- Proper lay bet win/loss calculation
- Lay bet exposure handling
- Commission calculation for lay bets

#### **Commission Integration**
- Automatic commission calculation
- Commission distribution up hierarchy
- Ledger entries for all transactions

#### **Atomic Transactions**
- Database transaction support
- Rollback on errors
- Consistent state management

## 🔧 **API Endpoints**

### **Enhanced Bet Placement**
```
POST /api/bets/place
```
- Comprehensive validation
- Exposure calculation
- Balance updates
- Ledger entries

### **Enhanced Bet Cancellation**
```
POST /api/bets/:betId/cancel
```
- Proper exposure reversal
- Balance restoration
- Ledger updates

### **Exposure Information**
```
GET /api/bets/exposure/:userId
```
- Total exposure summary
- Market breakdown
- Risk analysis

### **Commission Information**
```
GET /api/bets/commission/:userId
```
- Commission rates
- Commission history
- P&L summary

### **Market Management**
```
GET /api/market/status/:matchId/:marketId
POST /api/market/suspend/:matchId/:marketId
POST /api/market/activate/:matchId/:marketId
POST /api/market/close/:matchId/:marketId
GET /api/market/match/:matchId
POST /api/market/odds/:matchId/:marketId
GET /api/market/can-bet/:matchId/:marketId
```

## 📊 **Database Schema Enhancements**

### **New Ledger Types**
- `COMMISSION` - Commission transactions
- Enhanced `BET_WIN` and `BET_LOSS` with bet type

### **Enhanced Bet Model**
- Support for lay bets
- Enhanced odds data storage
- Market type and tier tracking

## 🛡️ **Security & Validation**

### **Authentication**
- JWT-based authentication
- User role validation
- Session management

### **Input Validation**
- Comprehensive bet data validation
- Stake amount validation
- Odds validation
- Market status validation

### **Risk Management**
- Exposure limits
- Balance validation
- Credit limit enforcement
- Anti-spam protection

## 🔄 **Transaction Flow**

### **Bet Placement**
1. **Validation**: Market status, odds, user status, balance
2. **Exposure Calculation**: Back/lay bet exposure
3. **Balance Update**: Deduct stake, add exposure
4. **Bet Creation**: Store bet with all metadata
5. **Ledger Entry**: Transaction logging

### **Bet Settlement**
1. **Result Processing**: Determine win/loss based on bet type
2. **Commission Calculation**: Apply user-specific rates
3. **Balance Updates**: Add winnings, remove exposure
4. **Commission Application**: Deduct commission
5. **Hierarchy Distribution**: Distribute profit/loss up chain
6. **Ledger Entries**: Complete transaction logging

## 📈 **Monitoring & Logging**

### **Comprehensive Logging**
- All bet operations logged
- Validation failures tracked
- Commission calculations logged
- Error handling with rollback

### **Performance Metrics**
- Response time monitoring
- Database transaction tracking
- Error rate monitoring

## 🚀 **Usage Examples**

### **Place a Back Bet**
```javascript
const betData = {
  marketId: 'match_winner',
  selectionId: 'team_a',
  odds: 2.5,
  stake: 100,
  type: 'back',
  matchId: 'match_123'
};

const response = await fetch('/api/bets/place', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify(betData)
});
```

### **Place a Lay Bet**
```javascript
const betData = {
  marketId: 'match_winner',
  selectionId: 'team_b',
  odds: 3.0,
  stake: 50,
  type: 'lay',
  matchId: 'match_123'
};
```

### **Suspend a Market**
```javascript
const response = await fetch('/api/market/suspend/match_123/market_winner', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ reason: 'Suspicious betting activity' })
});
```

## 🔧 **Configuration**

### **Environment Variables**
- `JWT_SECRET`: Authentication secret
- `DATABASE_URL`: Database connection string
- `REDIS_URL`: Redis connection string

### **Commission Defaults**
- Match Commission: 5%
- Session Commission: 0%
- Casino Commission: 0%

### **Validation Settings**
- Odds tolerance: 5 seconds
- Duplicate bet window: 10 seconds
- In-play delay: 5 seconds
- Max odds: 1000

## 🧪 **Testing**

### **Validation Tests**
- Market status validation
- Odds validation
- User balance validation
- Exposure calculation tests

### **Integration Tests**
- Bet placement flow
- Settlement process
- Commission distribution
- Market management

## 📝 **Future Enhancements**

### **Planned Features**
- Multi-bet support
- Advanced risk management
- Real-time odds streaming
- Mobile app support
- Advanced analytics

### **Performance Optimizations**
- Redis caching
- Database indexing
- Query optimization
- Load balancing

## 🆘 **Support & Troubleshooting**

### **Common Issues**
- Market suspension errors
- Commission calculation issues
- Exposure validation failures
- Database transaction errors

### **Debug Information**
- Comprehensive error logging
- Validation failure details
- Transaction rollback information
- Performance metrics

---

**Note**: This enhanced betting exchange backend maintains full compatibility with existing systems while adding comprehensive new functionality for professional betting operations.
