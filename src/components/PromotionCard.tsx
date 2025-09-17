import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar, Star } from "lucide-react";
import { PromotionPlan } from "@/hooks/usePromotionPlans";
import { cn } from "@/lib/utils";

interface PromotionCardProps {
  plan: PromotionPlan;
  onSelect: (planId: string) => void;
  savings?: number;
}

const PromotionCard = ({ plan, onSelect, savings }: PromotionCardProps) => {
  const getColorClasses = (color: string, popular?: boolean) => {
    const baseClasses = "rounded-xl border backdrop-blur-sm relative transition-all duration-300 hover:scale-105";
    
    if (popular) {
      return cn(baseClasses, 
        "border-2 border-primary/20 hover:border-primary/40",
        "bg-gradient-to-br from-card to-primary/5",
        "shadow-lg hover:shadow-xl"
      );
    }
    
    switch (color) {
      case 'accent':
        return cn(baseClasses,
          "border-2 border-accent/20 hover:border-accent/40", 
          "bg-gradient-to-br from-card to-accent/5",
          "hover:shadow-xl"
        );
      case 'success':
        return cn(baseClasses,
          "border-2 border-success/20 hover:border-success/40",
          "bg-gradient-to-br from-card to-success/5", 
          "hover:shadow-xl"
        );
      default:
        return cn(baseClasses,
          "border-2 border-primary/20 hover:border-primary/40",
          "bg-gradient-to-br from-card to-primary/5",
          "hover:shadow-xl"
        );
    }
  };

  const getButtonClasses = (color: string, popular?: boolean) => {
    if (popular) {
      return "w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105";
    }
    
    switch (color) {
      case 'accent':
        return "w-full bg-accent hover:bg-accent-dark text-accent-foreground shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105";
      case 'success':
        return "w-full bg-success hover:bg-success text-success-foreground shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105";
      default:
        return "w-full bg-primary hover:bg-primary-dark text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105";
    }
  };

  const getIconElement = (color: string) => {
    const iconClasses = `w-8 sm:w-10 lg:w-12 h-8 sm:h-10 lg:h-12 mx-auto mb-3 sm:mb-4`;
    
    switch (color) {
      case 'accent':
        return <Calendar className={cn(iconClasses, "text-accent")} />;
      case 'success':
        return <CheckCircle className={cn(iconClasses, "text-success")} />;
      default:
        return <Star className={cn(iconClasses, "text-primary")} />;
    }
  };

  return (
    <Card className={cn("p-4 sm:p-6 lg:p-8", getColorClasses(plan.color, plan.popular))}>
      {plan.popular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs">
          Mais Popular
        </Badge>
      )}
      
      <div className="text-center mb-4 sm:mb-6">
        <div className="text-2xl sm:text-3xl lg:text-4xl mb-3 sm:mb-4">{plan.icon}</div>
        {getIconElement(plan.color)}
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2">{plan.name}</h3>

        {/* Preço */}
        <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">R$ {plan.price}</div>

        {/* Tempo destacado sem o 0 */}
        {plan.duration !== undefined && plan.duration !== null && Number(plan.duration) > 0 && (
          <div className="my-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-primary">{plan.duration}</span>
            <span className="ml-1 text-sm sm:text-base text-muted-foreground">dias de destaque</span>
          </div>
        )}

        {/* Economia */}
        {savings && savings > 0 && (
          <div className="text-xs sm:text-sm text-success font-medium mt-1">
            Economia de R$ {savings}
          </div>
        )}
      </div>
      
      {/* Features */}
      <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
        {plan.features.map((feature, index) => (
          <div key={index} className="flex items-start gap-2">
            <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-success flex-shrink-0 mt-0.5" />
            <span className={cn(
              "text-sm sm:text-base leading-relaxed",
              index < 1 ? "" : index === 1 && plan.popular ? "font-semibold" : ""
            )}>
              {feature}
            </span>
          </div>
        ))}
      </div>
      
      {/* Botão */}
      <Button 
        onClick={() => onSelect(plan.id)}
        className={cn("text-sm sm:text-base", getButtonClasses(plan.color, plan.popular))}
      >
        {plan.color === 'accent' ? <Calendar className="w-4 sm:w-5 h-4 sm:h-5 mr-2" /> : <Star className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />}
        Selecionar
      </Button>
    </Card>
  );
};

export default PromotionCard;
