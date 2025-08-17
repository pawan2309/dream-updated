# Andar Bahar - Casino Game Implementation

## 🎯 **Overview**

This is a fully implemented Andar Bahar casino game built using the refactored Teen Patti 2020 architecture. The game follows modern React best practices with TypeScript, responsive design, and modular component structure.

## 🏗️ **Architecture**

### **File Structure**
```
andar-bahar/[streamingId]/
├── components/
│   ├── AndarBaharBetting.tsx    # Betting interface component
│   ├── AndarBaharStream.tsx     # Game stream and visualization
│   └── AndarBaharResults.tsx    # Results and statistics display
├── context/
│   └── AndarBaharContext.tsx    # Game state management
├── page.tsx                      # Main game page
└── README.md                     # This documentation
```

### **Common Components Used**
```
components/casino/
├── GameLayout.tsx               # Reusable game layout wrapper
├── GameStatus.tsx               # Game status display
├── ErrorFallback.tsx            # Error handling component
└── LoadingSpinner.tsx           # Loading states
```

## 🎮 **Game Logic**

### **Andar Bahar Rules**
1. **Joker Card**: One card is drawn and shown as the "Joker"
2. **Betting Phase**: Players bet on either "Andar" (left) or "Bahar" (right)
3. **Card Drawing**: Cards are drawn alternately on Andar and Bahar sides
4. **Winner**: The side that draws a card matching the Joker first wins
5. **Payout**: Winners receive their stake × odds (typically 1.97)

### **Game Flow**
1. **Waiting** → **Betting** (30 seconds) → **Playing** → **Finished** → **Reset**

### **State Management**
- **Round Management**: Timer, betting status, game progression
- **Card Tracking**: Joker card, drawn cards for each side
- **User Actions**: Bet placement, balance updates
- **Game Results**: Winner determination, result history

## 🔧 **Technical Implementation**

### **State Management**
```typescript
interface AndarBaharState {
  streamingId: string;
  roundId: string | null;
  timeLeft: number;
  isBettingOpen: boolean;
  odds: { andar: number; bahar: number };
  userBalance: number;
  jokerCard: string | null;
  drawnCards: { andar: string[]; bahar: string[] };
  gameStatus: 'waiting' | 'betting' | 'playing' | 'finished';
  winner: 'andar' | 'bahar' | null;
  recentResults: ('andar' | 'bahar')[];
  loading: boolean;
  error: string | null;
}
```

### **Context Actions**
- `placeBet(side, amount)`: Place a bet on Andar or Bahar
- `fetchUserBalance()`: Get current user balance
- `fetchOdds()`: Get current betting odds
- `resetRound()`: Reset game for new round

### **API Integration**
- **Casino Data**: `/api/casino-data/andar-bahar/[streamingId]`
- **User Balance**: `/api/user/balance`
- **Betting Odds**: `/api/user/odds`
- **Bet Placement**: `/api/casino/bet`

## 📱 **Responsive Design**

### **Layout Breakpoints**
- **Mobile** (< 640px): Single column, stacked components
- **Tablet** (640px - 1023px): Two column layout
- **Desktop** (≥ 1024px): Three column layout

### **Component Ordering**
- **Mobile**: Stream → Betting → Results
- **Desktop**: Betting → Stream → Results

## 🎨 **UI Components**

### **1. Betting Interface (`AndarBaharBetting`)**
- **Side Selection**: Visual Andar/Bahar buttons with odds
- **Stake Input**: Amount input with balance display
- **Potential Winnings**: Real-time calculation display
- **Bet Button**: Disabled during closed betting
- **Status Display**: Betting open/closed with timer

### **2. Game Stream (`AndarBaharStream`)**
- **Joker Card**: Prominent display of the target card
- **Game Progress**: Real-time card drawing visualization
- **Side Tracking**: Separate Andar/Bahar card displays
- **Winner Announcement**: Highlighted winner display
- **Stream Controls**: Full screen, settings options

### **3. Results & Statistics (`AndarBaharResults`)**
- **Recent Results**: Last 10 games with visual indicators
- **Game Statistics**: Total games, win distribution
- **Pattern Analysis**: Current streaks, most common results
- **Quick Actions**: History view, data export

## 🔌 **API Endpoints**

