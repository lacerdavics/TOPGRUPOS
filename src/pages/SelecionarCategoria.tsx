import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { categories } from "@/data/categories";
import CategoryIcon from "@/components/CategoryIcon";
import { ArrowLeft, Search, Check } from "lucide-react";
import { useResponsiveBreakpoints } from "@/hooks/useResponsiveBreakpoints";

const SelecionarCategoria = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('selected') || '');
  const { isMobile } = useResponsiveBreakpoints();
  
  const returnUrl = searchParams.get('return') || '/cadastrar';

  // Filtrar categorias baseado na busca
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    
    // Retornar para a página anterior com a categoria selecionada
    const url = new URL(window.location.origin + returnUrl);
    url.searchParams.set('categoria', categoryId);
    navigate(url.pathname + url.search);
  };

  const handleBack = () => {
    navigate(returnUrl);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button variant="ghost" onClick={handleBack} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            
            <h1 className="text-2xl font-bold mb-2">
              Selecionar <span className="text-primary">Categoria</span>
            </h1>
            <p className="text-muted-foreground">
              Escolha a categoria que melhor descreve seu grupo
            </p>
          </div>

          {/* Busca */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 bg-muted/50"
              />
            </div>
          </div>

          {/* Lista de Categorias */}
          <div className="space-y-3">
            {filteredCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  selectedCategory === category.id
                    ? 'border-primary bg-primary/5 shadow-lg'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Ícone da categoria */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center flex-shrink-0`}>
                    <CategoryIcon iconData={category.icon} size={24} color="white" />
                  </div>
                  
                  {/* Informações da categoria */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-lg">{category.name}</h3>
                      {selectedCategory === category.id && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {category.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Resultado da busca vazio */}
          {filteredCategories.length === 0 && searchTerm && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhuma categoria encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Não encontramos categorias com o termo "{searchTerm}"
              </p>
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Limpar Busca
              </Button>
            </div>
          )}

          {/* Botão de confirmação (se categoria selecionada) */}
          {selectedCategory && (
            <div className="fixed bottom-6 left-4 right-4 z-50">
              <Button 
                onClick={() => handleCategorySelect(selectedCategory)}
                className="w-full h-12 text-base shadow-lg"
                size="lg"
              >
                <Check className="w-5 h-5 mr-2" />
                Confirmar Categoria
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SelecionarCategoria;