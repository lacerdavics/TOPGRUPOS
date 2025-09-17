import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { checkIsAdmin } from '@/services/userService';
import { uploadBanner } from '@/services/bannerService';
import { Upload, Calendar, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Footer from '@/components/Footer';

const UploadBanner = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [durationDays, setDurationDays] = useState<number>(7);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useState(() => {
    const checkAdminStatus = async () => {
      if (!currentUser) {
        navigate('/auth?redirect=/upload-banner');
        return;
      }

      const adminStatus = await checkIsAdmin(currentUser.uid);
      if (!adminStatus) {
        toast.error('Acesso negado. Apenas administradores podem fazer upload de banners.');
        navigate('/');
        return;
      }

      setIsAdmin(true);
      setCheckingAuth(false);
    };

    checkAdminStatus();
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('webp')) {
      toast.error('Apenas arquivos WebP são aceitos');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Máximo 10MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !currentUser) return;

    if (durationDays < 1 || durationDays > 365) {
      toast.error('Duração deve ser entre 1 e 365 dias');
      return;
    }

    setUploading(true);

    try {
      const bannerId = await uploadBanner(
        selectedFile,
        durationDays,
        currentUser.uid,
        currentUser.email || ''
      );

      toast.success(`Banner carregado com sucesso! Ativo por ${durationDays} dias.`);
      navigate('/');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer upload';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            
            <h1 className="text-3xl font-bold mb-2">
              Upload de <span className="text-primary">Banner</span>
            </h1>
            <p className="text-muted-foreground">
              Faça upload de um banner para exibir no espaço publicitário
            </p>
          </div>

          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload de Banner Publicitário
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="banner-file" className="text-sm font-medium">
                  Arquivo do Banner *
                </Label>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".webp"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full h-14 border-2 border-dashed border-amber-300 hover:border-amber-400 bg-amber-50/50 hover:bg-amber-50 dark:bg-amber-950/20 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-300"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  {selectedFile ? selectedFile.name : 'Clique para selecionar arquivo WebP'}
                </Button>
                
                <p className="text-sm text-muted-foreground">
                  Apenas arquivos WebP (animado ou estático). Máximo 10MB.
                </p>
                {selectedFile && (
                  <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                    ✅ {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                  </div>
                )}
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-sm font-medium">
                  Por quantos dias o banner ficará ativo? *
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="365"
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value) || 7)}
                  placeholder="7 dias"
                  disabled={uploading}
                  className="h-12 text-base"
                />
                <p className="text-sm text-muted-foreground">
                  Entre 1 e 365 dias. O banner será automaticamente removido após este período.
                </p>
              </div>

              {/* Preview */}
              {selectedFile && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Preview</Label>
                  <div className="border border-border rounded-lg p-4 bg-muted/30 max-h-64 overflow-hidden">
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="Preview do banner"
                      className="w-full max-h-48 object-contain rounded mx-auto"
                    />
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-semibold mb-2">Informações importantes:</p>
                    <ul className="space-y-1 text-sm">
                      <li>• O banner será exibido para todos os usuários</li>
                      <li>• Apenas um banner pode estar ativo por vez</li>
                      <li>• Banners anteriores serão automaticamente desativados</li>
                      <li>• O banner será removido automaticamente após {durationDays} dias</li>
                      <li>• Recomendado: imagens quadradas ou retangulares (300x300px ou 600x300px)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  disabled={uploading}
                  className="w-full sm:flex-1 h-12 text-base"
                >
                  Cancelar
                </Button>
                
                <Button
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile || durationDays < 1}
                  className="w-full sm:flex-1 h-12 text-base bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Publicar Banner
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UploadBanner;