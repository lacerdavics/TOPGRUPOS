import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface AnalyticsConfig {
  useRealAnalytics: boolean;
  lastUpdated: Date;
}

const CONFIG_DOC_ID = "analytics_config";

// Get analytics configuration
export const getAnalyticsConfig = async (): Promise<AnalyticsConfig> => {
  try {
    const configDoc = await getDoc(doc(db, "admin_config", CONFIG_DOC_ID));
    
    if (configDoc.exists()) {
      const data = configDoc.data();
      return {
        useRealAnalytics: data.useRealAnalytics || false,
        lastUpdated: data.lastUpdated?.toDate() || new Date()
      };
    }
    
    // Default to fake analytics
    return {
      useRealAnalytics: false,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error("Error getting analytics config:", error);
    return {
      useRealAnalytics: false,
      lastUpdated: new Date()
    };
  }
};

// Update analytics configuration
export const updateAnalyticsConfig = async (useRealAnalytics: boolean): Promise<void> => {
  try {
    await setDoc(doc(db, "admin_config", CONFIG_DOC_ID), {
      useRealAnalytics,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error("Error updating analytics config:", error);
    throw error;
  }
};