import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  FileImage, 
  FileArchive, 
  Upload, 
  FolderOpen, 
  ScanLine,
  FileText,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

type DocumentType = "passport" | "id_card" | "contract" | "medical" | "other";
type DocumentStatus = "pending" | "approved" | "rejected";

interface Document {
  id: string;
  file_name: string;
  file_url: string;
  file_type: DocumentType;
  file_size: number | null;
  status: DocumentStatus;
  created_at: string;
}

const documentTypeLabels: Record<DocumentType, string> = {
  passport: "Passport",
  id_card: "ID Karta",
  contract: "Shartnoma",
  medical: "Tibbiy Hujjat",
  other: "Boshqa",
};

const statusLabels: Record<DocumentStatus, string> = {
    pending: "Tekshirilmoqda",
    approved: "Tasdiqlangan",
    rejected: "Rad etilgan",
};

const statusIcons: Record<DocumentStatus, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-yellow-400" />,
  approved: <CheckCircle className="h-4 w-4 text-green-400" />,
  rejected: <XCircle className="h-4 w-4 text-red-400" />,
};

const tools = [
  { icon: FileImage, label: "JPG → PDF", description: "Rasmlarni konvertatsiya qilish" },
  { icon: FileArchive, label: "PDF → ZIP", description: "Fayllarni arxivlash" },
  { icon: Upload, label: "Yuklash", description: "Yangi hujjat qo'shish" },
  { icon: FolderOpen, label: "Mening Hujjatlarim", description: "Barcha fayllarni ko'rish" },
];

export default function Documents() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedType, setSelectedType] = useState<DocumentType>("other");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user]);

  const loadDocuments = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments((data as Document[]) || []);
    } catch (error) {
      console.error("Error loading documents:", error);
      toast({
        title: "Xatolik",
        description: "Hujjatlarni yuklashda xatolik yuz berdi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Fayl juda katta",
          description: "Maksimal fayl hajmi 10MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    setIsUploading(true);

    try {
      const fileExt = selectedFile.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase.from("documents").insert({
        user_id: user.id,
        file_name: selectedFile.name,
        file_url: publicUrl,
        file_type: selectedType,
        file_size: selectedFile.size,
      });

      if (dbError) throw dbError;

      toast({
        title: "Muvaffaqiyat",
        description: "Hujjat muvaffaqiyatli yuklandi.",
      });

      setUploadDialogOpen(false);
      setSelectedFile(null);
      loadDocuments();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Yuklash Amali Muvaffaqiyatsiz",
        description: "Hujjatni yuklashda xatolik yuz berdi.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "O'chirildi",
        description: "Hujjat muvaffaqiyatli o'chirildi.",
      });
      loadDocuments();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Xatolik",
        description: "Hujjatni o'chirishda xatolik yuz berdi.",
        variant: "destructive",
      });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full text-white">
      {/* Header */}
      <header className="pt-16 pb-6 px-4">
        <h1 className="text-2xl font-bold text-white">Hujjatlarni Boshqarish</h1>
        <p className="text-gray-400 mt-1">Fayllaringizni boshqaring va konvertatsiya qiling</p>
      </header>

      {/* Tools Grid */}
      <section className="px-4">
        <div className="grid grid-cols-2 gap-3">
          {tools.map((tool, index) => (
            <Card
              key={tool.label}
              className="border-0 shadow-lg bg-black/30 backdrop-blur-sm hover:shadow-xl transition-all cursor-pointer animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => {
                if (tool.label === "Yuklash") setUploadDialogOpen(true);
                if (tool.label === "Mening Hujjatlarim") setViewDialogOpen(true);
              }}
            >
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-600/50">
                  <tool.icon className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="font-semibold text-sm text-white">{tool.label}</h3>
                <p className="text-xs text-gray-400">{tool.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Admin Scanner Button */}
      {isAdmin && (
        <section className="px-4 mt-4">
          <Button variant="outline" className="w-full bg-black/30 border-blue-500/50 text-blue-400 hover:bg-black/50" onClick={() => navigate("/admin")}>
            <ScanLine className="h-4 w-4 mr-2" />
            Hujjat Skannerlash (Admin)
          </Button>
        </section>
      )}

      {/* Recent Documents */}
      <section className="px-4 mt-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          So'nggi Hujjatlar
        </h2>
        {documents.length === 0 ? (
          <Card className="border-dashed border-2 border-blue-500/50 bg-black/30">
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400">Hali hujjatlar yo'q</p>
              <Button
                variant="telegram"
                className="mt-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                onClick={() => setUploadDialogOpen(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Birinchi Hujjatni Yuklash
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {documents.slice(0, 5).map((doc) => (
              <Card key={doc.id} className="border-0 shadow-lg bg-black/30">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-white truncate">
                      {doc.file_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {documentTypeLabels[doc.file_type]} • {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusIcons[doc.status]}
                    <p className="text-xs text-gray-400">{statusLabels[doc.status]}</p>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(doc.id)}
                      className="hover:bg-red-500/20"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="bg-[#0d0d1e] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Hujjat Yuklash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file" className="text-gray-200">Faylni Tanlang</Label>
              <Input
                id="file"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                className="mt-2 bg-black/20 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                Maksimal 10MB. Qo'llab-quvvatlanadi: JPG, PNG, PDF
              </p>
            </div>
            <div>
              <Label className="text-gray-200">Hujjat Turi</Label>
              <Select value={selectedType} onValueChange={(v) => setSelectedType(v as DocumentType)}>
                <SelectTrigger className="mt-2 bg-black/20 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0d0d1e] text-white border-gray-700">
                  {Object.entries(documentTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value} className="hover:bg-gray-800">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedFile && (
              <Card className="bg-blue-600/20 border-blue-500/50">
                <CardContent className="p-3 flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-white">{selectedFile.name}</p>
                    <p className="text-xs text-gray-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            <Button
              variant="telegram"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? "Yuklanmoqda..." : "Hujjatni Yuklash"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View All Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto bg-[#0d0d1e] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Mening Hujjatlarim ({documents.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {documents.map((doc) => (
              <Card key={doc.id} className="border-0 shadow-sm bg-black/30">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate text-white">{doc.file_name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{documentTypeLabels[doc.file_type]}</span>
                      <span>•</span>
                      {statusIcons[doc.status]}
                      <span className="capitalize">{statusLabels[doc.status]}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    asChild
                    className="hover:bg-blue-500/20"
                  >
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-4 w-4 text-blue-400" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}