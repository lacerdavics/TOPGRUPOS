import React, { useMemo } from 'react';
import { useInView } from 'react-intersection-observer';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  groupName?: string;
  priority?: boolean;
}

const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  className = "", 
  placeholder,
  groupName,
  priority = false
}) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '50px',
    skip: priority,
  });

  const placeholderLetter = useMemo(() => {
    return groupName ? groupName.charAt(0).toUpperCase() : placeholder || '?';
  }, [groupName, placeholder]);

  const shouldLoad = priority || inView;

  return (
    <div ref={priority ? undefined : ref} className={`relative overflow-hidden ${className}`}>
      {shouldLoad ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-contain antialiased group-image"
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `
                <div class="w-full h-full bg-gradient-to-br from-muted/50 to-muted/80 flex items-center justify-center">
                  <span class="text-4xl font-bold text-muted-foreground/60">${placeholderLetter}</span>
                </div>
              `;
            }
          }}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-muted/30 to-muted/50 flex items-center justify-center">
          <span className="text-4xl font-bold text-muted-foreground/40">
            {placeholderLetter}
          </span>
        </div>
      )}
    </div>
  );
};

export default LazyImage;