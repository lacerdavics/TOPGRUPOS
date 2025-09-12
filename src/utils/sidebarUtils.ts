// Utility functions for sidebar responsive behavior

export const getSidebarConfig = (isMobile: boolean, isTablet: boolean) => {
  return {
    shouldShowTrigger: isMobile || isTablet,
    shouldCollapse: isMobile || isTablet,
    defaultOpen: !(isMobile || isTablet),
    headerClass: (isMobile || isTablet) ? 'pt-16' : '',
    sidebarWidth: isMobile ? 'max-w-xs' : isTablet ? 'max-w-sm' : 'w-60'
  };
};

// Force scroll enable for specific elements
export const enableScrollForElement = (element: HTMLElement | null) => {
  if (!element) return;
  
  element.style.overflow = 'auto';
  (element.style as any).webkitOverflowScrolling = 'touch';
  element.style.overscrollBehavior = 'contain';
  element.setAttribute('data-scroll', 'true');
};

// Reset sidebar state on breakpoint change
export const resetSidebarState = () => {
  // Force a small delay to allow CSS transitions to complete
  setTimeout(() => {
    const scrollElements = document.querySelectorAll('[data-scroll="true"]');
    scrollElements.forEach(el => {
      if (el instanceof HTMLElement) {
        enableScrollForElement(el);
      }
    });
  }, 300);
};