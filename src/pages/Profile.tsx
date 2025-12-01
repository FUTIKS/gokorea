import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // AvatarImage qo'shildi
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
  Camera, // Rasm yuklash ikonkasi
} from "lucide-react";
import { cn } from "@/lib/utils";

// Galaxy komponentini import qilish
import Galaxy from "@/components/ui/Galaxy/Galaxy";

// Telefon raqamni tozalash va to'g'ri formatlash funksiyasi
const formatPhoneNumber = (phone: string) => {
    // Faqat raqamlarni olib, +998 formatiga keltiramiz
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("998")) {
        // Agar +998 siz kiritilgan bo'lsa
        return `+${cleaned}`;
    } else if (cleaned.length === 9) {
        // Agar faqat 9 xonali raqam kiritilgan bo'lsa (Masalan: 901234567)
        return `+998${cleaned}`;
    }
    return phone; // Boshqa holatda o'zgarishsiz qoldiramiz (Masalan: to'liq boshqa mamlakat nomeri)
};

export default function Profile() {
  const { user, profile, isAdmin, signOut, refreshProfile, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    username: profile?.username || "",
    phone: profile?.phone || "",
    avatar_url: profile?.avatar_url || "", // Avatar uchun state qo'shildi
  });
  
  // Rasm yuklash uchun state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

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
    }
  }, [profile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setAvatarFile(file);
        // Faylni tezkor ko'rish uchun URL yaratish (opstional)
        setEditForm(prev => ({ ...prev, avatar_url: URL.createObjectURL(file) }));
    }
  };

  const uploadAvatar = async (userId: string) => {
    if (!avatarFile) return editForm.avatar_url;

    const fileExt = avatarFile.name.split(".").pop();
    const filePath = `${userId}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from("avatars") // Supabase'da 'avatars' storage bor deb hisoblaymiz
        .upload(filePath, avatarFile, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);
        
    return publicUrl;
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      const formattedPhone = formatPhoneNumber(editForm.phone); // Telefon formatlash
      const newAvatarUrl = await uploadAvatar(user.id); // Avatarni yuklash

      const { error } = await supabase
        .from("profiles")
        .update({
          username: editForm.username || null,
          phone: formattedPhone || null,
          avatar_url: newAvatarUrl,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      await refreshProfile();
      setIsEditing(false);
      setAvatarFile(null); // Saqlanganidan keyin faylni tozalash
      toast({
        title: "Profil Yangilandi",
        description: "Profilingiz muvaffaqiyatli yangilandi",
      });
    } catch (error) {
      console.error("Update error:", error);
      toast({
        title: "Xatolik",
        description: "Profilni yangilashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A122A]">
        <div className="animate-pulse text-primary">Yuklanmoqda...</div>
      </div>
    );
  }

  if (!user) return null;

  const initials = profile?.username?.slice(0, 2).toUpperCase() || "U";

  // 1. Umumiy fon va animatsiyani joylash
  return (
    <div className="min-h-screen w-full relative overflow-hidden pb-20 bg-[#0A122A] text-white">
      
      {/* Galaxy Animatsiyasi (Fon) */}
      <div className="absolute top-0 left-0 w-full h-full z-0 opacity-70">
        <Galaxy 
          mouseInteraction={false}
          density={1.5}
          glowIntensity={0.8} 
          hueShift={0}
          saturation={0.0}
          transparent={true} 
        />
      </div>

      {/* Kontent qismini Animatsiya ustiga chiqarish */}
      <div className="relative z-10">
        
        {/* Header */}
        <header className="pt-16 pb-8 px-4">
          <div className="flex flex-col items-center text-center">
            
            {/* Rasm qo'yish qismi */}
            <div className="relative w-24 h-24 mb-4">
                <Avatar className="w-24 h-24 border-4 border-blue-500/50 shadow-lg">
                    <AvatarImage src={editForm.avatar_url || profile?.avatar_url} alt={profile?.username || "Avatar"} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
                        {initials}
                    </AvatarFallback>
                </Avatar>
                {isEditing && (
                    <Label 
                        htmlFor="avatar-upload" 
                        className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600/90 flex items-center justify-center cursor-pointer border border-white"
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
            
            {/* Username/F.I.Sh. */}
            <h1 className="text-2xl font-bold text-white">
              {profile?.username || "Foydalanuvchi"}
            </h1>
            {/* Email o'chirildi */}
            {isAdmin && (
                <div className="flex items-center gap-1 mt-2 px-3 py-1 bg-blue-500/20 rounded-full border border-blue-500/50">
                    <Shield className="h-3 w-3 text-blue-400" />
                    <span className="text-xs font-medium text-blue-400">Admin</span>
                </div>
            )}
          </div>
        </header>

        {/* Profile Info */}
        <section className="px-4 -mt-4">
          <Card className="border-0 shadow-lg bg-black/30 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base text-gray-200">Profil Ma'lumotlari</CardTitle>
              {!isEditing ? (
                <Button variant="ghost" size="icon-sm" onClick={() => setIsEditing(true)} className="hover:bg-blue-500/20 focus-visible:ring-offset-0">
                  <Edit className="h-4 w-4 text-blue-400" />
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                    className="hover:bg-red-500/20 focus-visible:ring-offset-0"
                  >
                    <X className="h-4 w-4 text-red-400" />
                  </Button>
                  <Button
                    variant="telegram"
                    size="icon-sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-blue-600/90 hover:bg-blue-700/90 focus-visible:ring-offset-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Username (F.I.Sh) */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center border border-blue-500/50">
                  <User className="h-5 w-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400">Ism Familiya (Username)</p>
                  {isEditing ? (
                    <Input
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      placeholder="F.I.Sh."
                      className="mt-1 bg-black/40 border-gray-700 text-white focus-visible:ring-offset-0"
                    />
                  ) : (
                    <p className="font-medium text-white">{profile?.username || "Kiritilmagan"}</p>
                  )}
                </div>
              </div>

              <Separator className="bg-gray-700" />

              {/* Phone (Telefon raqami) */}
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
                      className="mt-1 bg-black/40 border-gray-700 text-white focus-visible:ring-offset-0"
                    />
                  ) : (
                    <p className="font-medium text-white">{profile?.phone || "Kiritilmagan"}</p>
                  )}
                </div>
              </div>

              <Separator className="bg-gray-700" />

              {/* Joined (Ro'yxatdan o'tgan sana) */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center border border-blue-500/50">
                  <Calendar className="h-5 w-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400">Ro'yxatdan O'tilgan Sana</p>
                  <p className="font-medium text-white">
                    {profile?.created_at 
                      ? new Date(profile.created_at).toLocaleDateString()
                      : "Noma'lum"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Actions */}
        <section className="px-4 mt-4 space-y-2">
          {isAdmin && (
            <Button
              variant="outline"
              className="w-full justify-start bg-black/30 border-blue-500/50 text-blue-400 hover:bg-black/50 focus-visible:ring-offset-0"
              onClick={() => navigate("/admin")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Admin Paneliga O'tish
            </Button>
          )}
          
          <Button
            variant="destructive"
            className="w-full justify-start bg-red-600/80 hover:bg-red-700/90 focus-visible:ring-offset-0"
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