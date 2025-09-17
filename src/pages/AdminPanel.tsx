import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Flag, 
  Ban, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Eye,
  Trash2,
  RefreshCw,
  ArrowLeft
} from "lucide-react";
import { checkIsAdmin } from "@/services/userService";
import { getAllReports, updateReportStatus, type Report } from "@/services/reportService";
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import Footer from "@/components/Footer";

interface SuspendedGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  telegramUrl: string;
  suspendedAt?: any;
  suspendedBy?: string;
  profileImage?: string;
}

const AdminPanel = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [suspendedGroups, setSuspendedGroups] = useState<SuspendedGroup[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [suspendedLoading, setSuspendedLoading] = useState(false);
  const [processingReport, setProcessingReport] = useState<string | null>(null);
  const [processingGroup, setProcessingGroup] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!currentUser) {
        navigate('/auth?redirect=/admin');
        return;
      }

      const adminStatus = await checkIsAdmin(currentUser.uid);
      if (!adminStatus) {
        toast.error("Acesso negado. Apenas administradores podem acessar este painel.");
        navigate('/');
        return;
      }

      setIsAdmin(true);
      setLoading(false);
      
      // Load initial data
      loadReports();
      loadSuspendedGroups();
    };

    checkAdminAccess();
  }, [currentUser, navigate]);

  const loadReports = async () => {
    try {
      setReportsLoading(true);
      const allReports = await getAllReports();
      setReports(allReports);
    } catch (error) {
      console.error("Erro ao carregar denúncias:", error);
      toast.error("Erro ao carregar denúncias");
    } finally {
      setReportsLoading(false);
    }
  };

  const loadSuspendedGroups = async () => {
    try {
      setSuspendedLoading(true);
      const q = query(
        collection(db, "groups"),
        where("approved", "==", false)
      );
      
      const querySnapshot = await getDocs(q);
      const suspended = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        suspendedAt: doc.data().suspendedAt?.toDate()
      })) as SuspendedGroup[];
      
      setSuspendedGroups(suspended);
    } catch (error) {
      console.error("Erro ao carregar grupos suspensos:", error);
      toast.error("Erro ao carregar grupos suspensos");
    } finally {
      setSuspendedLoading(false);
    }
  };

  const handleReportAction = async (reportId: string, action: 'resolved' | 'dismissed', adminNotes?: string) => {
    try {
      setProcessingReport(reportId);
      await updateReportStatus(reportId, action, adminNotes);
      
      // Update local state
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status: action, adminNotes }
          : report
      ));
      
      toast.success(`Denúncia ${action === 'resolved' ? 'resolvida' : 'dispensada'} com sucesso`);
    } catch (error) {
      console.error("Erro ao atualizar denúncia:", error);
      toast.error("Erro ao processar denúncia");
    } finally {
      setProcessingReport(null);
    }
  };

  const handleUnsuspendGroup = async (groupId: string) => {
    try {
      setProcessingGroup(groupId);
      
      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        approved: true,
        unsuspendedAt: new Date(),
        unsuspendedBy: currentUser?.uid
      });
      
      // Remove from local state
      setSuspendedGroups(prev => prev.filter(group => group.id !== groupId));
      
      toast.success("Grupo reativado com sucesso");
    } catch (error) {
      console.error("Erro ao reativar grupo:", error);
      toast.error("Erro ao reativar grupo");
    } finally {
      setProcessingGroup(null);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      setProcessingGroup(groupId);
      
      await deleteDoc(doc(db, "groups", groupId));
      
      // Remove from local state
      setSuspendedGroups(prev => prev.filter(group => group.id !== groupId));
      
      toast.success("Grupo deletado permanentemente");
    } catch (error) {
      console.error("Erro ao deletar grupo:", error);
      toast.error("Erro ao deletar grupo");
    } finally {
      setProcessingGroup(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const pendingReports = reports.filter(r => r.status === 'pending');
  const resolvedReports = reports.filter(r => r.status === 'resolved');
  const dismissedReports = reports.filter(r => r.status === 'dismissed');
  const suspendedCount = suspendedGroups.length;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Início
            </Button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  Painel <span className="text-primary">Administrativo</span>
                </h1>
                <p className="text-muted-foreground">
                  Gerencie denúncias e grupos suspensos
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Flag className="w-8 h-8 text-red-500" />
                    <div>
                      <p className="text-2xl font-bold">{pendingReports.length}</p>
                      <p className="text-sm text-muted-foreground">Denúncias Pendentes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Ban className="w-8 h-8 text-orange-500" />
                    <div>
                      <p className="text-2xl font-bold">{suspendedCount}</p>
                      <p className="text-sm text-muted-foreground">Grupos Não Aprovados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">{resolvedReports.length}</p>
                      <p className="text-sm text-muted-foreground">Denúncias Resolvidas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Eye className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{dismissedReports.length}</p>
                      <p className="text-sm text-muted-foreground">Denúncias Dispensadas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="reports" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <Flag className="w-4 h-4" />
                Denúncias ({pendingReports.length})
              </TabsTrigger>
              <TabsTrigger value="suspended" className="flex items-center gap-2">
                <Ban className="w-4 h-4" />
                Grupos Não Aprovados ({suspendedCount})
              </TabsTrigger>
            </TabsList>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Denúncias</h2>
                <Button onClick={loadReports} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
              </div>

              {reportsLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Carregando denúncias...</p>
                </div>
              ) : pendingReports.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Flag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma denúncia pendente</h3>
                    <p className="text-muted-foreground">Todas as denúncias foram processadas.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pendingReports.map((report) => (
                    <Card key={report.id} className="border-amber-200 dark:border-amber-800">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{report.groupName}</CardTitle>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{report.reportType}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {report.timestamp?.toDate?.()?.toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>
                          <Badge variant="secondary">Pendente</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-1">Motivo:</h4>
                          <p className="text-sm">{report.reason}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-1">Descrição:</h4>
                          <p className="text-sm text-muted-foreground">{report.description}</p>
                        </div>

                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            onClick={() => handleReportAction(report.id!, 'resolved', 'Denúncia procedente - ação tomada')}
                            disabled={processingReport === report.id}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            {processingReport === report.id ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            Resolver
                          </Button>
                          
                          <Button
                            onClick={() => handleReportAction(report.id!, 'dismissed', 'Denúncia improcedente')}
                            disabled={processingReport === report.id}
                            variant="outline"
                            className="flex-1"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Dispensar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Suspended Groups Tab */}
            <TabsContent value="suspended" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Grupos Não Aprovados</h2>
                <Button onClick={loadSuspendedGroups} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
              </div>

              {suspendedLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Carregando grupos suspensos...</p>
                </div>
              ) : suspendedGroups.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Ban className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum grupo não aprovado</h3>
                    <p className="text-muted-foreground">Todos os grupos estão aprovados.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {suspendedGroups.map((group) => (
                    <Card key={group.id} className="border-orange-200 dark:border-orange-800">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                              {group.profileImage ? (
                                <img 
                                  src={group.profileImage} 
                                  alt={group.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Users className="w-6 h-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{group.name}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{group.category}</Badge>
                                {group.suspendedAt && (
                                  <span className="text-sm text-muted-foreground">
                                    Removido em {group.suspendedAt.toLocaleDateString('pt-BR')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge variant="destructive">Não Aprovado</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-1">Descrição:</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-1">Link:</h4>
                          <a 
                            href={group.telegramUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline break-all"
                          >
                            {group.telegramUrl}
                          </a>
                        </div>

                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            onClick={() => handleUnsuspendGroup(group.id)}
                            disabled={processingGroup === group.id}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            {processingGroup === group.id ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            Reativar
                          </Button>
                          
                          <Button
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja deletar permanentemente o grupo "${group.name}"?`)) {
                                handleDeleteGroup(group.id);
                              }
                            }}
                            disabled={processingGroup === group.id}
                            variant="destructive"
                            className="flex-1"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Deletar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminPanel;