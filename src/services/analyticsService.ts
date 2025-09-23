import { 
  collection, 
  addDoc, 
  doc,
  getDoc,
  query,
  Timestamp,
  setDoc,
  increment,
  updateDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAnalyticsConfig } from "./analyticsConfigService";
import { getFakeAnalyticsData, getFakeDailyStats } from "./fakeAnalyticsService";

export interface VisitData {
  id?: string;
  timestamp: Date | Timestamp;
  route: string;
  userAgent?: string;
  ip?: string;
}

export interface DailyStats {
  date: string;
  visits: number;
  uniqueVisitors: number;
}

// ==============================
// Track page visit
// ==============================
export const trackVisit = async (route: string): Promise<void> => {
  try {
    const visitData: VisitData = {
      timestamp: Timestamp.now(),
      route,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "server"
    };
    
    // ✅ Cria documento em /visits sem tentar ler (conforme regras)
    await addDoc(collection(db, "visits"), visitData);
    
    // ✅ Atualiza contador diário em /stats (regras permitem write nos campos abaixo)
    const today = new Date().toISOString().split("T")[0];
    const dailyRef = doc(db, "stats", today);
    
    await setDoc(dailyRef, {
      date: today,
      visits: increment(1),
      timestamp: Timestamp.now()
    }, { merge: true });

  } catch (error) {
    console.error("Error tracking visit:", error);
  }
};

// ==============================
// Track group view
// ==============================
export const trackGroupView = async (groupId: string): Promise<void> => {
  try {
    const groupRef = doc(db, "groups", groupId);
    await updateDoc(groupRef, {
      viewCount: increment(1),
      lastViewed: Timestamp.now()
    });
  } catch (error) {
    console.error("Error tracking group view:", error);
  }
};

// ==============================
// Get visits analytics
// ==============================
// ⚠️ As regras não permitem leitura em /visits,
// portanto SEMPRE usamos dados fake se useRealAnalytics = false
// e se forçado (forceReal=true) ainda pode dar permission-denied.
export const getVisitsAnalytics = async (
  period: "24h" | "7d" | "30d" = "7d",
  forceReal: boolean = false
) => {
  try {
    const config = await getAnalyticsConfig();
    
    if (!forceReal && !config.useRealAnalytics) {
      return getFakeAnalyticsData(period);
    }

    console.warn("⚠️ Leitura real de /visits não permitida pelas regras. Retornando dados fake.");
    return getFakeAnalyticsData(period);

  } catch (error) {
    console.error("Error getting visits analytics:", error);
    return { totalVisits: 0, dailyData: [], period };
  }
};

// ==============================
// Get daily stats for dashboard
// ==============================
export const getDailyStats = async (
  days: number = 30,
  forceReal: boolean = false
) => {
  try {
    const config = await getAnalyticsConfig();
    
    if (!forceReal && !config.useRealAnalytics) {
      return getFakeDailyStats(days);
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const statsArray: DailyStats[] = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const docRef = doc(db, "stats", dateStr);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        statsArray.push({
          date: dateStr,
          visits: data.visits || 0,
          uniqueVisitors: data.uniqueVisitors || 0
        });
      } else {
        statsArray.push({
          date: dateStr,
          visits: 0,
          uniqueVisitors: 0
        });
      }
    }

    return statsArray.sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error("Error getting daily stats:", error);
    return [];
  }
};
