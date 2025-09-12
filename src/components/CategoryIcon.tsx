import React from 'react';
import Lottie from 'lottie-react';

export interface IconData {
  type: 'lucide' | 'svg' | 'lottie';
  content: any; // LucideIcon component, SVG string, or Lottie animation data
}

interface CategoryIconProps {
  iconData: IconData;
  size?: number;
  className?: string;
  color?: string;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({ 
  iconData, 
  size = 24, 
  className = "", 
  color = "currentColor" 
}) => {
  switch (iconData.type) {
    case 'lucide':
      const LucideIcon = iconData.content;
      return <LucideIcon size={size} className={className} color={color} />;
      
    case 'svg':
      return (
        <div 
          className={`inline-block ${className}`}
          style={{ width: size, height: size }}
          dangerouslySetInnerHTML={{ __html: iconData.content }}
        />
      );
      
    case 'lottie':
      return (
        <div className={`inline-block ${className}`} style={{ width: size, height: size }}>
          <Lottie 
            animationData={iconData.content} 
            loop={true}
            autoplay={true}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      );
      
    default:
      return null;
  }
};

export default CategoryIcon;