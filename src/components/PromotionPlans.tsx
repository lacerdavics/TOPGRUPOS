import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePromotionPlans } from "@/hooks/usePromotionPlans";
import PromotionCard from "@/components/PromotionCard";

interface PromotionPlansProps {
  onPlanSelect: (planId: string) => void;
  onBack: () => void;
}

const PromotionPlans = ({ onPlanSelect, onBack }: PromotionPlansProps) => {
  const { plans, calculateSavings } = usePromotionPlans();

  const handlePlanSelect = (planId: string) => {
    onPlanSelect(planId);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Escolha seu plano</h1>
        <p className="text-muted-foreground">
          Selecione o plano ideal e depois escolha o grupo para promover
        </p>
      </div>

      {/* Plans Grid Compacto */}
      <div className="flex justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-[1024px]">
          {plans.map((plan) => (
            <div key={plan.id} className="w-full max-w-[320px] mx-auto">
              <PromotionCard
                plan={plan}
                onSelect={handlePlanSelect}
                savings={calculateSavings(plan.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromotionPlans;
