import { Home, FileText, Calculator, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

// Navigatsiya elementlarining o'zbekcha ro'yxati
const navItems = [
    { to: "/", label: "Bosh sahifa", icon: Home, key: "home" },
    { to: "/documents", label: "Hujjatlar", icon: FileText, key: "docs" },
    // AI/Chat markazda bo'ladi
    { to: "/calculator", label: "Hisob-kitob", icon: Calculator, key: "calc" },
    { to: "/profile", label: "Profil", icon: User, key: "profile" },
];

export const BottomNav = () => {
  const location = useLocation();

  if (location.pathname === "/auth") return null;
  
  // Beshta elementni teng taqsimlash uchun 100% / 5 = 20%
  // Lekin markaziy element kattaroq. Shuning uchun mos ravishda joylashtiramiz

  return (
    // Qora fon, yumshoq blur
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-700 bg-[#0d0d1e] backdrop-blur-md safe-area-bottom">
      <div className="relative flex h-20 items-end justify-between px-2 pb-2"> {/* items-end tugmalarni pastga tushiradi */}

        {/* 1. Chap tomon (Bosh sahifa, Hujjatlar) */}
        <div className="flex w-2/5 justify-around items-center">
            <BottomItem 
                to="/" 
                label="Bosh sahifa" 
                icon={Home} 
                active={location.pathname === "/"} 
            />
            <BottomItem
                to="/documents"
                label="Hujjatlar"
                icon={FileText}
                active={location.pathname === "/documents"}
            />
        </div>

        {/* 2. Markaziy Floating AI Tugmasi - Dumaloq, AI matni */}
        <NavLink
          to="/chat"
          className="absolute -top-3 left-1/2 transform -translate-x-1/2"
        >
          <div
            className={cn(
              "h-16 w-16 rounded-full flex items-center justify-center text-white font-black text-xl",
              "bg-gradient-to-br from-blue-500 to-purple-600", // Yorqin rang gradient
              "shadow-2xl shadow-purple-500/70 transition-all duration-300 ease-in-out", // Doimiy soya
              "border-4 border-[#0d0d1e]", // Fon bilan bir xil rangdagi qalin ramka (ko'tarilgan effekt uchun)
              location.pathname === "/chat" && "scale-105 shadow-purple-400/90" // Aktiv bo'lganda yanada ta'kidlanadi
            )}
          >
            AI
          </div>
        </NavLink>
        
        {/* 3. O'ng tomon (Hisob-kitob, Profil) */}
        <div className="flex w-2/5 justify-around items-center">
            <BottomItem
                to="/calculator"
                label="Hisob-kitob"
                icon={Calculator}
                active={location.pathname === "/calculator"}
            />
            <BottomItem
                to="/profile"
                label="Profil"
                icon={User}
                active={location.pathname === "/profile"}
            />
        </div>

      </div>
    </nav>
  );
};

function BottomItem({ to, label, icon: Icon, active }: any) {
  // Matnni ikki qatorga bo'lish uchun funksiya
  const splitLabel = label.split(" ");
  
  return (
    <NavLink
      to={to}
      className={cn(
        "flex flex-col items-center justify-start h-16 w-16 py-1 transition-all",
        "rounded-xl bg-black/20 border border-transparent hover:border-blue-500/50", // Alohida ramka (Card)
        // Aktiv bo'lganda neon ramka effekti
        active && "border-blue-500/80 shadow-lg shadow-blue-500/20 bg-black/30"
      )}
    >
      {/* Ikonka */}
      <Icon 
        className={cn("h-6 w-6 mb-1 transition-colors", 
          // Aktiv rang: Ko'k Neon; Oddiy rang: Oq/Kulrang
          active ? "text-blue-400" : "text-gray-300 hover:text-white"
        )} 
        strokeWidth={active ? 2.5 : 2} 
      />
      {/* Matn - ikki qatorga ajratish */}
      <span className="text-[10px] font-medium text-center leading-tight">
          {/* Birinchi so'z */}
          <span className={cn("block", active ? "text-blue-400" : "text-gray-300")}>{splitLabel[0]}</span>
          {/* Ikkinchi so'z */}
          {splitLabel[1] && <span className={cn("block", active ? "text-blue-400" : "text-gray-300")}>{splitLabel[1]}</span>}
      </span>
    </NavLink>
  );
}