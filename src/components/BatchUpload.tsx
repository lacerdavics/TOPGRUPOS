import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, Play, Pause, Square, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { telegramBatchService } from '@/services/telegramBatchService';
import { addGroup } from '@/services/groupService';
import { webpConversionService } from '@/services/webpConversionService';
import { decodeHtmlEntities } from '@/lib/utils';
import { User } from 'firebase/auth';

interface BatchItem {
  url: string;
  category: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  groupData?: any;
  error?: string;
  index: number;
}

interface BatchUploadProps {
  currentUser: User;
  onProcessItem?: (url: string, category: string) => Promise<void>;
}

export const BatchUpload = ({ currentUser, onProcessItem }: BatchUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    processed: 0,
    success: 0,
    errors: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const processingRef = useRef(false);

  const parseFile = async (file: File): Promise<BatchItem[]> => {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    const parsed: BatchItem[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return; // Skip empty lines and comments

      const parts = trimmed.split('|').map(p => p.trim());
      if (parts.length !== 2) {
        console.warn(`Linha ${index + 1} inválida: ${trimmed}`);
        return;
      }

      const [url, categoryPart] = parts;
      const category = categoryPart.replace('categoria:', '').trim();

      if (!url.includes('t.me/')) {
        console.warn(`URL inválida na linha ${index + 1}: ${url}`);
        return;
      }

      parsed.push({
        url,
        category,
        status: 'pending',
        index: index + 1
      });
    });

    return parsed;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.txt')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo .txt",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    
    try {
      const parsedItems = await parseFile(selectedFile);
      setItems(parsedItems);
      setStats({
        total: parsedItems.length,
        processed: 0,
        success: 0,
        errors: 0
      });
      setCurrentIndex(0);

      toast({
        title: "Arquivo carregado!",
        description: `${parsedItems.length} grupos encontrados para importação`,
      });
    } catch (error) {
      toast({
        title: "Erro ao ler arquivo",
        description: "Verifique o formato do arquivo",
        variant: "destructive",
      });
    }
  };

  const processItem = async (item: BatchItem): Promise<void> => {
    console.log(`🔄 Processando item ${item.index}: ${item.url}`);
    
    // Update status to processing
    setItems(prev => prev.map(i => 
      i.index === item.index ? { ...i, status: 'processing' } : i
    ));

    try {
      if (onProcessItem) {
        // Use parent component's processing function (normal form flow)
        await onProcessItem(item.url, item.category);
        
        // Update success status
        setItems(prev => prev.map(i => 
          i.index === item.index ? { 
            ...i, 
            status: 'success'
          } : i
        ));

        setStats(prev => ({
          ...prev,
          processed: prev.processed + 1,
          success: prev.success + 1
        }));
      } else {
        throw new Error("Função de processamento não definida");
      }

    } catch (error) {
      console.error(`❌ Erro ao processar item ${item.index}:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setItems(prev => prev.map(i => 
        i.index === item.index ? { 
          ...i, 
          status: 'error', 
          error: errorMessage 
        } : i
      ));

      setStats(prev => ({
        ...prev,
        processed: prev.processed + 1,
        errors: prev.errors + 1
      }));
    }
  };

  const startProcessing = async () => {
    if (items.length === 0) return;
    
    setIsProcessing(true);
    setIsPaused(false);
    processingRef.current = true;

    toast({
      title: "Iniciando importação em lote",
      description: `Processando ${items.length} grupos...`,
    });

    for (let i = currentIndex; i < items.length; i++) {
      if (!processingRef.current) break; // Check if stopped
      if (isPaused) break; // Check if paused

      setCurrentIndex(i);
      const item = items[i];
      
      if (item.status === 'pending') {
        await processItem(item);
      }

      // Small delay between items to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (currentIndex >= items.length - 1) {
      setIsProcessing(false);
      toast({
        title: "Importação concluída!",
        description: `${stats.success + 1} grupos importados com sucesso, ${stats.errors} erros`,
      });
    }
  };

  const pauseProcessing = () => {
    setIsPaused(true);
    processingRef.current = false;
  };

  const stopProcessing = () => {
    setIsProcessing(false);
    setIsPaused(false);
    processingRef.current = false;
    setCurrentIndex(0);
  };

  const resetBatch = () => {
    setFile(null);
    setItems([]);
    setCurrentIndex(0);
    setIsProcessing(false);
    setIsPaused(false);
    setStats({ total: 0, processed: 0, success: 0, errors: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Upload className="w-5 h-5" />
          Importação em Lote (Admin)
          <Badge variant="secondary" className="ml-2">BETA</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="batch-file">Arquivo de Grupos (.txt)</Label>
          <div className="flex gap-2">
            <Input
              ref={fileInputRef}
              id="batch-file"
              type="file"
              accept=".txt"
              onChange={handleFileSelect}
              disabled={isProcessing}
              className="flex-1"
            />
            {file && (
              <Button variant="outline" onClick={resetBatch} disabled={isProcessing}>
                Limpar
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Formato: https://t.me/grupo | categoria: nome-categoria
          </p>
        </div>

        {/* Stats and Progress */}
        {items.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.processed}</div>
                <div className="text-xs text-muted-foreground">Processados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.success}</div>
                <div className="text-xs text-muted-foreground">Sucessos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
                <div className="text-xs text-muted-foreground">Erros</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso: {currentIndex + 1} de {stats.total}</span>
                <span>{Math.round(((stats.processed) / stats.total) * 100)}%</span>
              </div>
              <Progress value={(stats.processed / stats.total) * 100} className="h-2" />
            </div>
          </div>
        )}

        {/* Control Buttons */}
        {items.length > 0 && (
          <div className="flex gap-2">
            {!isProcessing ? (
              <Button onClick={startProcessing} className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Iniciar Importação
              </Button>
            ) : (
              <>
                <Button onClick={pauseProcessing} variant="outline" className="flex items-center gap-2">
                  <Pause className="w-4 h-4" />
                  Pausar
                </Button>
                <Button onClick={stopProcessing} variant="destructive" className="flex items-center gap-2">
                  <Square className="w-4 h-4" />
                  Parar
                </Button>
              </>
            )}
          </div>
        )}

        {/* Items Preview (Show only last 10 items for performance) */}
        {items.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            <h4 className="font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Preview dos Grupos {items.length > 10 && `(últimos 10 de ${items.length})`}
            </h4>
            {items.slice(-10).map((item) => (
              <div
                key={item.index}
                className={`p-2 rounded-lg border text-xs ${
                  item.status === 'processing' ? 'bg-blue-50 border-blue-200' :
                  item.status === 'success' ? 'bg-green-50 border-green-200' :
                  item.status === 'error' ? 'bg-red-50 border-red-200' :
                  'bg-muted border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-mono">{item.url}</div>
                    <div className="text-muted-foreground">
                      Categoria: {item.category}
                      {item.groupData && ` | ${item.groupData.name}`}
                    </div>
                    {item.error && (
                      <div className="text-red-600 mt-1">{item.error}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {item.status === 'processing' && (
                      <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                    )}
                    {item.status === 'success' && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                    {item.status === 'error' && (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <Badge variant="outline" className="text-xs">
                      #{item.index}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};