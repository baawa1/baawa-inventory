// Touch interaction utilities for mobile optimization

export interface TouchFeedbackOptions {
  haptic?: boolean;
  visual?: boolean;
  sound?: boolean;
}

// Haptic feedback for mobile interactions
export const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('navigator' in window && 'vibrate' in navigator) {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(50);
        break;
      case 'heavy':
        navigator.vibrate([100, 50, 100]);
        break;
    }
  }
};

// Enhanced touch event handler with feedback
export const createTouchHandler = (
  callback: () => void,
  options: TouchFeedbackOptions = { haptic: true, visual: true }
) => {
  return (event: React.TouchEvent | React.MouseEvent) => {
    // Prevent default touch behaviors that might interfere
    if ('touches' in event) {
      event.preventDefault();
    }

    // Trigger haptic feedback on touch devices
    if (options.haptic && 'navigator' in window && 'vibrate' in navigator) {
      triggerHapticFeedback('light');
    }

    // Execute callback
    callback();
  };
};

// Touch gesture detection utilities
export interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  duration: number;
}

export class TouchGestureDetector {
  private startTouch: Touch | null = null;
  private startTime: number = 0;
  private minSwipeDistance: number = 50;
  private maxSwipeTime: number = 300;

  onSwipe?: (gesture: SwipeGesture) => void;

  handleTouchStart = (event: TouchEvent) => {
    this.startTouch = event.touches[0];
    this.startTime = Date.now();
  };

  handleTouchEnd = (event: TouchEvent) => {
    if (!this.startTouch) return;

    const endTouch = event.changedTouches[0];
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    if (duration > this.maxSwipeTime) return;

    const deltaX = endTouch.clientX - this.startTouch.clientX;
    const deltaY = endTouch.clientY - this.startTouch.clientY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance < this.minSwipeDistance) return;

    // Determine swipe direction
    let direction: SwipeGesture['direction'];
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    this.onSwipe?.({
      direction,
      distance,
      duration,
    });

    this.startTouch = null;
  };
}

// Touch-optimized button styles
export const getTouchOptimizedStyles = (size: 'sm' | 'md' | 'lg' = 'md') => {
  const sizes = {
    sm: {
      minHeight: '44px', // Apple's recommended minimum touch target
      minWidth: '44px',
      padding: '8px 12px',
    },
    md: {
      minHeight: '48px', // Google's recommended minimum touch target
      minWidth: '48px', 
      padding: '12px 16px',
    },
    lg: {
      minHeight: '56px',
      minWidth: '56px',
      padding: '16px 20px',
    },
  };

  return {
    ...sizes[size],
    touchAction: 'manipulation', // Improves touch responsiveness
    userSelect: 'none' as const, // Prevents text selection on touch
    WebkitTapHighlightColor: 'transparent', // Removes default tap highlight
  };
};

// Scroll enhancement utilities
export const enableMomentumScrolling = (element: HTMLElement) => {
  // Use style property with string index to avoid TypeScript issues
  (element.style as unknown as Record<string, string>)['webkitOverflowScrolling'] = 'touch';
  (element.style as unknown as Record<string, string>)['overflowScrolling'] = 'touch';
};

// Long press detection
export class LongPressDetector {
  private timeout: NodeJS.Timeout | null = null;
  private isLongPress = false;
  private readonly longPressDelay = 500; // ms

  onLongPress?: () => void;
  onShortPress?: () => void;

  handleTouchStart = (event: TouchEvent) => {
    this.isLongPress = false;
    this.timeout = setTimeout(() => {
      this.isLongPress = true;
      triggerHapticFeedback('medium');
      this.onLongPress?.();
    }, this.longPressDelay);
  };

  handleTouchEnd = (event: TouchEvent) => {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    if (!this.isLongPress) {
      this.onShortPress?.();
    }
  };

  handleTouchCancel = () => {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.isLongPress = false;
  };
}

// Pull to refresh utility
export class PullToRefreshDetector {
  private startY = 0;
  private currentY = 0;
  private isDragging = false;
  private threshold = 80;
  
  onRefresh?: () => void;
  onPullProgress?: (progress: number) => void;

  handleTouchStart = (event: TouchEvent) => {
    // Only trigger at top of scroll container
    const scrollContainer = event.currentTarget as HTMLElement;
    if (scrollContainer.scrollTop > 0) return;

    this.startY = event.touches[0].clientY;
    this.isDragging = false;
  };

  handleTouchMove = (event: TouchEvent) => {
    if (!this.isDragging && event.touches[0].clientY > this.startY) {
      this.isDragging = true;
    }

    if (this.isDragging) {
      this.currentY = event.touches[0].clientY;
      const pullDistance = this.currentY - this.startY;
      const progress = Math.min(pullDistance / this.threshold, 1);
      
      this.onPullProgress?.(progress);
      
      // Prevent page scroll while pulling
      if (pullDistance > 0) {
        event.preventDefault();
      }
    }
  };

  handleTouchEnd = () => {
    if (this.isDragging) {
      const pullDistance = this.currentY - this.startY;
      
      if (pullDistance >= this.threshold) {
        triggerHapticFeedback('medium');
        this.onRefresh?.();
      }
      
      this.isDragging = false;
      this.onPullProgress?.(0);
    }
  };
}