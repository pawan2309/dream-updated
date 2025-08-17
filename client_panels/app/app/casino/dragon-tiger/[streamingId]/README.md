# Dragon Tiger Casino Game

## Overview

Dragon Tiger is a fast-paced casino card game where players bet on whether the Dragon or Tiger side will have the higher card value, or if it will be a tie. This implementation provides a fully responsive, real-time gaming experience with modern UI/UX design.

## Game Logic

### Core Mechanics
- **Two Cards**: One card is drawn for Dragon, one for Tiger
- **Card Values**: Ace = 1, Jack = 11, Queen = 12, King = 13
- **Winning Conditions**:
  - Dragon wins if Dragon card > Tiger card
  - Tiger wins if Tiger card > Dragon card
  - Tie if both cards have equal value
- **Betting Options**: Dragon, Tiger, or Tie
- **Odds**: Dragon (1.97x), Tiger (1.97x), Tie (8.0x)

### Game Flow
1. **Waiting**: Round preparation phase
2. **Betting**: Players place bets (30 seconds)
3. **Playing**: Cards are revealed
4. **Finished**: Winner announced, results displayed

## Architecture

### Component Structure
```
DragonTigerGame/
├── page.tsx                    # Main game page
├── context/
│   └── DragonTigerContext.tsx # Game state management
├── components/
│   ├── DragonTigerBetting.tsx # Betting interface
│   ├── DragonTigerStream.tsx  # Game stream & cards
│   └── DragonTigerResults.tsx # Results & statistics
└── README.md                   # This file
```

### State Management
- **React Context**: Centralized state management
- **useReducer**: Complex state logic with actions
- **Real-time Updates**: Timer, game status, results
- **API Integration**: Balance, odds, betting, results

### Key Features
- **Responsive Design**: Mobile-first approach
- **Real-time Updates**: Live game status and timer
- **Dynamic Odds**: Configurable betting odds
- **Statistics**: Comprehensive result analysis
- **Error Handling**: Graceful fallbacks and retry mechanisms

## Components

### 1. DragonTigerContext
**File**: `context/DragonTigerContext.tsx`

Manages the complete game state including:
- Game status and timer
- User balance and betting
- Card values and winner
- Recent results and statistics
- API integration for real data

**Key Methods**:
- `placeBet(side, amount)`: Place a bet
- `fetchUserBalance()`: Get current balance
- `fetchOdds()`: Get current odds
- `fetchGameResult()`: Get game results
- `fetchRoundInfo()`: Get round information

### 2. DragonTigerBetting
**File**: `components/DragonTigerBetting.tsx`

Interactive betting interface with:
- Side selection (Dragon/Tiger/Tie)
- Stake input with validation
- Quick stake buttons
- Potential winnings calculation
- Bet placement with loading states

**Features**:
- Real-time odds display
- Balance validation
- Responsive button states
- Quick stake presets (₹100, ₹500, ₹1000, ₹5000, ₹10000)

### 3. DragonTigerStream
**File**: `components/DragonTigerStream.tsx`

Main game display showing:
- Live game stream
- Dragon and Tiger card placeholders
- Game status and timer
- Winner announcement
- Game instructions

**Features**:
- Card reveal animations
- Winner highlighting
- Status indicators
- Stream error handling
- Responsive layout

### 4. DragonTigerResults
**File**: `components/DragonTigerResults.tsx`

Comprehensive results display including:
- Last 10 results grid
- Win/loss statistics
- Streak analysis
- Pattern insights
- Results summary

**Analytics**:
- Win percentages by side
- Current and longest streaks
- Pattern detection (alternating, dominance)
- Historical data analysis

## API Integration

### Endpoints Used
- **`/api/user/balance`**: Get user balance
- **`/api/user/odds`**: Get current odds
- **`/api/casino/result/[streamingId]`**: Get game results
- **`/api/casino/round/[streamingId]`**: Get round information
- **`/api/casino/bet`**: Place bets
- **`/api/casino-data/dragon-tiger/[streamingId]`**: Get game-specific data

### Data Flow
1. **Authentication**: JWT token validation
2. **Game Data**: Fetch from `/casino-data/dragon-tiger/[streamingId]`
3. **Real-time Updates**: WebSocket integration for live updates
4. **Bet Placement**: Secure API calls with validation
5. **Results**: Fetch and display game outcomes

## Responsive Design

### Breakpoints
- **Mobile**: `< 768px` - Single column layout
- **Tablet**: `768px - 1024px` - Optimized grid layout
- **Desktop**: `> 1024px` - Full three-column layout

### Mobile Optimizations
- Touch-friendly buttons
- Swipe gestures for navigation
- Optimized spacing and typography
- Collapsible sections

## Performance Features

### Lazy Loading
- Component-level code splitting
- Dynamic imports with loading states
- Suspense boundaries for smooth UX

### Optimization
- Memoized calculations
- Efficient re-renders
- Debounced API calls
- Image optimization

## Security

### Authentication
- JWT token validation
- Secure API endpoints
- Session management
- Role-based access control

### Data Validation
- Input sanitization
- Bet amount limits
- Balance verification
- Rate limiting

## Error Handling

### Graceful Degradation
- Stream fallbacks
- API error recovery
- Offline state handling
- User-friendly error messages

### Retry Mechanisms
- Automatic retry for failed API calls
- Stream reconnection
- Session refresh
- Fallback to cached data

## Customization

### Configuration
- Odds adjustment
- Timer duration
- Bet limits
- UI themes

### Styling
- Tailwind CSS classes
- CSS custom properties
- Theme variables
- Responsive utilities

## Testing

### Component Testing
- Unit tests for game logic
- Integration tests for API calls
- E2E tests for user flows
- Performance testing

### Test Coverage
- State management
- User interactions
- API integration
- Error scenarios

## Deployment

### Build Process
- Next.js optimization
- Bundle analysis
- Code splitting
- Asset optimization

### Environment Variables
```env
JWT_SECRET=your-secret-key
NEXT_PUBLIC_API_BASE_URL=your-api-url
NEXT_PUBLIC_WS_URL=your-websocket-url
```

## Future Enhancements

### Planned Features
- **Multi-language Support**: Internationalization
- **Advanced Analytics**: Detailed player statistics
- **Social Features**: Leaderboards and achievements
- **Mobile App**: React Native version
- **VR Support**: Immersive gaming experience

### Technical Improvements
- **WebSocket**: Real-time game updates
- **PWA**: Progressive web app features
- **Offline Support**: Service worker implementation
- **Performance**: Advanced caching strategies

## Troubleshooting

### Common Issues
1. **Stream Not Loading**: Check network and retry
2. **Bet Placement Failed**: Verify balance and limits
3. **Authentication Errors**: Refresh session token
4. **Performance Issues**: Check device capabilities

### Debug Mode
Enable debug logging for development:
```typescript
const DEBUG_MODE = process.env.NODE_ENV === 'development';
```

## Contributing

### Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set environment variables
4. Run development server: `npm run dev`

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Conventional commits

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation
- Review the troubleshooting guide

---

**Note**: This implementation follows the same architectural patterns as the Andar Bahar and Teen Patti 2020 games, ensuring consistency and maintainability across the casino platform.

