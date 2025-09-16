import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { 
  triggerHapticFeedback, 
  getTouchOptimizedStyles,
  TouchGestureDetector,
  LongPressDetector 
} from '@/lib/utils/touch-interactions';

// Enhanced touch-optimized button with haptic feedback
interface TouchButtonProps extends ComponentProps<typeof Button> {
  hapticFeedback?: boolean;
  longPressAction?: () => void;
  swipeActions?: {
    left?: () => void;
    right?: () => void;
  };
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  onClick,
  hapticFeedback = true,
  longPressAction,
  swipeActions,
  className,
  size = 'default',
  ...props
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isPressed, setIsPressed] = useState(false);
  
  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    // Long press detector
    const longPress = new LongPressDetector();
    longPress.onLongPress = () => {
      longPressAction?.();
    };
    longPress.onShortPress = () => {
      if (hapticFeedback) {
        triggerHapticFeedback('light');
      }
    };

    // Swipe detector
    const swipeDetector = new TouchGestureDetector();
    swipeDetector.onSwipe = (gesture) => {
      if (gesture.direction === 'left' && swipeActions?.left) {
        triggerHapticFeedback('medium');
        swipeActions.left();
      } else if (gesture.direction === 'right' && swipeActions?.right) {
        triggerHapticFeedback('medium');
        swipeActions.right();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      setIsPressed(true);
      longPress.handleTouchStart(e);
      swipeDetector.handleTouchStart(e);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      setIsPressed(false);
      longPress.handleTouchEnd(e);
      swipeDetector.handleTouchEnd(e);
    };

    const handleTouchCancel = () => {
      setIsPressed(false);
      longPress.handleTouchCancel();
    };

    button.addEventListener('touchstart', handleTouchStart);
    button.addEventListener('touchend', handleTouchEnd);
    button.addEventListener('touchcancel', handleTouchCancel);

    return () => {
      button.removeEventListener('touchstart', handleTouchStart);
      button.removeEventListener('touchend', handleTouchEnd);
      button.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [hapticFeedback, longPressAction, swipeActions]);

  const touchStyles = getTouchOptimizedStyles(size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md');

  return (
    <Button
      ref={buttonRef}
      onClick={onClick}
      className={cn(
        'transition-all duration-150',
        isPressed && 'scale-95',
        className
      )}
      style={{
        ...touchStyles,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
      size={size}
      {...props}
    >
      {children}
    </Button>
  );
};

// Swipeable card component for mobile interactions
interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onLongPress?: () => void;
  onTap?: () => void;
  className?: string;
  disabled?: boolean;
  leftAction?: {
    label: string;
    color: string;
    icon?: React.ReactNode;
  };
  rightAction?: {
    label: string;
    color: string;
    icon?: React.ReactNode;
  };
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onLongPress,
  onTap,
  className,
  disabled = false,
  leftAction,
  rightAction,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || disabled) return;

    const gestureDetector = new TouchGestureDetector();
    const longPress = new LongPressDetector();

    gestureDetector.onSwipe = (gesture) => {
      if (gesture.direction === 'left' && onSwipeLeft) {
        triggerHapticFeedback('medium');
        onSwipeLeft();
      } else if (gesture.direction === 'right' && onSwipeRight) {
        triggerHapticFeedback('medium');
        onSwipeRight();
      }
    };

    longPress.onLongPress = () => {
      onLongPress?.();
    };

    longPress.onShortPress = () => {
      if (onTap) {
        triggerHapticFeedback('light');
        onTap();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      setIsPressed(true);
      gestureDetector.handleTouchStart(e);
      longPress.handleTouchStart(e);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      setIsPressed(false);
      setSwipeOffset(0);
      gestureDetector.handleTouchEnd(e);
      longPress.handleTouchEnd(e);
    };

    const handleTouchCancel = () => {
      setIsPressed(false);
      setSwipeOffset(0);
      longPress.handleTouchCancel();
    };

    card.addEventListener('touchstart', handleTouchStart);
    card.addEventListener('touchend', handleTouchEnd);
    card.addEventListener('touchcancel', handleTouchCancel);

    return () => {
      card.removeEventListener('touchstart', handleTouchStart);
      card.removeEventListener('touchend', handleTouchEnd);
      card.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [onSwipeLeft, onSwipeRight, onLongPress, onTap, disabled]);

  return (
    <div className="relative overflow-hidden">
      {/* Background actions */}
      {(leftAction || rightAction) && (
        <div className="absolute inset-0 flex">
          {leftAction && (
            <div 
              className={cn(
                'flex items-center justify-center px-4 text-white font-medium text-sm',
                leftAction.color
              )}
              style={{ width: '50%' }}
            >
              {leftAction.icon}
              <span className="ml-2">{leftAction.label}</span>
            </div>
          )}
          {rightAction && (
            <div 
              className={cn(
                'flex items-center justify-center px-4 text-white font-medium text-sm ml-auto',
                rightAction.color
              )}
              style={{ width: '50%' }}
            >
              <span className="mr-2">{rightAction.label}</span>
              {rightAction.icon}
            </div>
          )}
        </div>
      )}
      
      {/* Main card content */}
      <div
        ref={cardRef}
        className={cn(
          'bg-white transition-all duration-200',
          'touch-manipulation select-none',
          isPressed && 'scale-[0.98]',
          disabled && 'opacity-50 pointer-events-none',
          className
        )}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Pull to refresh component
interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void> | void;
  isRefreshing?: boolean;
  threshold?: number;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  isRefreshing = false,
  threshold = 80,
  className,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startY = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        currentY.current = e.touches[0].clientY;
        const diff = currentY.current - startY.current;
        
        if (diff > 0) {
          setIsPulling(true);
          setPullDistance(Math.min(diff, threshold * 1.5));
          
          // Prevent default scrolling when pulling down
          if (diff > 10) {
            e.preventDefault();
          }
        }
      }
    };

    const handleTouchEnd = async () => {
      if (isPulling) {
        if (pullDistance >= threshold) {
          triggerHapticFeedback('medium');
          await onRefresh();
        }
        
        setIsPulling(false);
        setPullDistance(0);
      }
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, pullDistance, threshold, onRefresh]);

  const progress = pullDistance / threshold;
  const shouldRefresh = progress >= 1;

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Pull indicator */}
      <div 
        className={cn(
          'absolute top-0 left-0 right-0 z-10',
          'flex items-center justify-center',
          'bg-gray-50 text-gray-600 text-sm',
          'transition-all duration-200'
        )}
        style={{
          height: pullDistance,
          opacity: isPulling ? 1 : 0,
        }}
      >
        {isRefreshing ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
            <span>Refreshing...</span>
          </div>
        ) : shouldRefresh ? (
          <div className="flex items-center gap-2">
            <span>Release to refresh</span>
            <span className="text-lg">↻</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span>Pull to refresh</span>
            <span 
              className="text-lg transition-transform duration-100"
              style={{ transform: `rotate(${progress * 180}deg)` }}
            >
              ↓
            </span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div
        ref={containerRef}
        className="overflow-auto"
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 200ms',
        }}
      >
        {children}
      </div>
    </div>
  );
};