# Share & Commission Management Service

A comprehensive TypeScript service for managing hierarchical share and commission logic in multi-level betting platforms.

## 🏗️ Architecture Overview

```
Sub Owner (100% share) 
    ↓
Super Admin (≤100% share)
    ↓
Admin (≤parent's available share)
    ↓
Sub Agent (≤parent's available share)
    ↓
Master Agent (≤parent's available share)
    ↓
Super Agent (≤parent's available share)
    ↓
Agent (≤parent's available share)
    ↓
Client (≤parent's available share)
```

## 📦 Core Functions

### 1. `assignUserWithShare()`
Assigns share and commission configuration to a user with validation.

```typescript
import { assignUserWithShare } from '../lib/services/shareCommissionService';

const result = await assignUserWithShare({
  userId: 'child-user-id',
  parentId: 'parent-user-id',
  assignedShare: 70, // 70% share
  matchCommission: 2.5,
  sessionCommission: 1.5,
  casinoCommission: 3.0,
  commissionType: 'BetByBet',
  casinoStatus: true
});

if (result.success) {
  console.log('Share assigned successfully');
  console.log('Parent available share:', result.parentShareInfo?.availableSharePercent);
} else {
  console.error('Error:', result.error);
}
```

### 2. `editUserShare()`
Updates a user's share with proper validation and parent recalculation.

```typescript
import { editUserShare } from '../lib/services/shareCommissionService';

const result = await editUserShare({
  userId: 'user-id',
  newShare: 75 // Increase from 70% to 75%
});

if (result.success) {
  console.log('Share updated successfully');
} else {
  console.error('Error:', result.error);
}
```

### 3. `calculateUserShareInfo()`
Calculates comprehensive share information for a user.

```typescript
import { calculateUserShareInfo } from '../lib/services/shareCommissionService';

const shareInfo = await calculateUserShareInfo('user-id');
console.log({
  currentShare: shareInfo.currentShare, // User's own share
  availableSharePercent: shareInfo.availableSharePercent, // Available to assign to children
  totalAssignedToChildren: shareInfo.totalAssignedToChildren, // Total assigned to children
  childrenCount: shareInfo.childrenCount // Number of children
});
```

### 4. `validateShareAssignment()`
Validates if a share assignment is possible.

```typescript
import { validateShareAssignment } from '../lib/services/shareCommissionService';

const validation = await validateShareAssignment('parent-id', 80);
if (validation.valid) {
  console.log('Share assignment is valid');
  console.log('Available share:', validation.availableShare);
} else {
  console.error('Validation failed:', validation.error);
}
```

## 🔧 API Endpoints

### POST `/api/users/share-commission`
Assign share to a user.

```typescript
const response = await fetch('/api/users/share-commission', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'child-user-id',
    parentId: 'parent-user-id',
    assignedShare: 70,
    matchCommission: 2.5,
    sessionCommission: 1.5,
    casinoCommission: 3.0,
    commissionType: 'BetByBet',
    casinoStatus: true
  })
});

const result = await response.json();
```

### PUT `/api/users/share-commission`
Edit user's share.

```typescript
const response = await fetch('/api/users/share-commission', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-id',
    newShare: 75
  })
});

const result = await response.json();
```

### GET `/api/users/share-commission?userId=123&action=share-info`
Get user's share information.

```typescript
const response = await fetch('/api/users/share-commission?userId=123&action=share-info');
const result = await response.json();
```

### GET `/api/users/share-commission?userId=123&action=children-shares`
Get user's children with their share information.

```typescript
const response = await fetch('/api/users/share-commission?userId=123&action=children-shares');
const result = await response.json();
```

### GET `/api/users/share-commission?userId=123&action=validate-assignment&requestedShare=80`
Validate share assignment.

```typescript
const response = await fetch('/api/users/share-commission?userId=123&action=validate-assignment&requestedShare=80');
const result = await response.json();
```

### PATCH `/api/users/share-commission?userId=123`
Update user's commissions.

```typescript
const response = await fetch('/api/users/share-commission?userId=123', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    matchCommission: 2.5,
    sessionCommission: 1.5,
    casinoCommission: 3.0,
    commissionType: 'BetByBet'
  })
});

const result = await response.json();
```

## 🎯 Business Logic Examples

### Example 1: Creating a Super Admin under Sub Owner

```typescript
// Sub Owner has 100% share
// Creating Super Admin with 80% share
const result = await assignUserWithShare({
  userId: 'super-admin-id',
  parentId: 'sub-owner-id',
  assignedShare: 80,
  matchCommission: 2.0,
  sessionCommission: 1.0,
  casinoCommission: 2.5,
  commissionType: 'BetByBet',
  casinoStatus: true
});

// Result:
// - Super Admin gets 80% share
// - Sub Owner's available share becomes 20% (100% - 80%)
// - Super Admin can now assign up to 80% to their children
```

### Example 2: Creating Admin under Super Admin

```typescript
// Super Admin has 80% share (20% already assigned to children)
// Creating Admin with 60% share
const result = await assignUserWithShare({
  userId: 'admin-id',
  parentId: 'super-admin-id',
  assignedShare: 60,
  matchCommission: 1.5,
  sessionCommission: 0.8,
  casinoCommission: 2.0,
  commissionType: 'BetByBet',
  casinoStatus: true
});

// Result:
// - Admin gets 60% share
// - Super Admin's available share becomes 20% (80% - 60%)
// - Admin can now assign up to 60% to their children
```

