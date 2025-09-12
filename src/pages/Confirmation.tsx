import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";
import Footer from "@/components/Footer";

const Confirmation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const title = searchParams.get('title') || 'Confirmação';
  const description = searchParams.get('description') || 'Tem certeza que deseja continuar?';
  const confirmText = searchParams.get('confirmText') || 'Confirmar';
  const cancelText = searchParams.get('cancelText') || 'Cancelar';
  const variant = searchParams.get('variant') || 'default';
  const returnUrl = searchParams.get('returnUrl') || '/';
  const confirmAction = searchParams.get('confirmAction');

  const handleConfirm = () => {
    if (confirmAction) {
      // Execute the confirmation action
      // This would need to be implemented based on the specific action
      console.log('Confirming action:', confirmAction);
    }
    navigate(returnUrl);
  };

  const handleCancel = () => {
    navigate(returnUrl);
  };

  const isDestructive = variant === 'destructive';

  return (
    <div className="min-h-screen bg-background">
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Back Button */}
          <Button 
            onClick={handleCancel} 
            variant="ghost" 
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          {/* Confirmation Card */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border">
            <div className="text-center space-y-6">
              {/* Icon */}
              <div className="flex justify-center">
                {isDestructive ? (
                  <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">{title}</h1>
                <p className="text-muted-foreground">{description}</p>
              </div>
              
              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  className="flex-1"
                >
                  {cancelText}
                </Button>
                <Button
                  onClick={handleConfirm}
                  variant={isDestructive ? 'destructive' : 'default'}
                  className="flex-1"
                >
                  {confirmText}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Confirmation;