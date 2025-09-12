import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ModernModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  showCloseButton?: boolean;
}

const sizeVariants = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  full: 'sm:max-w-4xl'
};

export const ModernModal: React.FC<ModernModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'md',
  className,
  headerClassName,
  contentClassName,
  showCloseButton = true
}) => {
  const titleId = React.useId();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          sizeVariants[size],
          contentClassName,
          className
        )}
        aria-labelledby={titleId}
      >
        <DialogHeader className={cn("text-center space-y-2", headerClassName)}>
          <DialogTitle id={titleId} className={cn("text-xl", !title && "sr-only")}>
            {title || "Dialog"}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className="space-y-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModernModal;