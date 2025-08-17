# Casino Games - Refactored Architecture

## Overview

This directory contains the refactored casino games implementation inspired by top betting sites like 1xBet and Parimatch. The new architecture provides a unified, single-page layout with real-time betting functionality.

## 🎯 Core Features

### ✅ One-Page Layout
- **Single-page application** with no hard reloads
- **Dynamic routing** for all casino games
- **Persistent layout** across game navigation
- **Responsive design** for mobile-first experience

### ✅ Game UI & Market Structure
- **Modern betting markets** displayed as cards/tables
- **Clean, compact odds layout** similar to 1xBet/Parimatch
- **Responsive grid** (2-column on mobile, 3-column on desktop)
- **Hover & active states** for all interactive elements

### ✅ Betting Functionality
- **Click on odds** → opens Bet Slip
- **Dynamic profit/loss calculation**: `(odds - 1) * stake`
- **Stake input** with validation
- **Confirm & Cancel buttons** with proper styling
- **Balance validation** before bet placement

### ✅ Real-Time Updates
- **WebSocket-ready architecture** for live updates
- **Market status updates** without page reload
- **Odds changes** in real-time
- **Balance & bet updates** instantly

## 🏗️ Architecture

### Directory Structure
```
game/
├── [gameType]/
│   ├── components/
│   │   ├── GameLayout.tsx      # Main game layout
│   │   ├── BettingMarkets.tsx  # Betting options display
│   │   ├── BetSlip.tsx         # Bet slip and confirmation
│   │   ├── GameHeader.tsx      # Game header with navigation
│   │   ├── GameStream.tsx      # Live game stream
│   │   ├── RoundInfo.tsx       # Round information
│   │   └── LastResults.tsx     # Recent results display
│   ├── context/
│   │   ├── GameContext.tsx     # Game state management
│   │   └── BetSlipContext.tsx  # Bet slip state management
│   ├── hooks/
│   │   ├── useGameData.ts      # Game data fetching
│   │   └── useResponsive.ts    # Responsive design
│   ├── config/
│   │   └── gameConfig.ts       # Game configuration
│   └── page.tsx                # Main game page
```

### Game Configuration
Each game is configured in `gameConfig.ts` with:
- **Display name** and description
- **Betting markets** and options
- **Odds** for each selection
- **Color schemes** for visual appeal
- **Betting limits** and timing

### Supported Games
1. **Teen Patti 20-20** - Indian Poker with player bets
2. **Dragon Tiger 20-20** - Asian card game
3. **Andar Bahar** - Traditional Indian game
4. **Lucky 7** - Card-based luck game
5. **32 Cards** - Multi-player card game
6. **AAA (Amar Akbar Anthony)** - Three-player betting

## 🚀 Getting Started

### 1. Navigation
Navigate to any casino game using:
```
/app/game/teenpatti
/app/game/dragontiger
/app/game/andarbahar
/app/game/lucky7
/app/game/thirtytwocard
/app/game/aaa
```

### 2. Betting Flow
1. **Select odds** by clicking on betting options
2. **Review selections** in the Bet Slip
3. **Adjust stakes** for individual bets
4. **Confirm bets** with balance validation
5. **Real-time updates** on bet status

### 3. Game States
- **Waiting** - Round preparation
- **Betting** - Betting window open
- **Active** - Round in progress
- **Ended** - Round completed

## 🎨 UI Components

### BettingMarkets
- **Market cards** with clear headers
- **Odds buttons** with hover effects
- **Selection indicators** for chosen bets
- **Responsive grid** layout

### BetSlip
- **Selected bets** with stake editing
- **Quick stake** buttons for common amounts
- **Total calculations** (stake + profit)
- **Error handling** and validation

### GameStream
- **Live stream placeholder** (ready for integration)
- **Game status overlays** with animations
- **Round progress** indicators
- **Betting status** display

## 🔧 Technical Implementation

### State Management
- **React Context** for game state
- **useReducer** for complex state logic
- **Custom hooks** for data fetching
- **Memoization** for performance optimization

### Performance Features
- **Lazy loading** for heavy components
- **Dynamic imports** with fallbacks
- **React.memo** for component optimization
- **Efficient re-renders** with proper dependencies

### Responsive Design
- **Mobile-first** approach
- **CSS Grid & Flexbox** for layouts
- **Breakpoint detection** with custom hooks
- **Adaptive UI** for different screen sizes

## 🔌 Integration Points

### WebSocket Integration
The architecture is ready for WebSocket integration:
- **Real-time odds updates**
- **Live game status changes**
- **Instant bet confirmations**
- **Balance updates**

### API Integration
Ready for backend API integration:
- **Game data fetching**
- **Bet placement**
- **User balance management**
- **Result settlement**

## 📱 Mobile Experience

### Responsive Features
- **2-column odds layout** on mobile
- **Touch-friendly buttons** with proper sizing
- **Optimized spacing** for small screens
- **Gesture support** ready for implementation

### Performance
- **Optimized rendering** for mobile devices
- **Efficient state updates** to prevent lag
- **Smooth animations** with CSS transitions
- **Fast navigation** between games

## 🎯 Future Enhancements

### Planned Features
- **Live video streaming** integration
- **Advanced statistics** and analytics
- **Multi-language support**
- **Dark mode** theme
- **Push notifications** for results

### Scalability
- **Additional game types** easy to add
- **Custom market configurations**
- **Dynamic odds calculation**
- **Real-time result processing**

## 🧪 Testing

### Component Testing
- **Unit tests** for all components
- **Integration tests** for betting flow
- **Responsive design** testing
- **Performance testing** for real-time updates

### User Experience
- **Betting flow validation**
- **Error handling** scenarios
- **Mobile responsiveness** testing
- **Accessibility** compliance

## 📚 Documentation

### Code Comments
- **Comprehensive JSDoc** for all functions
- **TypeScript interfaces** for type safety
- **Component props** documentation
- **State management** explanations

### API Documentation
- **Game configuration** structure
- **Context usage** examples
- **Hook implementations** guide
- **Component composition** patterns

---

## 🎮 Ready to Play!

The refactored casino games are now ready for production use with:
- ✅ **Professional betting interface** similar to 1xBet/Parimatch
- ✅ **Real-time functionality** ready for WebSocket integration
- ✅ **Mobile-first responsive design**
- ✅ **Comprehensive betting flow** with validation
- ✅ **Scalable architecture** for future enhancements

Start exploring the games at `/app/game/[gameType]` and experience the new betting interface!