### Example 3: Editing User Share

```typescript
// User currently has 50% share
// Want to increase to 60%
const result = await editUserShare({
  userId: 'user-id',
  newShare: 60
});

// Validation:
// - Checks if parent has 10% available (60% - 50%)
// - If yes, updates user's share to 60%
// - Updates parent's available share accordingly
```

## 🔒 Validation Rules

### Share Validation
- **Range**: 0% to 100%
- **Top-level roles**: Must have 100% share (non-editable)
- **Child assignment**: Cannot exceed parent's available share
- **Hierarchy**: Child role must be lower than parent role

### Commission Validation
- **Range**: 0% to 10%
- **Types**: Match, Session, Casino commissions
- **Independent**: Applied per bet, regardless of profit/loss

### Hierarchy Validation
```typescript
const HIERARCHY_ROLES = [
  'SUB_OWNER',      // Top level
  'SUPER_ADMIN',    // Can be under SUB_OWNER
  'ADMIN',          // Can be under SUPER_ADMIN
  'SUB',            // Can be under ADMIN
  'MASTER',         // Can be under SUB
  'SUPER_AGENT',    // Can be under MASTER
  'AGENT',          // Can be under SUPER_AGENT
  'USER'            // Can be under AGENT
];
```

## 📊 Database Schema

### UserCommissionShare Table
```sql
CREATE TABLE "UserCommissionShare" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT UNIQUE NOT NULL,
  "share" REAL DEFAULT 0,
  "cshare" REAL DEFAULT 0,
  "icshare" REAL DEFAULT 0,
  "casinocommission" REAL DEFAULT 0,
  "matchcommission" REAL DEFAULT 0,
  "sessioncommission" REAL DEFAULT 0,
  "sessionCommission" REAL,
  "session_commission_type" TEXT DEFAULT 'No Comm',
  "commissionType" TEXT,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
```

## 🚀 Integration with Existing APIs

### Update Create User API
```typescript
// In /api/users/index.ts
import { assignUserWithShare } from '../../../lib/services/shareCommissionService';

// After creating the user
if (parentId && share) {
  const shareResult = await assignUserWithShare({
    userId: user.id,
    parentId,
    assignedShare: parseFloat(share),
    matchCommission: parseFloat(matchCommission) || 0,
    sessionCommission: parseFloat(sessionCommission) || 0,
    casinoCommission: parseFloat(casinoCommission) || 0,
    commissionType,
    casinoStatus
  });
  
  if (!shareResult.success) {
    // Rollback user creation or handle error
    throw new Error(shareResult.error);
  }
}
```

### Update Edit User API
```typescript
// In /api/users/[id].ts
import { editUserShare } from '../../../lib/services/shareCommissionService';

// When updating share
if (share !== undefined) {
  const shareResult = await editUserShare({
    userId: id as string,
    newShare: parseFloat(share)
  });
  
  if (!shareResult.success) {
    return res.status(400).json({
      success: false,
      error: shareResult.error
    });
  }
}
```

## 🧪 Testing Examples

### Test Share Assignment
```typescript
// Test valid assignment
const result = await assignUserWithShare({
  userId: 'test-child',
  parentId: 'test-parent',
  assignedShare: 50
});
console.log('Valid assignment:', result.success);

// Test invalid assignment (exceeds available)
const invalidResult = await assignUserWithShare({
  userId: 'test-child-2',
  parentId: 'test-parent',
  assignedShare: 150 // Exceeds 100%
});
console.log('Invalid assignment:', invalidResult.error);
```

### Test Share Editing
```typescript
// Test valid edit
const editResult = await editUserShare({
  userId: 'test-user',
  newShare: 60
});
console.log('Valid edit:', editResult.success);

// Test invalid edit (top-level role)
const topLevelEdit = await editUserShare({
  userId: 'sub-owner-id',
  newShare: 90
});
console.log('Top-level edit error:', topLevelEdit.error);
```

## 🔧 Configuration

### Constants
```typescript
export const SHARE_CONSTRAINTS = {
  MIN_SHARE: 0,
  MAX_SHARE: 100,
  TOP_LEVEL_SHARE: 100,
  MIN_COMMISSION: 0,
  MAX_COMMISSION: 10
} as const;

export const TOP_LEVEL_ROLES: Role[] = ['SUB_OWNER'];
```

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://postgres:8079@localhost:5432/betting_db"

# JWT
JWT_SECRET="your-secret-key"
```

## 📝 Error Handling

All functions return consistent error responses:

```typescript
{
  success: boolean;
  user?: any;
  error?: string;
  parentShareInfo?: UserShareInfo;
}
```

Common error messages:
- `"Share must be between 0% and 100%"`
- `"Cannot assign X% share. Parent only has Y% available."`
- `"Cannot edit share for top-level role: SUB_OWNER"`
- `"Child role AGENT must be lower in hierarchy than parent role USER"`

## 🎯 Production Considerations

1. **Database Transactions**: All operations use Prisma transactions for consistency
2. **Validation**: Comprehensive validation at multiple levels
3. **Error Handling**: Detailed error messages for debugging
4. **Type Safety**: Full TypeScript support with proper interfaces
5. **Performance**: Optimized queries with proper includes
6. **Scalability**: Modular design for easy extension

This service provides a robust foundation for managing hierarchical share and commission logic in your betting platform! 🚀 