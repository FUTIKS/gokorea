import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  MessageCircle, 
  FileText, 
  BarChart3, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  MapPin
} from "lucide-react";

interface Profile {
  id: string;
  username: string | null;
  phone: string | null;
  is_online: boolean;
  last_seen: string;
  created_at: string;
}

interface Conversation {
  id: string;
  user_id: string;
  status: string;
  rating: number | null;
  created_at: string;
  profiles?: Profile;
}

interface SOSLog {
  id: string;
  user_id: string;
  location: { latitude: number; longitude: number } | null;
  current_screen: string | null;
  resolved: boolean;
  created_at: string;
  profiles?: Profile;
}

interface Document {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  status: string;
  created_at: string;
}

export default function Admin() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [users, setUsers] = useState<Profile[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [sosLogs, setSOSLogs] = useState<SOSLog[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/");
      toast({
        title: "Access Denied",
        description: "Admin access required",
        variant: "destructive",
      });
    }
  }, [user, isAdmin, authLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, convsRes, sosRes, docsRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("conversations").select("*, profiles(*)").order("created_at", { ascending: false }),
        supabase.from("sos_logs").select("*, profiles(*)").order("created_at", { ascending: false }),
        supabase.from("documents").select("*").order("created_at", { ascending: false }),
      ]);

      if (usersRes.data) setUsers(usersRes.data as Profile[]);
      if (convsRes.data) setConversations(convsRes.data as Conversation[]);
      if (sosRes.data) setSOSLogs(sosRes.data as SOSLog[]);
      if (docsRes.data) setDocuments(docsRes.data as Document[]);
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resolveSOS = async (id: string) => {
    try {
      const { error } = await supabase
        .from("sos_logs")
        .update({ 
          resolved: true, 
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id 
        })
        .eq("id", id);

      if (error) throw error;
      
      toast({ title: "SOS Resolved", description: "Alert has been marked as resolved" });
      loadAdminData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to resolve SOS", variant: "destructive" });
    }
  };

  const updateDocumentStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("documents")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      
      toast({ title: "Updated", description: `Document ${status}` });
      loadAdminData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update document", variant: "destructive" });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading admin panel...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const onlineUsers = users.filter((u) => u.is_online).length;
  const unresolvedSOS = sosLogs.filter((s) => !s.resolved).length;
  const pendingDocs = documents.filter((d) => d.status === "pending").length;

  const stats = [
    { label: "Total Users", value: users.length, icon: Users, color: "text-primary" },
    { label: "Active Now", value: onlineUsers, icon: Clock, color: "text-success" },
    { label: "SOS Alerts", value: unresolvedSOS, icon: AlertTriangle, color: "text-destructive" },
    { label: "Pending Docs", value: pendingDocs, icon: FileText, color: "text-warning" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="pt-16 pb-6 px-4 gradient-hero">
        <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
        <p className="text-muted-foreground mt-1">Manage users & monitor activity</p>
      </header>

      {/* Stats */}
      <section className="px-4 -mt-4 mb-4">
        <div className="grid grid-cols-2 gap-2">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-0 shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color} opacity-50`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Tabs */}
      <div className="px-4">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="users" className="text-xs">Users</TabsTrigger>
            <TabsTrigger value="chats" className="text-xs">Chats</TabsTrigger>
            <TabsTrigger value="docs" className="text-xs">Docs</TabsTrigger>
            <TabsTrigger value="sos" className="text-xs">SOS</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="space-y-2">
              {users.map((profile) => (
                <Card key={profile.id} className="border-0 shadow-card">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${profile.is_online ? "bg-success" : "bg-muted"}`} />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{profile.username || "No username"}</p>
                      <p className="text-xs text-muted-foreground">
                        {profile.phone || "No phone"} • Joined {new Date(profile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={profile.is_online ? "default" : "secondary"}>
                      {profile.is_online ? "Online" : "Offline"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Conversations Tab */}
          <TabsContent value="chats">
            <div className="space-y-2">
              {conversations.map((conv) => (
                <Card key={conv.id} className="border-0 shadow-card">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">
                        {conv.profiles?.username || "Unknown User"}
                      </p>
                      <Badge variant={conv.status === "active" ? "default" : "secondary"}>
                        {conv.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{new Date(conv.created_at).toLocaleString()}</span>
                      {conv.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-warning fill-warning" />
                          {conv.rating}/5
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="docs">
            <div className="space-y-2">
              {documents.map((doc) => (
                <Card key={doc.id} className="border-0 shadow-card">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium text-sm truncate">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {doc.file_type.replace("_", " ")} • {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {doc.status === "pending" ? (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => updateDocumentStatus(doc.id, "approved")}
                          >
                            <CheckCircle className="h-4 w-4 text-success" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => updateDocumentStatus(doc.id, "rejected")}
                          >
                            <XCircle className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ) : (
                        <Badge variant={doc.status === "approved" ? "default" : "destructive"}>
                          {doc.status}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* SOS Tab */}
          <TabsContent value="sos">
            <div className="space-y-2">
              {sosLogs.length === 0 ? (
                <Card className="border-0 shadow-card">
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
                    <p className="text-muted-foreground">No SOS alerts</p>
                  </CardContent>
                </Card>
              ) : (
                sosLogs.map((sos) => (
                  <Card 
                    key={sos.id} 
                    className={`border-0 shadow-card ${!sos.resolved ? "border-l-4 border-destructive" : ""}`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm flex items-center gap-2">
                            <AlertTriangle className={`h-4 w-4 ${sos.resolved ? "text-muted-foreground" : "text-destructive"}`} />
                            {sos.profiles?.username || "Unknown User"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Screen: {sos.current_screen || "Unknown"}
                          </p>
                        </div>
                        {!sos.resolved ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => resolveSOS(sos.id)}
                          >
                            Resolve
                          </Button>
                        ) : (
                          <Badge variant="secondary">Resolved</Badge>
                        )}
                      </div>
                      {sos.location && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {sos.location.latitude.toFixed(4)}, {sos.location.longitude.toFixed(4)}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(sos.created_at).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
