# Teen Patti 20-20 - Refactored Casino Game

## 🚀 Overview

This is a fully refactored, production-ready React component for the Teen Patti 20-20 casino game. The code has been restructured to follow modern best practices, with improved performance, maintainability, and reusability.

## ✨ Key Improvements

### 1. **Modern Architecture**
- **Component-based structure** with clear separation of concerns
- **Custom hooks** for business logic and state management
- **TypeScript interfaces** for type safety
- **Lazy loading** for better performance

### 2. **Performance Optimizations**
- **Dynamic imports** with loading fallbacks
- **Suspense boundaries** for better UX
- **Lazy loading** for heavy components
- **Intersection Observer** for image optimization

### 3. **Responsive Design**
- **Mobile-first approach** with responsive breakpoints
- **Custom responsive hooks** for dynamic layouts
- **Flexible grid system** that adapts to screen sizes
- **Touch-friendly interactions** for mobile devices

### 4. **Code Quality**
- **Configuration-driven** approach with centralized constants
- **Error boundaries** and proper error handling
- **Loading states** for all async operations
- **Consistent naming conventions**

## 🏗️ Project Structure

```
[streamingId]/
├── config/
│   └── gameConfig.ts          # Game configuration and constants
├── hooks/
│   ├── useCasinoData.ts       # Casino data fetching hook
│   └── useResponsive.ts       # Responsive design hook
├── utils/
│   └── lazyLoading.ts         # Lazy loading utilities
├── components/
│   ├── CasinoGameTemplate.tsx # Reusable template for other games
│   ├── BettingInterface.tsx   # Betting interface component
│   ├── GameStream.tsx         # Game stream component
│   └── ResultsBar.tsx         # Results display component
├── context/
│   └── GameContext.tsx        # Game state management
├── page.tsx                   # Main page component
└── README.md                  # This file
```

## 🔧 Configuration

### Game Configuration (`gameConfig.ts`)

```typescript
export const GAME_CONFIG = {
  GAME_NAME: 'Teen Patti 20-20',
  GAME_TYPE: 'Teen20',
  ROUND_DURATION: 20,
  // ... more config
}
```

### API Endpoints

```typescript
API_ENDPOINTS: {
  BALANCE: '/api/user/balance',
  ODDS: '/api/user/odds',
  GAME_RESULT: '/api/casino/result',
  ROUND_INFO: '/api/casino/round',
  CASINO_DATA: '/api/casino-data'  // NEW: Dynamic game data
}
```

## 🎯 Key Features

### 1. **Dynamic Data Fetching**
- Fetches game data from `/api/casino-data/[streamingId]`
- Real-time updates for round information
- Dynamic odds and betting limits

### 2. **Responsive Layout**
- **Mobile**: Single column layout
- **Tablet**: Two column layout  
- **Desktop**: Three column layout
- Adaptive component ordering

### 3. **Error Handling**
- Graceful error fallbacks
- Retry mechanisms
- User-friendly error messages
- Loading states for all operations

### 4. **Performance Features**
- Lazy loading of components
- Image optimization
- Suspense boundaries
- Dynamic imports

## 🚀 Usage

### Basic Implementation

```typescript
import { GameProvider } from './context/GameContext'
import TeenPattiGame from './page'

function App() {
  return (
    <GameProvider streamingId="game_123">
      <TeenPattiGame />
    </GameProvider>
  )
}
```

### Creating Other Casino Games

The `CasinoGameTemplate` component makes it easy to create new casino games:

```typescript
import { withCasinoGameTemplate } from './components/CasinoGameTemplate'

const NewCasinoGame = withCasinoGameTemplate(YourGameComponent, {
  gameName: 'New Game',
  gameType: 'NewGameType'
})
```

## 🔌 API Integration

### Casino Data Endpoint

```typescript
GET /api/casino-data/[streamingId]
Authorization: Bearer <JWT_TOKEN>

Response:
{
  "success": true,
  "data": {
    "gameName": "Teen Patti 20-20",
    "currentRound": {
      "id": "R123456",
      "status": "betting",
      "timeLeft": 20
    },
    "statistics": { ... },
    "settings": { ... }
  }
}
```

### Required Headers

All API calls require:
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

## 📱 Responsive Breakpoints

- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1023px (md)
- **Desktop**: 1024px - 1279px (lg)
- **Large Desktop**: ≥ 1280px (xl)

## 🎨 Styling

- **Tailwind CSS** for utility-first styling
- **CSS Modules** ready for component-specific styles
- **Responsive design** with mobile-first approach
- **Dark mode** support ready

## 🧪 Testing

### Component Testing

```typescript
import { render, screen } from '@testing-library/react'
import TeenPattiGame from './page'

test('renders game title', () => {
  render(<TeenPattiGame />)
  expect(screen.getByText(/Teen Patti 20-20/i)).toBeInTheDocument()
})
```

### Hook Testing

```typescript
import { renderHook } from '@testing-library/react-hooks'
import { useCasinoData } from './hooks/useCasinoData'

test('fetches casino data', async () => {
  const { result } = renderHook(() => useCasinoData('test-id'))
  // ... test implementation
})
```

## 🚀 Performance Metrics

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## 🔒 Security

- **JWT authentication** for all API calls
- **Input validation** on all forms
- **XSS protection** with proper escaping
- **CSRF protection** with token validation

## 📈 Monitoring

- **Error tracking** with proper logging
- **Performance monitoring** with metrics
- **User analytics** for game usage
- **Real-time alerts** for critical issues

## 🚀 Deployment

### Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Start production
npm start
```

### Environment Variables

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4001
JWT_SECRET=your-secret-key
NODE_ENV=production
```

## 🤝 Contributing

1. Follow the established code structure
2. Use TypeScript for all new code
3. Add proper error handling
4. Include responsive design considerations
5. Add tests for new functionality
6. Update documentation

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Best Practices](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🆘 Support

For issues or questions:
1. Check the error logs
2. Verify API endpoints
3. Check authentication tokens
4. Review responsive breakpoints
5. Test on different devices

---

**Last Updated**: January 2025
**Version**: 2.0.0
**Status**: Production Ready ✅
