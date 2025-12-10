import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Phone, 
  Calendar, 
  Shield, 
  LogOut,
  Edit,
  Check,
  X,
  Settings,
  Camera,
} from "lucide-react";
import Galaxy from "@/components/ui/Galaxy/Galaxy";

const formatPhoneNumber = (phone: string) => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("998")) {
    return `+${cleaned}`;
  } else if (cleaned.length === 9) {
    return `+998${cleaned}`;
  }
  return phone;
};

export default function Profile() {
  const { user, profile, isAdmin, signOut, refreshProfile, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    phone: "",
    avatar_url: "",
  });
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setEditForm({
        username: profile.username || "",
        phone: profile.phone || "",
        avatar_url: profile.avatar_url || "",
      });
      setPreviewUrl(profile.avatar_url || "");
    }
  }, [profile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const uploadAvatar = async (userId: string) => {
    if (!avatarFile) return editForm.avatar_url;

    try {
      const fileExt = avatarFile.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);
        
      return publicUrl;
    } catch (error) {
      console.error("Avatar upload failed:", error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);

    try {
      let newAvatarUrl = editForm.avatar_url;
      
      // Avatar yuklash (agar yangi fayl tanlangan bo'lsa)
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar(user.id);
      }

      // Telefon raqamni formatlash
      const formattedPhone = editForm.phone ? formatPhoneNumber(editForm.phone) : null;

      // Ma'lumotlarni yangilash
      const { error } = await supabase
        .from("profiles")
        .update({
          username: editForm.username || null,
          phone: formattedPhone,
          avatar_url: newAvatarUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) {
        console.error("Profile update error:", error);
        throw error;
      }

      // Profilni yangilash
      await refreshProfile();
      
      // Editing rejimidan chiqish
      setIsEditing(false);
      setAvatarFile(null);
      
      toast({
        title: "Muvaffaqiyatli",
        description: "Profilingiz yangilandi",
      });
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "Xatolik",
        description: error?.message || "Profilni yangilashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatarFile(null);
    if (profile) {
      setEditForm({
        username: profile.username || "",
        phone: profile.phone || "",
        avatar_url: profile.avatar_url || "",
      });
      setPreviewUrl(profile.avatar_url || "");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A122A]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-blue-400 text-sm">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = profile?.username?.slice(0, 2).toUpperCase() || "U";
  const displayAvatar = previewUrl || profile?.avatar_url || "";

  return (
    <div className="min-h-screen w-full relative overflow-hidden pb-20 bg-[#0A122A]">
      
      {/* Galaxy Fon */}
      <div className="absolute top-0 left-0 w-full h-full z-0 opacity-50">
        <Galaxy 
          mouseInteraction={false}
          density={1.5}
          glowIntensity={0.8} 
          hueShift={0}
          saturation={0.0}
          transparent={true} 
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        
        {/* Header */}
        <header className="pt-12 pb-6 px-4">
          <div className="flex flex-col items-center text-center">
            
            {/* Avatar */}
            <div className="relative mb-4">
              <Avatar className="w-24 h-24 border-2 border-blue-500/50 shadow-lg">
                <AvatarImage 
                  src={displayAvatar} 
                  alt={profile?.username || "Avatar"}
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              {isEditing && (
                <Label 
                  htmlFor="avatar-upload" 
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center cursor-pointer border-2 border-white shadow-lg hover:bg-blue-700 transition-colors"
                >
                  <Camera className="h-4 w-4 text-white" />
                  <Input 
                    id="avatar-upload" 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarChange} 
                    className="hidden"
                    disabled={isSaving}
                  />
                </Label>
              )}
            </div>
            
            {/* Username */}
            <h1 className="text-2xl font-bold text-white mb-1">
              {profile?.username || "Foydalanuvchi"}
            </h1>
            
            {/* Admin Badge */}
            {isAdmin && (
              <div className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 rounded-full border border-blue-500/50">
                <Shield className="h-3 w-3 text-blue-400" />
                <span className="text-xs font-medium text-blue-400">Admin</span>
              </div>
            )}
          </div>
        </header>

        {/* Profile Info Card */}
        <section className="px-4">
          <Card className="border-0 shadow-lg bg-black/30 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base text-gray-200">Profil Ma'lumotlari</CardTitle>
              
              {!isEditing ? (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsEditing(true)} 
                  className="h-8 px-3 hover:bg-blue-500/20 text-blue-400"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Tahrirlash
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="h-8 px-3 hover:bg-red-500/20 text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-8 px-3 bg-blue-600 hover:bg-blue-700"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </CardHeader>
            
            <CardContent className="space-y-4">
              
              {/* Username */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center border border-blue-500/50">
                  <User className="h-5 w-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400">Ism Familiya</p>
                  {isEditing ? (
                    <Input
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      placeholder="Ismingizni kiriting"
                      className="mt-1 h-9 bg-black/40 border-gray-700 text-white"
                      disabled={isSaving}
                    />
                  ) : (
                    <p className="font-medium text-white mt-0.5">
                      {profile?.username || "Kiritilmagan"}
                    </p>
                  )}
                </div>
              </div>

              <Separator className="bg-gray-700/50" />

              {/* Phone */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center border border-blue-500/50">
                  <Phone className="h-5 w-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400">Telefon Raqami</p>
                  {isEditing ? (
                    <Input
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="+998 XX XXX XX XX"
                      className="mt-1 h-9 bg-black/40 border-gray-700 text-white"
                      disabled={isSaving}
                    />
                  ) : (
                    <p className="font-medium text-white mt-0.5">
                      {profile?.phone || "Kiritilmagan"}
                    </p>
                  )}
                </div>
              </div>

              <Separator className="bg-gray-700/50" />

              {/* Created Date */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center border border-blue-500/50">
                  <Calendar className="h-5 w-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400">Ro'yxatdan O'tilgan</p>
                  <p className="font-medium text-white mt-0.5">
                    {profile?.created_at 
                      ? new Date(profile.created_at).toLocaleDateString('uz-UZ')
                      : "Noma'lum"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Action Buttons */}
        <section className="px-4 mt-4 space-y-2">
          {isAdmin && (
            <Button
              variant="outline"
              className="w-full h-12 justify-start bg-black/30 border-blue-500/50 text-blue-400 hover:bg-black/50"
              onClick={() => navigate("/admin")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Admin Panel
            </Button>
          )}
          
          <Button
            variant="destructive"
            className="w-full h-12 justify-start bg-red-600/80 hover:bg-red-700/90"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Tizimdan Chiqish
          </Button>
        </section>
      </div>
    </div>
  );
}