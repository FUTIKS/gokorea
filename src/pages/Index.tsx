import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MessageCircle, 
  FileText, 
  Calculator, 
  Shield, 
  ArrowRight,
  Sparkles,
  Clock,
  Users,
  AlertTriangle,
  FileCheck
} from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "AI Yordamchi",
    description: "Ovozli yoki matnli so'rovlar bilan tezkor yordam oling",
    path: "/chat",
    gradient: "from-blue-600 to-blue-700",
  },
  {
    icon: FileText,
    title: "Hujjatlar",
    description: "Fayllarni yuklash, boshqarish va konvertatsiya qilish",
    path: "/documents",
    gradient: "from-green-600 to-green-700",
  },
  {
    icon: Calculator,
    title: "Hisob-kitob",
    description: "Xarajatlarni kuzatish va valyuta konvertatsiyasi",
    path: "/calculator",
    gradient: "from-yellow-600 to-yellow-700",
  },
  {
    icon: Shield,
    title: "Admin Panel",
    description: "Foydalanuvchilar va tahlillarni boshqarish",
    path: "/admin",
    gradient: "from-red-600 to-red-700",
    adminOnly: true,
  },
];

const stats = [
  { icon: Users, value: "24/7", label: "Qo'llab-quvvatlash" },
  { icon: Clock, value: "<1 daq.", label: "Javob vaqti" },
  { icon: Sparkles, value: "AI", label: "Yordamida" },
];

export default function Index() {
  const { user, profile, isLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const mainButtonRef = useRef(window.Telegram.WebApp.MainButton); 

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }

    const MainButton = mainButtonRef.current;
    if (MainButton) {
      MainButton.setText("Yangi Chatni Boshlash");
      const startChat = () => navigate("/chat");
      MainButton.onClick(startChat);
      MainButton.show();

      return () => {
        MainButton.offClick(startChat);
        MainButton.hide();
      };
    }

  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary">Yuklanmoqda...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen w-full text-white"> 
      
      {/* Header */}
      <header className="pt-16 pb-8 px-4 relative">
        <div className="text-center animate-fade-in text-white">
          <h1 className="text-2xl font-bold text-white">
            Xush kelibsiz{profile?.username ? `, ${profile.username}` : ""}! 👋
          </h1>
          <p className="text-gray-400 mt-1">
            Bugun qanday yordam bera olamiz?
          </p>
        </div>

        <div className="absolute top-16 right-4">
            <Button 
                variant="ghost" 
                size="icon" 
                className="text-yellow-400 hover:text-yellow-500 relative"
                onClick={() => alert("Sizning Premium obunangiz 3 kundan keyin tugaydi!")}
            >
                <AlertTriangle className="h-6 w-6" /> 
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            </Button>
        </div>
      </header>

      {/* Stats */}
      <section className="px-4 mb-8">
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-0 shadow-lg bg-black/30 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <stat.icon className="h-5 w-5 mx-auto mb-2 text-blue-400" />
                <p className="text-lg font-bold text-white">{stat.value}</p>
                <p className="text-xs text-gray-400">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider px-1">
          Xizmatlar
        </h2>
        {features.map((feature, index) => {
          if (feature.adminOnly && !isAdmin) return null;

          return (
            <Card
              key={feature.title}
              className="border-0 shadow-lg bg-black/30 backdrop-blur-sm hover:shadow-xl transition-all duration-300 cursor-pointer animate-fade-in overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => navigate(feature.path)}
            >
              <CardContent className="p-0">
                <div className="flex items-center gap-4 p-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-md`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{feature.title}</h3>
                    <p className="text-sm text-gray-400">{feature.description}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Quick Actions */}
      <section className="px-4 mt-8 mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider px-1 mb-3">
          Tezkor Amallar
        </h2>
        <div className="flex gap-3">
          <Button
            variant="telegram"
            className="flex-1 bg-black/20 border-white/20 hover:bg-black/30 text-white"
            onClick={() => navigate("/documents")}
          >
            <FileCheck className="h-4 w-4 mr-2" />
            Hujjat Yuklash
          </Button>
          <Button
            variant="telegram"
            className="flex-1 bg-black/20 border-white/20 hover:bg-black/30 text-white"
            onClick={() => navigate("/calculator")}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Hisob-kitob
          </Button>
        </div>
      </section>
      
    </div>
  );
}