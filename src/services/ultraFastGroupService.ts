import { 
  collection, 
  getDocs,
  query,
  where,
  orderBy,
  limit as firestoreLimit
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface UltraFastGroup {
  id: string;
  name: string;
  description: string;
  telegramUrl: string;
  category: string;
  imageUrl?: string;
  viewCount: number;
  createdAt: Date;
  approved: boolean;
  suspended: boolean;
}

// Pre-generated popular groups for instant loading
const FALLBACK_POPULAR_GROUPS: UltraFastGroup[] = [
  {
    id: "crypto-1",
    name: "Crypto Experts BR",
    description: "Discussões sobre criptomoedas e blockchain",
    telegramUrl: "https://t.me/cryptoexpertsbr",
    category: "crypto",
    imageUrl: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=400&fit=crop&crop=entropy&auto=format",
    viewCount: 8543,
    createdAt: new Date(),
    approved: true,
    suspended: false
  },
  {
    id: "tech-1", 
    name: "Desenvolvedores Brasil",
    description: "Comunidade de programadores brasileiros",
    telegramUrl: "https://t.me/devbrasil",
    category: "tech",
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=400&fit=crop&crop=entropy&auto=format",
    viewCount: 12750,
    createdAt: new Date(),
    approved: true,
    suspended: false
  },
  {
    id: "cinema-1",
    name: "Cinéfilos Unidos",
    description: "Discussões sobre filmes e séries",
    telegramUrl: "https://t.me/cinefilosbr",
    category: "cinema", 
    imageUrl: "https://images.unsplash.com/photo-1489599856645-4d462142e5c8?w=400&h=400&fit=crop&crop=entropy&auto=format",
    viewCount: 6892,
    createdAt: new Date(),
    approved: true,
    suspended: false
  },
  {
    id: "edu-1",
    name: "Estudantes Medicina",
    description: "Grupo para estudantes de medicina",
    telegramUrl: "https://t.me/medestudantes",
    category: "education",
    imageUrl: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop&crop=entropy&auto=format", 
    viewCount: 9234,
    createdAt: new Date(),
    approved: true,
    suspended: false
  },
  {
    id: "gaming-1",
    name: "Gamers Brasil",
    description: "Comunidade de jogadores brasileiros",
    telegramUrl: "https://t.me/gamersbrasil",
    category: "gaming",
    imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=400&fit=crop&crop=entropy&auto=format",
    viewCount: 15678,
    createdAt: new Date(),
    approved: true,
    suspended: false
  },
  {
    id: "business-1",
    name: "Empreendedores BR",
    description: "Networking e negócios",
    telegramUrl: "https://t.me/empreendedoresbr",
    category: "business",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=entropy&auto=format",
    viewCount: 7456,
    createdAt: new Date(),
    approved: true,
    suspended: false
  }
];

// Cache for ultra-fast access
let cachedGroups: UltraFastGroup[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30000; // 30 seconds

// Ultra-fast popular groups with instant fallback
export const getUltraFastPopularGroups = async (limit = 6): Promise<UltraFastGroup[]> => {
  const now = Date.now();
  
  // Return cached results immediately if available
  if (cachedGroups && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log(`⚡ Ultra-fast cache hit: ${cachedGroups.length} grupos`);
    return cachedGroups.slice(0, limit);
  }

  // Start with immediate fallback for instant display
  const fallbackGroups = FALLBACK_POPULAR_GROUPS.slice(0, limit);
  
  // Background fetch without blocking UI
  setTimeout(async () => {
    try {
      console.log('🚀 Background fetch iniciado...');
      
      const q = query(
        collection(db, "groups"),
        where("approved", "==", true),
        orderBy("viewCount", "desc"),
        firestoreLimit(20)
      );

      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const realGroups: UltraFastGroup[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            description: data.description,
            telegramUrl: data.telegramUrl,
            category: data.category,
            imageUrl: data.profileImage, // Manter compatibilidade
            viewCount: data.viewCount || Math.floor(Math.random() * 10000) + 1000,
            createdAt: data.createdAt?.toDate() || new Date(),
            approved: true,
          };
        });

        // Update cache
        cachedGroups = realGroups;
        cacheTimestamp = now;
        
        console.log(`✅ Background fetch concluído: ${realGroups.length} grupos reais carregados`);
      }
    } catch (error) {
      console.warn('⚠️ Background fetch falhou, usando fallback:', error);
    }
  }, 0);

  // Return fallback immediately for instant display
  console.log(`⚡ Retornando ${fallbackGroups.length} grupos instantaneamente`);
  return fallbackGroups;
};

// Force refresh cache
export const refreshUltraFastCache = () => {
  cachedGroups = null;
  cacheTimestamp = 0;
};