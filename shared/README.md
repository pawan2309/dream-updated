# Shared Components & Integration

This directory contains reusable components and services that can be shared across all three panels (Client Panel, Operating Panel, and User Management).

## 🏗️ Architecture

```
betting/
├── client_panels/          # Client Panel (Port 3002)
├── operating-panel/         # Operating Panel (Port 3001) 
├── user-management/         # User Management (Port 3000)
└── shared/                 # Shared Components & Services
    ├── components/
    │   ├── MatchCard.tsx
    │   └── MatchList.tsx
    └── lib/
        └── sharedApi.ts
```

## 📦 Shared Components

### MatchCard
A reusable component for displaying match information with different variants:

```tsx
import { MatchCard } from '../shared/components/MatchCard';

<MatchCard
  match={matchData}
  variant="detailed" // 'default' | 'compact' | 'detailed'
  showActions={true}
  onAction={(action, matchId) => {
    // Handle actions (view, bet, etc.)
  }}
/>
```

**Variants:**
- `default`: Standard match card with basic info
- `compact`: Minimal card for lists
- `detailed`: Full card with markets and actions

### MatchList
A container component for displaying lists of matches with loading states:

```tsx
import { MatchList } from '../shared/components/MatchList';

<MatchList
  matches={matches}
  variant="detailed"
  showActions={true}
  onAction={handleMatchAction}
  loading={loading}
  error={error}
  emptyMessage="No matches available"
/>
```

## 🔌 Shared API Service

### sharedApiService
A centralized service for fetching match data from the operating panel:

```tsx
import { sharedApiService } from '../shared/lib/sharedApi';

// Fetch all matches
const result = await sharedApiService.getMatches();

// Fetch live matches
const liveMatches = await sharedApiService.getLiveMatches();

// Fetch matches by status
const inplayMatches = await sharedApiService.getMatchesByStatus('INPLAY');
```

## 🔄 Integration Flow

1. **Operating Panel** (Port 3001)
   - Manages match data and live status
   - Provides API endpoints for match data
   - Controls match synchronization

2. **Client Panel** (Port 3002)
   - Uses shared components to display matches
   - Fetches live matches from operating panel
   - Provides betting interface for clients

3. **User Management** (Port 3000)
   - Manages user accounts and permissions
   - Can use shared components for match display
   - Integrates with both other panels

## 🚀 Usage Examples

### Client Panel In-Play Page
```tsx
'use client'
import { MatchList } from '../../../shared/components/MatchList';
import { sharedApiService } from '../../../shared/lib/sharedApi';

export default function InPlay() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      const result = await sharedApiService.getLiveMatches();
      if (result.success) {
        setMatches(result.data);
      }
    };
    fetchMatches();
  }, []);

  return (
    <div>
      <h1>In Play Matches</h1>
      <MatchList
        matches={matches}
        variant="detailed"
        showActions={true}
        loading={loading}
      />
    </div>
  );
}
```

## 🔧 Configuration

### Environment Variables
Set the API base URL in each panel's `.env` file:

```env
# Client Panel (.env)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# User Management (.env)  
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

### Port Configuration
- **Operating Panel**: 3001 (API Server)
- **Client Panel**: 3002 (Client Interface)
- **User Management**: 3000 (Admin Interface)

## 📋 Features

### ✅ Implemented
- [x] Shared MatchCard component with multiple variants
- [x] Shared MatchList component with loading states
- [x] Centralized API service for match data
- [x] Client panel integration with operating panel
- [x] Reusable components across all panels

### 🚧 Planned
- [ ] Real-time match updates
- [ ] Shared authentication service
- [ ] Shared user management components
- [ ] Cross-panel notifications
- [ ] Shared betting components

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure the operating panel allows requests from other panels
2. **API Connection**: Verify the `NEXT_PUBLIC_API_BASE_URL` is correct
3. **Component Imports**: Check that shared components are properly imported

### Development Setup

1. Start all three panels:
   ```bash
   # Terminal 1 - Operating Panel
   cd operating-panel/apps/frontend && npm run dev
   
   # Terminal 2 - Client Panel  
   cd client_panels && npm run dev
   
   # Terminal 3 - User Management
   cd user-management/apps/frontend && npm run dev
   ```

2. Verify API connectivity:
   ```bash
   curl http://localhost:3001/api/matches?live=true
   ```

## 📝 Notes

- The shared components use TypeScript for type safety
- All components are styled with Tailwind CSS
- The API service handles errors gracefully
- Components are designed to be flexible and reusable 