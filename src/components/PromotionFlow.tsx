import { useState } from "react";
import { Group } from "@/components/GroupCard";
import GroupSelector from "@/components/GroupSelector";
import PromotionPlans from "@/components/PromotionPlans";
import PaymentDisplay from "@/components/PaymentDisplay";

type FlowStep = 'group-selection' | 'plan-selection' | 'payment';

const PromotionFlow = () => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('group-selection');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [pixCode, setPixCode] = useState<string>('');

  const handleGroupSelect = (group: Group) => {
    setSelectedGroup(group);
    setCurrentStep('plan-selection');
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
    setCurrentStep('payment');
  };

  const handleBackToGroups = () => {
    setSelectedGroup(null);
    setSelectedPlanId('');
    setCurrentStep('group-selection');
  };

  const handleBackToPlans = () => {
    setQrCode('');
    setPixCode('');
    setCurrentStep('plan-selection');
  };

  const handlePaymentGenerated = (qrCodeData: string, pixCodeData: string) => {
    setQrCode(qrCodeData);
    setPixCode(pixCodeData);
  };

  switch (currentStep) {
    case 'group-selection':
      return (
        <GroupSelector 
          onGroupSelect={handleGroupSelect}
          onBack={() => {}}
        />
      );

    case 'plan-selection':
      return (
        <PromotionPlans 
          onPlanSelect={handlePlanSelect}
          onBack={handleBackToGroups}
          selectedGroup={selectedGroup!}
        />
      );

    case 'payment':
      return (
        <PaymentDisplay 
          qrCode={qrCode}
          pixCode={pixCode}
          selectedGroup={selectedGroup!}
          selectedPlanId={selectedPlanId}
          onBack={handleBackToPlans}
          onPaymentGenerated={handlePaymentGenerated}
        />
      );

    default:
      return null;
  }
};

export default PromotionFlow;
