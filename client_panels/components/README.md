# Enhanced Toast Notification System

This enhanced toast system ensures that notifications always appear at the top of the screen regardless of page position, with smooth animations and proper z-index management.

## 🚀 Features

- **Fixed Top Positioning**: Toasts always appear at the top of the viewport
- **Maximum Z-Index**: Uses z-index 999999 to ensure toasts are above all other elements
- **Multiple Positions**: Support for top-right, top-center, and top-left positioning
- **Auto-Stacking**: Multiple toasts stack properly with spacing
- **Smooth Animations**: Slide-in animation from the top
- **Auto-Dismiss**: Configurable duration with automatic removal
- **Multiple Types**: Success, error, warning, and info toasts
- **Responsive Design**: Works on all screen sizes

## 📁 Components

### 1. Toast.tsx
The main toast component with enhanced positioning and animations.

### 2. ToastContainer.tsx
Manages multiple toasts and ensures proper stacking and positioning.

### 3. useToast Hook
Provides easy-to-use methods for showing different types of toasts.

## 🛠️ Usage

### Basic Implementation

```tsx
import { useToast, ToastContainer } from './components/ToastContainer';

function App() {
  const { toasts, success, error, warning, info } = useToast();

  const handleBetPlacement = () => {
    try {
      // Your bet placement logic
      success('Bet placed successfully!', {
        duration: 5000,
        position: 'top-center'
      });
    } catch (error) {
      error('Failed to place bet. Please try again.', {
        duration: 6000,
        position: 'top-right'
      });
    }
  };

  return (
    <div>
      {/* Your app content */}
      <button onClick={handleBetPlacement}>Place Bet</button>
      
      {/* Toast Container - Place this at the root level */}
      <ToastContainer 
        toasts={toasts} 
        onRemoveToast={(id) => {
          // This is handled automatically by the hook
        }} 
      />
    </div>
  );
}
```

### Toast Methods

```tsx
const { success, error, warning, info, clearToasts } = useToast();

// Success toast
success('Operation completed successfully!', {
  duration: 5000,        // 5 seconds (default: 3000)
  position: 'top-center' // top-right, top-center, top-left
});

// Error toast
error('Something went wrong!', {
  duration: 6000,
  position: 'top-right'
});

// Warning toast
warning('Please check your input!', {
  duration: 4000,
  position: 'top-left'
});

// Info toast
info('New data available!', {
  duration: 3000,
  position: 'top-center'
});

// Clear all toasts
clearToasts();
```

### Position Options

- **`top-right`**: Appears at the top-right corner (default)
- **`top-center`**: Appears at the top-center of the screen
- **`top-left`**: Appears at the top-left corner

### Duration Options

- **`duration: 0`**: Toast won't auto-dismiss
- **`duration: 3000`**: Toast dismisses after 3 seconds (default)
- **`duration: 5000`**: Toast dismisses after 5 seconds

## 🎨 Customization

### Styling

The toast component uses Tailwind CSS classes and can be easily customized:

```tsx
// In Toast.tsx, modify the className and style props
className={`
  fixed top-4 z-[9999] 
  ${bgColor} ${borderColor}
  text-white px-6 py-4 rounded-lg 
  shadow-2xl 
  flex items-center gap-3 
  min-w-[320px] max-w-[480px]
  border-2
  transform transition-all duration-300 ease-out
  animate-slideInFromTop
`}
```

### Animation

Customize the slide-in animation by modifying the CSS:

```tsx
<style jsx>{`
  @keyframes slideInFromTop {
    from {
      opacity: 0;
      transform: translateY(-100%);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-slideInFromTop {
    animation: slideInFromTop 0.3s ease-out;
  }
`}</style>
```

## 🔧 Integration with Existing Code

### Replace Old Toast Usage

**Before:**
```tsx
import { Toast } from './components/Toast';

const [showToast, setShowToast] = useState(false);
const [toastMessage, setToastMessage] = useState('');
const [toastType, setToastType] = useState('success');

<Toast
  message={toastMessage}
  type={toastType}
  isVisible={showToast}
  onClose={() => setShowToast(false)}
/>
```

**After:**
```tsx
import { useToast, ToastContainer } from './components/ToastContainer';

const { toasts, success, error } = useToast();

// Show toast
success('Your message here');

// Toast container handles everything automatically
<ToastContainer toasts={toasts} onRemoveToast={() => {}} />
```

## 🎯 Best Practices

1. **Place ToastContainer at Root Level**: Ensure it's rendered at the top level of your app
2. **Use Appropriate Types**: Choose the right toast type for your message
3. **Set Reasonable Durations**: Don't make toasts too short or too long
4. **Position Strategically**: Use top-center for important messages, top-right for confirmations
5. **Clear Toasts When Needed**: Use `clearToasts()` when switching pages or contexts

## 🚨 Troubleshooting

### Toast Not Appearing
- Ensure `ToastContainer` is rendered in your component tree
- Check that the `useToast` hook is properly initialized
- Verify z-index isn't being overridden by other CSS

### Toast Appearing Behind Elements
- The toast uses z-index 999999, which should be sufficient
- Check for any CSS that might be setting higher z-index values
- Ensure no parent containers have `overflow: hidden`

### Multiple Toasts Not Stacking
- Ensure you're using the `ToastContainer` component
- Check that the `onRemoveToast` callback is properly passed
- Verify the toast IDs are unique

## 📱 Mobile Considerations

- Toasts are responsive and work on all screen sizes
- Touch-friendly close button with proper sizing
- Backdrop blur effect enhances visibility on mobile devices
- Proper spacing ensures toasts don't overlap with mobile UI elements
