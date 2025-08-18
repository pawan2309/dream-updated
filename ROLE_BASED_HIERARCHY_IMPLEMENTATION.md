# Role-Based Hierarchy Implementation

## Overview
This document outlines the comprehensive role-based hierarchy system implemented in the user management application, including the new restrictions for specific sections and user data access rules.

## Role Hierarchy Structure

The system implements a 9-tier role hierarchy (from highest to lowest authority):

```
SUB_OWNER (8)      ← Highest authority
SUPER_ADMIN (7)
ADMIN (6)
SUB (5)
MASTER (4)
SUPER_AGENT (3)
AGENT (2)
USER (1)           ← Lowest authority
```

## Key Implementation Files

### 1. Frontend Hierarchy Utilities
- **File**: `user-management/apps/frontend/lib/hierarchyUtils.ts`
- **Purpose**: Core role-based logic and navigation filtering

### 2. Frontend Role Authentication
- **File**: `user-management/apps/frontend/lib/middleware/roleAuth.ts`
- **Purpose**: Route access control and role validation

### 3. Backend RBAC
- **File**: `backend/auth/rbac.js`
- **Purpose**: Server-side role enforcement

## New Role-Based Restrictions

### 1. Restricted Sections (SUB_OWNER Only)
The following three sections are now **ONLY visible to SUB_OWNER** and above:

- **COMMISSIONS** - Commission Dashboard
- **OLD DATA** - Old Ledger, Old Casino Data  
- **LOGIN REPORTS** - All Login Reports

**Implementation**:
- Frontend navigation filtering in `getRoleBasedNavigation()`
- API route protection with `withRoleAuth()` middleware
- Route access control in `canAccessRoute()`

### 2. User Hierarchy Visibility Rules
Users can **ONLY see details for users below them** in the hierarchy:

- **NOT same level**
- **NOT above level**
- **ONLY below level**

**Example**:
- A `MASTER` can see `AGENT` and `USER` data
- A `MASTER` cannot see `SUB`, `ADMIN`, or `SUPER_ADMIN` data
- A `MASTER` cannot see other `MASTER` data

## Implementation Details

### Frontend Navigation Filtering

```typescript
// Check if this is a restricted section
const isRestrictedSection = ['COMMISSIONS', 'OLD DATA', 'Login Reports'].includes(section);

if (isRestrictedSection) {
  // Only show restricted sections to SUB_OWNER and above
  if (canAccessRestrictedSections(userRole)) {
    // Filter links based on hierarchy (only show roles below user)
    const filteredLinks = links.filter(link => {
      const linkIndex = getHierarchyIndex(link.role);
      return linkIndex > userIndex; // Only show links for roles below the user
    });
  }
  // If user can't access restricted sections, don't add them at all
}
```

### API Route Protection

```typescript
// Role-based access control middleware
function withRoleAuth(handler: any) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // ... session verification ...
    
    // Check if user can access restricted sections
    const restrictedRoles = ['SUB_OWNER'];
    if (!restrictedRoles.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: This section is restricted to SUB_OWNER and above' 
      });
    }
    
    // ... continue with handler ...
  };
}
```

### User Data Access Control

```typescript
// Function to check if a user can access another user's data based on hierarchy
export function canAccessUserData(requestingUserRole: string, targetUserRole: string): boolean {
  // Special handling for SUB_OWNER - can access all user data
  if (requestingUserRole === 'SUB_OWNER') {
    return true;
  }
  
  const requestingIndex = getHierarchyIndex(requestingUserRole);
  const targetIndex = getHierarchyIndex(targetUserRole);
  
  // User can only access data for users below them in hierarchy (higher index)
  // NOT same level or above
  return targetIndex > requestingIndex;
}
```

## Protected API Routes

### Commissions API
- **Route**: `/api/commissions/reports`
- **Protection**: SUB_OWNER only
- **Middleware**: `withRoleAuth()`

### Login Reports API  
- **Route**: `/api/reports/login-reports`
- **Protection**: SUB_OWNER only
- **Middleware**: `withRoleAuth()`

## Frontend Route Protection

### Navigation Menu
- Restricted sections are completely hidden from non-SUB_OWNER users
- User detail links are filtered based on hierarchy position
- Only roles below the current user are shown

### Page Access
- Direct URL access to restricted sections returns 403 Forbidden
- User detail pages enforce hierarchy-based access control
- Downline pages only show users below the current user's level

## Database Schema

The role system is supported by the PostgreSQL database with:

```sql
-- Role enum
CREATE TYPE "Role" AS ENUM (
  'OWNER', 'SUB_OWNER', 'SUPER_ADMIN', 'ADMIN', 
  'SUB', 'MASTER', 'SUPER_AGENT', 'AGENT', 'USER'
);

-- User table with role and hierarchy support
CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "parentId" TEXT,  -- Hierarchical relationship
  -- ... other fields
);
```

## Testing the Implementation

### 1. Test Restricted Section Access
- Login as different user roles
- Verify COMMISSIONS, OLD DATA, and LOGIN REPORTS are only visible to SUB_OWNER
- Verify other roles cannot see these sections in navigation

### 2. Test User Hierarchy Access
- Login as a MASTER user
- Verify they can see AGENT and USER data
- Verify they cannot see SUB, ADMIN, or SUPER_ADMIN data
- Verify they cannot see other MASTER data

### 3. Test API Protection
- Try to access `/api/commissions/reports` as non-SUB_OWNER
- Verify 403 Forbidden response
- Try to access `/api/reports/login-reports` as non-SUB_OWNER
- Verify 403 Forbidden response

## Security Features

- **JWT-based authentication** with role validation
- **Session-based access control** for API routes
- **Frontend navigation filtering** to prevent unauthorized access
- **Backend route protection** to enforce restrictions
- **Hierarchy-based data filtering** to respect user levels
- **Audit logging** for access attempts

## Future Enhancements

1. **Role-based audit trails** for all user actions
2. **Dynamic permission management** through admin interface
3. **Fine-grained feature permissions** beyond section-level access
4. **Real-time role validation** for live sessions
5. **Multi-tenant role isolation** for different organizations

## Conclusion

The implemented role-based hierarchy system provides:
- ✅ **Secure access control** for restricted sections
- ✅ **Hierarchical user management** with proper data isolation
- ✅ **Frontend and backend protection** for comprehensive security
- ✅ **Scalable architecture** for future role additions
- ✅ **Clear separation of concerns** between different user levels

This system ensures that users can only access data and features appropriate to their role level, maintaining proper security boundaries while supporting the hierarchical business structure.
