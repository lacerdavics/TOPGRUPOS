import { 
  collection, 
  addDoc, 
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  doc,
  updateDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Report {
  id?: string;
  groupId: string;
  groupName: string;
  reportType: string;
  reason: string;
  description: string;
  reportedBy?: string;
  timestamp: Timestamp;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  adminNotes?: string;
}

// Submit a report
export const submitReport = async (reportData: Omit<Report, 'id' | 'timestamp' | 'status'>): Promise<void> => {
  try {
    const report: Omit<Report, 'id'> = {
      ...reportData,
      timestamp: Timestamp.now(),
      status: 'pending'
    };
    
    await addDoc(collection(db, "reports"), report);
    console.log("✅ Denúncia enviada com sucesso");
  } catch (error) {
    console.error("❌ Erro ao enviar denúncia:", error);
    throw error;
  }
};

// Get all reports for admin
export const getAllReports = async (): Promise<Report[]> => {
  try {
    const q = query(
      collection(db, "reports"),
      orderBy("timestamp", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp
    })) as Report[];
  } catch (error) {
    console.error("❌ Erro ao buscar denúncias:", error);
    return [];
  }
};

// Get pending reports count
export const getPendingReportsCount = async (): Promise<number> => {
  try {
    const q = query(
      collection(db, "reports"),
      where("status", "==", "pending")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("❌ Erro ao contar denúncias pendentes:", error);
    return 0;
  }
};

// Update report status
export const updateReportStatus = async (
  reportId: string, 
  status: Report['status'], 
  adminNotes?: string
): Promise<void> => {
  try {
    const reportRef = doc(db, "reports", reportId);
    await updateDoc(reportRef, {
      status,
      adminNotes: adminNotes || "",
      reviewedAt: Timestamp.now()
    });
    console.log("✅ Status da denúncia atualizado");
  } catch (error) {
    console.error("❌ Erro ao atualizar status da denúncia:", error);
    throw error;
  }
};