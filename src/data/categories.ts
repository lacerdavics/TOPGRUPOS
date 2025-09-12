import { 
  Heart, 
  Users2, 
  Clapperboard, 
  MapPin, 
  GraduationCap, 
  ShoppingCart, 
  Percent, 
  Banknote, 
  Bitcoin, 
  ChefHat, 
  Award, 
  Paintbrush2, 
  Megaphone, 
  Building2, 
  Library, 
  Dumbbell, 
  Circle, 
  Gift,
  Lock
} from "lucide-react";
import { IconData } from "@/components/CategoryIcon";

// Import SVG icons as strings
import heartSvg from "@/assets/icons/heart.svg?raw";
import usersSvg from "@/assets/icons/users.svg?raw";
import cinemaSvg from "@/assets/icons/cinema.svg?raw";
import locationSvg from "@/assets/icons/location.svg?raw";
import graduationSvg from "@/assets/icons/graduation.svg?raw";
import cryptoSvg from "@/assets/icons/crypto.svg?raw";

export interface Category {
  id: string;
  name: string;
  icon: IconData;
  color: string;
  description: string;
}

export const categories: Category[] = [
  {
    id: "adulto",
    name: "Adulto",
    icon: { type: 'lucide', content: Lock },
    color: "from-slate-700 via-gray-700 to-zinc-700",
    description: "Conteúdo para maiores de 18 anos"
  },
  {
    id: "amizade",
    name: "Amizade",
    icon: { type: 'svg', content: usersSvg },
    color: "from-blue-600 via-indigo-500 to-cyan-600",
    description: "Grupos para fazer novas amizades e conversar"
  },
  {
    id: "namoro",
    name: "Namoro",
    icon: { type: 'svg', content: heartSvg },
    color: "from-pink-600 via-rose-500 to-red-500",
    description: "Encontre seu par perfeito"
  },
  {
    id: "filmes-series",
    name: "Filmes e Séries",
    icon: { type: 'svg', content: cinemaSvg },
    color: "from-purple-600 via-violet-500 to-indigo-600",
    description: "Discussões sobre cinema e séries"
  },
  {
    id: "cidades",
    name: "Cidades",
    icon: { type: 'svg', content: locationSvg },
    color: "from-green-600 via-emerald-500 to-teal-600",
    description: "Grupos locais da sua cidade"
  },
  {
    id: "cursos",
    name: "Cursos",
    icon: { type: 'svg', content: graduationSvg },
    color: "from-orange-600 via-amber-500 to-yellow-500",
    description: "Educação e desenvolvimento profissional"
  },
  {
    id: "compra-venda",
    name: "Compra e Venda",
    icon: { type: 'lucide', content: ShoppingCart },
    color: "from-teal-600 via-cyan-500 to-blue-500",
    description: "Marketplace e negócios"
  },
  {
    id: "ofertas-cupons",
    name: "Ofertas e Cupons",
    icon: { type: 'lucide', content: Percent },
    color: "from-red-600 via-pink-500 to-rose-500",
    description: "As melhores promoções e descontos"
  },
  {
    id: "ganhar-dinheiro",
    name: "Ganhar Dinheiro",
    icon: { type: 'lucide', content: Banknote },
    color: "from-yellow-600 via-orange-500 to-red-500",
    description: "Oportunidades de renda extra"
  },
  {
    id: "criptomoedas",
    name: "Criptomoedas",
    icon: { type: 'svg', content: cryptoSvg },
    color: "from-amber-600 via-yellow-500 to-orange-500",
    description: "Investimentos e trading crypto"
  },
  {
    id: "culinaria-receitas",
    name: "Culinária e Receitas",
    icon: { type: 'lucide', content: ChefHat },
    color: "from-lime-600 via-green-500 to-emerald-600",
    description: "Receitas deliciosas e dicas culinárias"
  },
  {
    id: "concursos",
    name: "Concursos",
    icon: { type: 'lucide', content: Award },
    color: "from-violet-600 via-purple-500 to-indigo-600",
    description: "Preparação para concursos públicos"
  },
  {
    id: "desenhos-animes",
    name: "Desenhos e Animes",
    icon: { type: 'lucide', content: Paintbrush2 },
    color: "from-sky-600 via-blue-500 to-indigo-600",
    description: "Mundo dos animes e desenhos"
  },
  {
    id: "divulgacao",
    name: "Divulgação",
    icon: { type: 'lucide', content: Megaphone },
    color: "from-indigo-600 via-violet-500 to-purple-600",
    description: "Divulgue seus projetos e ideias"
  },
  {
    id: "empreendedorismo",
    name: "Empreendedorismo",
    icon: { type: 'lucide', content: Building2 },
    color: "from-slate-600 via-gray-500 to-zinc-600",
    description: "Negócios e startups"
  },
  {
    id: "educacao",
    name: "Educação",
    icon: { type: 'lucide', content: Library },
    color: "from-emerald-600 via-teal-500 to-cyan-600",
    description: "Conhecimento e aprendizado"
  },
  {
    id: "esportes",
    name: "Esportes",
    icon: { type: 'lucide', content: Dumbbell },
    color: "from-blue-700 via-indigo-600 to-purple-600",
    description: "Todos os esportes em geral"
  },
  {
    id: "futebol",
    name: "Futebol",
    icon: { type: 'lucide', content: Circle },
    color: "from-green-700 via-lime-600 to-emerald-600",
    description: "O esporte mais amado do Brasil"
  },
  {
    id: "sorteios-premiacoes",
    name: "Sorteios e Premiações",
    icon: { type: 'lucide', content: Gift },
    color: "from-rose-600 via-pink-500 to-red-500",
    description: "Participe de sorteios incríveis"
  }
];

export const getCategoryById = (id: string): Category | undefined => {
  return categories.find(category => category.id === id);
};