import { pipeline } from "@huggingface/transformers";
import { Group } from "@/components/GroupCard";

// Cache para o modelo de embeddings
let embeddingModel: any = null;

// Inicializar o modelo de embeddings
const getEmbeddingModel = async () => {
  if (!embeddingModel) {
    try {
      embeddingModel = await pipeline(
        "feature-extraction",
        "mixedbread-ai/mxbai-embed-xsmall-v1",
        { device: "webgpu" }
      );
    } catch (error) {
      console.warn("WebGPU não disponível, usando CPU:", error);
      embeddingModel = await pipeline(
        "feature-extraction",
        "mixedbread-ai/mxbai-embed-xsmall-v1"
      );
    }
  }
  return embeddingModel;
};

// Calcular similaridade de cosseno entre dois vetores
const cosineSimilarity = (a: number[], b: number[]): number => {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
};

// Extrair palavras-chave contextuais de um grupo
const extractContextKeywords = (group: Group): string[] => {
  const keywords: string[] = [];
  
  // Palavras do nome e descrição
  const text = `${group.name} ${group.description}`.toLowerCase();
  
  // Padrões comuns em grupos
  const patterns = {
    jogos: /\b(game|gaming|jogos?|play|player|rpg|mmo|fps|strategy|gamer)\b/g,
    tecnologia: /\b(tech|tecnologia|programação|código|developer|dev|software|hardware|ai|ia|python|javascript|react|node)\b/g,
    vendas: /\b(venda|vendas|compra|loja|store|shop|mercado|negócio|produto|serviço)\b/g,
    educação: /\b(curso|aula|ensino|educação|estudo|professor|aluno|faculdade|universidade|escola)\b/g,
    entretenimento: /\b(filme|música|série|show|arte|cultura|diversão|entretenimento|hobby)\b/g,
    esportes: /\b(futebol|basquete|vôlei|esporte|time|clube|atleta|treino|academia|fitness)\b/g,
    cidade: /\b(cidade|região|bairro|local|área|zona|centro|sul|norte|leste|oeste)\b/g,
    profissional: /\b(trabalho|emprego|carreira|profissional|networking|linkedin|cv|currículo)\b/g,
    saude: /\b(saúde|médico|medicina|hospital|clínica|psicologia|terapia|bem-estar)\b/g,
    financas: /\b(dinheiro|investimento|ações|crypto|bitcoin|forex|trading|economia|finanças)\b/g
  };
  
  // Detectar padrões e adicionar palavras-chave
  Object.entries(patterns).forEach(([category, pattern]) => {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      keywords.push(category);
      // Adicionar variações específicas encontradas
      matches.forEach(match => keywords.push(match));
    }
  });
  
  // Extrair palavras significativas (mais de 3 caracteres)
  const words = text.match(/\b\w{4,}\b/g) || [];
  keywords.push(...words.slice(0, 10)); // Limitar para não sobrecarregar
  
  return [...new Set(keywords)]; // Remove duplicatas
};

// Busca inteligente usando embeddings semânticos
export const intelligentSearch = async (
  searchTerm: string, 
  groups: Group[], 
  maxResults: number = 50
): Promise<Group[]> => {
  if (!searchTerm.trim()) {
    return groups;
  }
  
  try {
    const model = await getEmbeddingModel();
    
    // Gerar embedding para o termo de busca
    const searchEmbedding = await model(searchTerm, { pooling: "mean", normalize: true });
    const searchVector = Array.from(searchEmbedding.data) as number[];
    
    // Calcular pontuações para cada grupo
    const scoredGroups = await Promise.all(
      groups.map(async (group) => {
        let totalScore = 0;
        let scoreCount = 0;
        
        // 1. Busca tradicional por string (peso alto)
        const lowerSearchTerm = searchTerm.toLowerCase();
        const name = group.name.toLowerCase();
        const description = group.description.toLowerCase();
        
        let stringScore = 0;
        if (name.includes(lowerSearchTerm)) stringScore += 0.8;
        if (description.includes(lowerSearchTerm)) stringScore += 0.6;
        
        // Busca por palavras individuais
        const searchWords = lowerSearchTerm.split(/\s+/);
        searchWords.forEach(word => {
          if (word.length > 2) {
            if (name.includes(word)) stringScore += 0.4;
            if (description.includes(word)) stringScore += 0.3;
          }
        });
        
        totalScore += stringScore * 3; // Peso 3x para busca tradicional
        scoreCount += 3;
        
        // 2. Busca semântica (peso médio)
        try {
          const groupText = `${group.name} ${group.description}`;
          const groupEmbedding = await model(groupText, { pooling: "mean", normalize: true });
          const groupVector = Array.from(groupEmbedding.data) as number[];
          
          const semanticScore = cosineSimilarity(searchVector, groupVector);
          if (semanticScore > 0.3) { // Threshold mínimo para relevância
            totalScore += semanticScore * 2; // Peso 2x para busca semântica
            scoreCount += 2;
          }
        } catch (error) {
          console.warn("Erro na busca semântica para grupo:", group.name, error);
        }
        
        // 3. Busca por palavras-chave contextuais (peso baixo)
        const keywords = extractContextKeywords(group);
        const keywordScore = keywords.some(keyword => 
          keyword.toLowerCase().includes(lowerSearchTerm) || 
          lowerSearchTerm.includes(keyword.toLowerCase())
        ) ? 0.5 : 0;
        
        totalScore += keywordScore;
        scoreCount += 1;
        
        // Calcular pontuação média
        const finalScore = scoreCount > 0 ? totalScore / scoreCount : 0;
        
        return {
          group,
          score: finalScore,
          stringScore,
          semanticScore: 0, // Será preenchido no try acima se bem-sucedido
          keywordScore
        };
      })
    );
    
    // Filtrar apenas grupos com pontuação significativa e ordenar
    return scoredGroups
      .filter(item => item.score > 0.1) // Threshold mínimo
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(item => item.group);
      
  } catch (error) {
    console.error("Erro na busca inteligente:", error);
    
    // Fallback para busca tradicional se a busca inteligente falhar
    const lowerSearchTerm = searchTerm.toLowerCase();
    return groups.filter(group => {
      const name = group.name.toLowerCase();
      const description = group.description.toLowerCase();
      const keywords = extractContextKeywords(group);
      
      return name.includes(lowerSearchTerm) ||
             description.includes(lowerSearchTerm) ||
             keywords.some(keyword => 
               keyword.toLowerCase().includes(lowerSearchTerm) || 
               lowerSearchTerm.includes(keyword.toLowerCase())
             );
    });
  }
};

// Busca por palavras-chave específicas
export const searchByKeywords = (groups: Group[], keywords: string[]): Group[] => {
  if (keywords.length === 0) return groups;
  
  return groups.filter(group => {
    const groupKeywords = extractContextKeywords(group);
    return keywords.some(keyword => 
      groupKeywords.some(groupKeyword => 
        groupKeyword.toLowerCase().includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(groupKeyword.toLowerCase())
      )
    );
  });
};

// Sugerir termos de busca relacionados
export const getSuggestedSearchTerms = (groups: Group[]): string[] => {
  const termFrequency = new Map<string, number>();
  
  groups.forEach(group => {
    const keywords = extractContextKeywords(group);
    keywords.forEach(keyword => {
      const term = keyword.toLowerCase();
      if (term.length > 3) {
        termFrequency.set(term, (termFrequency.get(term) || 0) + 1);
      }
    });
  });
  
  return Array.from(termFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([term]) => term);
};