import { useState, useCallback } from 'react';
import { initializePromotion } from '@/services/promotionService';

export interface PromotionPlan {
  id: string;
  name: string;
  price: number;
  duration: number;
  features: string[];
  popular?: boolean;
  color: 'primary' | 'accent' | 'success';
  icon: string;
}

export const usePromotionPlans = () => {
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [pixCode, setPixCode] = useState<string>('');
  
  const plans: PromotionPlan[] = [
    {
      id: 'starter',
      name: 'Plano Starter',
      price: 30,
      duration: 7,
      color: 'accent',
      icon: '📅',
      features: [
        'Destaque na página inicial – fixo em "Em Alta"',
        'Posição privilegiada nas buscas',
        'Status VIP no grupo promovido',
        'Promoção válida por 1 semana'
      ]
    },
    {
      id: 'pro',
      name: 'Plano Pro',
      price: 100,
      duration: 30,
      popular: true,
      color: 'primary',
      icon: '⭐',
      features: [
        'Inclui todos os benefícios do Starter',
        'Direito a colocar banner fixo no topo da categoria do plano correspondente',
        'Prioridade máxima nas buscas',
        'Suporte VIP dedicado',
        'Relatórios detalhados de desempenho – acompanhe crescimento e resultados do seu grupo'
      ]
    },
    {
      id: 'elite',
      name: 'Plano Elite',
      price: 150,
      duration: 30,
      color: 'success',
      icon: '👑',
      features: [
        'Inclui todos os benefícios do Plano Pro',
        'Banner fixo no topo da página principal – visibilidade máxima para todos os visitantes',
        'Primeiro lugar nas buscas – prioridade absoluta, garantindo que novos membros te encontrem primeiro',
        'Suporte VIP premium – atendimento exclusivo e prioritário',
        'Destaque especial em todas as categorias – seu grupo se sobressai em qualquer lista',
        'Relatórios detalhados de desempenho – acompanhe crescimento, engajamento e resultados'
      ]
    }
  ];

  const promoteGroup = useCallback(async (planId: string, groupData?: any) => {
    setLoading(true);
    
    try {
      console.log(`Iniciando promoção com plano: ${planId}`, groupData);
      
      const plan = plans.find(p => p.id === planId);
      if (!plan) {
        throw new Error('Plano não encontrado');
      }

      if (!groupData) {
        throw new Error('Dados do grupo são obrigatórios');
      }

      console.log('Fazendo requisição para gerar PIX...');
      
      // Fazer requisição POST para gerar PIX
      const response = await fetch('https://pushinpay-backend-9d6h.onrender.com/gerar-pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valor: planId === 'starter' ? 30.00 : planId === 'pro' ? 100.00 : 150.00,
          groupId: groupData.id,
          groupName: groupData.name,
          category: groupData.category,
          telegramUrl: groupData.telegramUrl,
          planId: planId
        }),
      });

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta:', errorText);
        throw new Error(`Erro ao gerar PIX: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Dados recebidos da API:', data);
      
      if (!data.qr_code_base64) {
        console.error('QR Code não encontrado na resposta:', data);
        throw new Error('QR Code não foi retornado pela API');
      }
      
      console.log('Setting QR Code:', data.qr_code_base64?.substring(0, 50) + '...');
      setQrCode(data.qr_code_base64);
      setPixCode(data.qr_code);
      console.log('QR Code state should be updated now');
      
      // Initialize promotion tracking
      try {
        await initializePromotion(
          {
            groupId: groupData.id,
            groupName: groupData.name,
            telegramUrl: groupData.telegramUrl,
            category: groupData.category,
            imageUrl: groupData.profileImage
          },
          {
            planId: planId,
            planName: plan.name,
            planDuration: plan.duration
          },
          data.qr_code
        );
        console.log('✅ Promoção inicializada no banco de dados');
      } catch (initError) {
        console.error('❌ Erro ao inicializar promoção:', initError);
        // Não falha o fluxo, mas registra o erro
      }
      
      return { success: true, planId, qrCode: data.qr_code_base64, pixCode: data.qr_code };
    } catch (error) {
      console.error('Erro ao promover grupo:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro ao processar promoção' };
    } finally {
      setLoading(false);
    }
  }, [plans]);

  const calculateSavings = useCallback((planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return 0;
    
    const starterPlan = plans.find(p => p.id === 'starter');
    if (!starterPlan) return 0;
    
    const weeksInPlan = Math.ceil(plan.duration / 7);
    const totalStarterPrice = starterPlan.price * weeksInPlan;
    
    return Math.max(0, totalStarterPrice - plan.price);
  }, [plans]);

  return {
    plans,
    loading,
    promoteGroup,
    calculateSavings,
    qrCode,
    setQrCode,
    pixCode,
    setPixCode: (code: string) => setPixCode(code)
  };
};