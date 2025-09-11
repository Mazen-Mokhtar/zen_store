import { useEffect } from 'react';

/**
 * Custom hook to prevent body scrolling when modals are open
 * @param isLocked - Whether scrolling should be locked
 */
export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (isLocked) {
      // Store the current scroll position
      const scrollY = window.scrollY;
      
      // Apply styles to prevent scrolling
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      // Also prevent scrolling on html element for better browser support
      document.documentElement.style.overflow = 'hidden';
      
      return () => {
        // Restore original styles
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [isLocked]);
}