import { useState } from "react";
import { Group } from "@/components/GroupCard";
import GroupSelector from "@/components/GroupSelector";
import PromotionPlans from "@/components/PromotionPlans";
import PaymentDisplay from "@/components/PaymentDisplay";

type FlowStep = 'plan-selection' | 'group-selection' | 'payment';

const PromotionFlow = () => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('plan-selection');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [pixCode, setPixCode] = useState<string>('');

  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
    setCurrentStep('group-selection');
  };

  const handleGroupSelect = (group: Group) => {
    setSelectedGroup(group);
    setCurrentStep('payment');
  };

  const handleBackToPlans = () => {
    setSelectedGroup(null);
    setSelectedPlanId('');
    setCurrentStep('plan-selection');
  };

  const handleBackToGroups = () => {
    setQrCode('');
    setPixCode('');
    setCurrentStep('group-selection');
  };

  const handlePaymentGenerated = (qrCodeData: string, pixCodeData: string) => {
    setQrCode(qrCodeData);
    setPixCode(pixCodeData);
  };

  switch (currentStep) {
    case 'plan-selection':
      return (
        <PromotionPlans 
          onPlanSelect={handlePlanSelect}
          onBack={() => {}}
        />
      );
      
    case 'group-selection':
      return (
        <GroupSelector 
          onGroupSelect={handleGroupSelect}
          onBack={handleBackToPlans}
          selectedPlanId={selectedPlanId}
        />
      );
    
    case 'payment':
      return (
        <PaymentDisplay 
          qrCode={qrCode}
          pixCode={pixCode}
          selectedGroup={selectedGroup!}
          selectedPlanId={selectedPlanId}
          onBack={handleBackToGroups}
          onPaymentGenerated={handlePaymentGenerated}
        />
      );
    
    default:
      return null;
  }
};

export default PromotionFlow;