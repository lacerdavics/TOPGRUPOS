import { useToast as useOriginalToast } from "@/hooks/use-toast";

interface MobileToastOptions {
  title: string;
  description: string;
  variant?: "default" | "destructive";
}

export const useMobileToast = () => {
  const originalToast = useOriginalToast();
  
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  
  const showMobileAlert = (options: MobileToastOptions) => {
    // Create a custom mobile toast element that doesn't rely on animations
    const toastDiv = document.createElement('div');
    toastDiv.className = 'mobile-toast-alert';
    toastDiv.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      left: 16px !important;
      right: 16px !important;
      background: ${options.variant === 'destructive' ? '#dc2626' : '#059669'} !important;
      color: white !important;
      padding: 16px !important;
      border-radius: 12px !important;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5) !important;
      z-index: 999999 !important;
      font-weight: 600 !important;
      font-size: 14px !important;
      backdrop-filter: blur(8px) !important;
      border: 2px solid ${options.variant === 'destructive' ? '#ef4444' : '#10b981'} !important;
      opacity: 1 !important;
      visibility: visible !important;
      display: block !important;
      transform: none !important;
      transition: none !important;
      animation: none !important;
    `;
    
    toastDiv.innerHTML = `
      <div style="font-weight: 700; margin-bottom: 4px;">${options.title}</div>
      <div style="opacity: 0.9;">${options.description}</div>
    `;
    
    document.body.appendChild(toastDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (document.body.contains(toastDiv)) {
        document.body.removeChild(toastDiv);
      }
    }, 5000);
    
    console.log('📱 Mobile toast shown:', options);
  };
  
  const toast = (options: MobileToastOptions) => {
    console.log('📢 Toast called on mobile:', isMobile, options);
    
    if (isMobile) {
      // Use custom mobile implementation
      showMobileAlert(options);
    } else {
      // Use original toast for desktop
      originalToast.toast(options);
    }
  };
  
  return {
    ...originalToast,
    toast
  };
};