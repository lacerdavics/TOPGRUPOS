import { 
  collection, 
  addDoc, 
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
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
  timestamp: Timestamp;
  route: string;
  userAgent?: string;
  ip?: string;
}

export interface DailyStats {
  date: string;
  visits: number;
  uniqueVisitors: number;
}

// Track page visit
export const trackVisit = async (route: string): Promise<void> => {
  try {
    const visitData: VisitData = {
      timestamp: Timestamp.now(),
      route,
      userAgent: navigator.userAgent
    };
    
    await addDoc(collection(db, "visits"), visitData);
    
    // Update daily counter
    const today = new Date().toISOString().split('T')[0];
    const dailyRef = doc(db, "dailyStats", today);
    
    await setDoc(dailyRef, {
      date: today,
      visits: increment(1),
      timestamp: Timestamp.now()
    }, { merge: true });

  } catch (error) {
    console.error("Error tracking visit:", error);
  }
};

// Track group view
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

// Get visits analytics (real or fake)
export const getVisitsAnalytics = async (period: '24h' | '7d' | '30d' = '7d', forceReal: boolean = false) => {
  try {
    // Check analytics configuration
    const config = await getAnalyticsConfig();
    
    // If forceReal is true (admin) or config allows real analytics
    if (!forceReal && !config.useRealAnalytics) {
      // Return fake analytics data
      return getFakeAnalyticsData(period);
    }

    // Real analytics implementation
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
    }

    const q = query(
      collection(db, "visits"),
      where("timestamp", ">=", Timestamp.fromDate(startDate)),
      orderBy("timestamp", "desc")
    );

    const querySnapshot = await getDocs(q);
    const visits = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    })) as VisitData[];

    // Group by date for chart data
    const dailyVisits: { [key: string]: number } = {};
    visits.forEach(visit => {
      const date = new Date(visit.timestamp.seconds * 1000).toISOString().split('T')[0];
      dailyVisits[date] = (dailyVisits[date] || 0) + 1;
    });

    const chartData = Object.entries(dailyVisits).map(([date, count]) => ({
      date,
      visits: count
    })).sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalVisits: visits.length,
      dailyData: chartData,
      period
    };
  } catch (error) {
    console.error("Error getting visits analytics:", error);
    return { totalVisits: 0, dailyData: [], period };
  }
};

// Get daily stats for admin dashboard (real or fake)
export const getDailyStats = async (days: number = 30, forceReal: boolean = false) => {
  try {
    // Check analytics configuration
    const config = await getAnalyticsConfig();
    
    // If forceReal is true (admin) or config allows real analytics
    if (!forceReal && !config.useRealAnalytics) {
      // Return fake daily stats
      return getFakeDailyStats(days);
    }

    // Real analytics implementation
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const statsArray: DailyStats[] = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const docRef = doc(db, "dailyStats", dateStr);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
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