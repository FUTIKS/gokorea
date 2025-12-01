import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// Galaxy komponentini import qilish
import Galaxy from "@/components/ui/Galaxy/Galaxy"; 

export default function Auth() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !phone.trim()) {
      toast({
        title: "Ma'lumot yetarli emas",
        description: "Iltimos, F.I.Sh va telefon raqamingizni kiriting.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const fakeEmail = phone.replace(/\D/g, "") + "@gokorea.app";
    const password = phone.replace(/\D/g, "") + "_pass";

    const { error } = await signUp(fakeEmail, password, {
      username: fullName,
      phone: phone,
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Xatolik",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/");
    }
  };

  return (
    // Asosiy fonni to'q neytral (rasmdagidek) va 'relative'
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-[#08132A] relative overflow-hidden"> 
      
      {/* Animatsiya fon DIV'ini sozlash */}
      <div className="absolute top-0 left-0 w-full h-full z-0 opacity-70">
        <Galaxy 
          mouseInteraction={false} 
          density={1.5}
          glowIntensity={0.8}
          hueShift={0}
          saturation={0.0} // Rang tusini butunlay o'chirdik (oq/kulrang yulduzlar)
          transparent={true} 
        />
      </div>


      {/* Asosiy kontent Z-index ni ko'tarish orqali animatsiya ustiga chiqariladi */}
      <div className="relative z-10 flex flex-col items-center">
        
        {/* Logo */}
        <img
          src="/images/gokoreaai.jpg"
          alt="Logo"
          className="w-24 h-24 rounded-full object-cover mb-6 shadow-xl"
        />

        {/* Form box (Card) - 95% shaffof fon uchun o'zgartirish */}
        <Card className="w-full max-w-sm p-6 shadow-2xl border border-white/10 bg-black/50 backdrop-blur-sm rounded-xl text-white"> 
            {/* Yuqoridagi **bg-black/50** (Qora rangning 50% shaffofligi) Card fonini rasmdagidek to'q va shaffof qiladi. */}
            
            <h1 className="text-center text-xl font-bold mb-2 text-white">Kirish</h1>
            <p className="text-center text-sm text-gray-300 mb-6">
                Davom etish uchun ma’lumotlaringizni kiriting
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    {/* Label rangini oqroq qilish */}
                    <Label className="text-gray-200">Ism Familiya</Label>
                    {/* Input - 90% shaffof fon va neon ramka uchun o'zgartirish */}
                    <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Masalan: Jasurbek Karimov"
                        className="h-12 text-lg bg-black/10 border-transparent placeholder:text-gray-400 text-white 
                                   focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1E293B] focus:ring-blue-500 
                                   transition-all duration-300" // O'tish effekti qo'shildi
                    />
                </div>

                <div>
                    <Label className="text-gray-200">Telefon raqam</Label>
                    {/* Input - 90% shaffof fon va neon ramka uchun o'zgartirish */}
                    <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+998 __ ___ __ __"
                        className="h-12 text-lg bg-black/10 border-transparent placeholder:text-gray-400 text-white 
                                   focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1E293B] focus:ring-blue-500
                                   transition-all duration-300" // O'tish effekti qo'shildi
                    />
                </div>

                {/* Tugma rangini jozibali ko'k gradient qilish */}
                <Button 
                    type="submit" 
                    className="w-full h-12 text-lg font-semibold 
                               bg-gradient-to-r from-blue-600 to-blue-800 
                               hover:from-blue-700 hover:to-blue-900 
                               shadow-lg shadow-blue-500/50 
                               text-white transition-all duration-300" 
                    disabled={loading}
                >
                    {loading ? "Yuklanmoqda..." : "Kirish"}
                </Button>
            </form>
        </Card>

        <p className="text-xs text-gray-400 text-center mt-4">
          GoKorea xizmatiga xush kelibsiz!
        </p>
      </div>

    </div>
  );
}