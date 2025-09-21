import { toast } from "@/components/ui/sonner";

interface MobileToastOptions {
  title: string;
  description: string;
  variant?: "default" | "destructive";
}

export const useMobileToast = () => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  
  const showToast = (options: MobileToastOptions) => {
    console.log('📢 Toast called on mobile:', isMobile, options);
    
    if (options.variant === 'destructive') {
      toast.error(options.title, {
        description: options.description
      });
    } else {
      toast.success(options.title, {
        description: options.description
      });
    }
  };
  
  return {
    toast: showToast
  };
};