### **Casino Data Endpoint**
```typescript
GET /api/casino-data/andar-bahar/[streamingId]
Authorization: Bearer <JWT_TOKEN>

Response:
{
  "success": true,
  "data": {
    "gameName": "Andar Bahar",
    "gameType": "AndarBahar",
    "currentRound": {
      "id": "AB123456",
      "status": "betting",
      "timeLeft": 30
    },
    "jokerCard": "A♠",
    "drawnCards": { "andar": [], "bahar": [] },
    "odds": { "andar": 1.97, "bahar": 1.97 },
    "statistics": { ... },
    "recentResults": [ ... ]
  }
}
```

### **Bet Placement Endpoint**
```typescript
POST /api/casino/bet
Authorization: Bearer <JWT_TOKEN>

Body:
{
  "streamingId": "game_123",
  "roundId": "AB123456",
  "side": "andar",
  "amount": 1000,
  "gameType": "AndarBahar"
}
```

## 🚀 **Performance Features**

### **Lazy Loading**
- **Component Lazy Loading**: Betting, Stream, Results components
- **Dynamic Imports**: Conditional loading based on game state
- **Suspense Boundaries**: Loading fallbacks for better UX

### **State Optimization**
- **useReducer**: Efficient state updates for complex game logic
- **useCallback**: Memoized action functions
- **useEffect**: Cleanup and dependency management

## 🧪 **Testing & Quality**

### **Error Handling**
- **API Failures**: Graceful fallbacks with retry options
- **Network Issues**: User-friendly error messages
- **Validation**: Input validation and error states

### **Loading States**
- **Component Loading**: Skeleton loaders and spinners
- **API Loading**: Loading indicators for async operations
- **Stream Loading**: Progressive loading for game stream

## 🔒 **Security Features**

### **Authentication**
- **JWT Tokens**: Secure API communication
- **Token Validation**: Server-side verification
- **User Authorization**: Protected game access

### **Input Validation**
- **Bet Amount**: Min/max limits, balance validation
- **Side Selection**: Valid Andar/Bahar options
- **API Sanitization**: Server-side input validation

## 📊 **Analytics & Monitoring**

### **Game Metrics**
- **Betting Patterns**: Side preferences, amount distribution
- **Game Performance**: Win rates, round durations
- **User Engagement**: Session times, bet frequency

### **Error Tracking**
- **API Failures**: Network errors, authentication issues
- **Game Errors**: State inconsistencies, validation failures
- **Performance Issues**: Loading times, render delays

## 🚀 **Deployment & Scaling**

### **Build Optimization**
- **Code Splitting**: Separate bundles for each game
- **Tree Shaking**: Remove unused code
- **Minification**: Compressed production builds

### **Scalability**
- **Modular Architecture**: Easy to add new games
- **Component Reuse**: Shared components across games
- **State Management**: Scalable context patterns

## 🔄 **Adding New Games**

### **Template Pattern**
1. **Copy Structure**: Use Andar Bahar as template
2. **Update Types**: Modify state interfaces for new game
3. **Customize Components**: Adapt UI for game-specific needs
4. **Add to Router**: Include in dynamic game routing

### **Example for New Game**
```typescript
// In [gameType]/[streamingId]/page.tsx
const GAME_COMPONENTS = {
  'andar-bahar': AndarBaharGame,
  'new-game': NewGameComponent,  // Add here
  // ... other games
}
```

## 📚 **Dependencies**

### **Core Dependencies**
- **React 18+**: Hooks, Context, Suspense
- **TypeScript**: Type safety and interfaces
- **Tailwind CSS**: Utility-first styling
- **Next.js**: App Router, dynamic imports

### **Custom Hooks**
- **useResponsive**: Responsive design management
- **useCasinoData**: Casino data fetching
- **useAndarBahar**: Game-specific state management

## 🆘 **Troubleshooting**

### **Common Issues**
1. **Game Not Loading**: Check streaming ID and authentication
2. **Betting Not Working**: Verify API endpoints and JWT tokens
3. **Responsive Issues**: Test on different screen sizes
4. **Performance Issues**: Check lazy loading and bundle sizes

### **Debug Steps**
1. **Console Logs**: Check browser console for errors
2. **Network Tab**: Verify API calls and responses
3. **State Inspection**: Use React DevTools for state debugging
4. **Component Tree**: Verify component hierarchy and props

## 📈 **Future Enhancements**

### **Planned Features**
- **Real-time WebSocket**: Live game updates
- **Multi-language Support**: Internationalization
- **Advanced Analytics**: Detailed game statistics
- **Social Features**: Chat, leaderboards

### **Performance Improvements**
- **Virtual Scrolling**: For large result lists
- **Image Optimization**: Lazy loading for game assets
- **Service Workers**: Offline support and caching
- **PWA Features**: Installable app experience

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅  
**Game Type**: Andar Bahar 🎰
