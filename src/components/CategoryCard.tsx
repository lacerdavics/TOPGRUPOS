import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Category } from "@/data/categories";
import { Link, useNavigate } from "react-router-dom";
import CategoryIcon from "@/components/CategoryIcon";

interface CategoryCardProps {
  category: Category;
}

const CategoryCard = ({ category }: CategoryCardProps) => {
  const navigate = useNavigate();

  const handleCategoryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/categoria/${category.id}`);
  };

  return (
    <Card className="card-category group h-full cursor-pointer min-h-[8rem] sm:min-h-[9rem] w-full" onClick={handleCategoryClick}>
      <CardContent className="p-0 h-full">
        {/* Category Header with Clean Modern Design */}
        <div className={`bg-gradient-to-br ${category.color} relative overflow-hidden h-20 sm:h-24 md:h-32`}>
          {/* Subtle Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-black/10"></div>
          
          {/* Background Icon */}
          <div className="absolute -right-1 -top-1 sm:-right-2 sm:-top-2 opacity-8 group-hover:opacity-15 transition-opacity duration-300">
            <CategoryIcon iconData={category.icon} size={40} color="white" className="sm:w-[60px] sm:h-[60px]" />
          </div>
          
          {/* Content */}
          <div className="relative z-10 p-3 sm:p-4 md:p-5 h-full flex items-end">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-card/12 backdrop-blur-sm rounded-xl sm:rounded-2xl shrink-0">
                <CategoryIcon iconData={category.icon} size={14} color="hsl(var(--card-foreground))" className="sm:w-[18px] sm:h-[18px]" />
              </div>
              <h3 className="card-title text-card-foreground text-sm sm:text-base md:text-lg font-medium leading-tight">{category.name}</h3>
            </div>
          </div>
        </div>
        
        {/* Content Section */}
        <div className="p-3 sm:p-4 md:p-5 flex flex-col justify-center h-16 sm:h-20">
          <Button className="card-button-primary text-xs sm:text-sm">
            Ver Grupos
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryCard;