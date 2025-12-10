import { useState, useEffect } from "react";
import { 
  Users, 
  Activity, 
  TrendingUp,
  UserCheck,
  Calendar,
  ArrowLeft,
  BarChart3,
  Clock,
  AlertTriangle,
  Settings,
} from "lucide-react";

interface UserStats {
  totalUsers: number;
  activeToday: number;
  newThisWeek: number;
  newThisMonth: number;
  recentUsers: Array<{
    id: string;
    username: string;
    created_at: string;
    last_seen: string;
  }>;
}

export default function Admin() {
  const [stats] = useState<UserStats>({
    totalUsers: 0,
    activeToday: 0,
    newThisWeek: 0,
    newThisMonth: 0,
    recentUsers: [],
  });

  // Orqaga qaytish funksiyasi
  const goBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden pb-20 bg-gradient-to-br from-[#0A122A] via-[#1a1a3e] to-[#0A122A]">
      
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -top-20 -left-20 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse delay-1000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        
        {/* Header */}
        <header className="pt-12 pb-6 px-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={goBack}
              className="w-10 h-10 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 flex items-center justify-center text-blue-400 transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
              <p className="text-gray-400 text-sm">Foydalanuvchilar statistikasi</p>
            </div>
          </div>
        </header>

        {/* Texnik Ishlar Xabari */}
        <section className="px-4 mb-6">
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/30 flex items-center justify-center flex-shrink-0 animate-pulse">
                <AlertTriangle className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white mb-2">
                  Texnik Ishlar Olib Borilmoqda
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">
                  Uzr, bu bo'limda hozirda texnik ishlar olib borilmoqda. 
                  Tezda bu bo'lim <span className="text-yellow-400 font-semibold">faqatgina adminlar</span> uchun ishga tushadi.
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Settings className="h-4 w-4 animate-spin" />
                  <span>Qiziqishingiz uchun rahmat!</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Cards - Disabled State */}
        <section className="px-4 space-y-3 opacity-50 pointer-events-none">
          
          {/* Jami Foydalanuvchilar */}
          <div className="border-0 shadow-lg bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm border border-blue-500/30 rounded-xl">
            <div className="p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-600/40 flex items-center justify-center border border-blue-500/50">
                <Users className="h-7 w-7 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-blue-300 font-medium">JAMI FOYDALANUVCHILAR</p>
                <p className="text-3xl font-bold text-white mt-1">--</p>
              </div>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 gap-3">
            
            {/* Bugun Aktiv */}
            <div className="border-0 shadow-lg bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-sm border border-green-500/30 rounded-xl">
              <div className="p-4">
                <div className="w-10 h-10 rounded-lg bg-green-600/40 flex items-center justify-center border border-green-500/50 mb-3">
                  <Activity className="h-5 w-5 text-green-400" />
                </div>
                <p className="text-xs text-green-300 font-medium">BUGUN AKTIV</p>
                <p className="text-2xl font-bold text-white mt-1">--</p>
              </div>
            </div>

            {/* Haftalik Yangi */}
            <div className="border-0 shadow-lg bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-sm border border-purple-500/30 rounded-xl">
              <div className="p-4">
                <div className="w-10 h-10 rounded-lg bg-purple-600/40 flex items-center justify-center border border-purple-500/50 mb-3">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                </div>
                <p className="text-xs text-purple-300 font-medium">HAFTALIK YANGI</p>
                <p className="text-2xl font-bold text-white mt-1">--</p>
              </div>
            </div>

            {/* Oylik Yangi */}
            <div className="border-0 shadow-lg bg-gradient-to-br from-orange-600/20 to-orange-800/20 backdrop-blur-sm border border-orange-500/30 rounded-xl">
              <div className="p-4">
                <div className="w-10 h-10 rounded-lg bg-orange-600/40 flex items-center justify-center border border-orange-500/50 mb-3">
                  <Calendar className="h-5 w-5 text-orange-400" />
                </div>
                <p className="text-xs text-orange-300 font-medium">OYLIK YANGI</p>
                <p className="text-2xl font-bold text-white mt-1">--</p>
              </div>
            </div>

            {/* O'sish Sur'ati */}
            <div className="border-0 shadow-lg bg-gradient-to-br from-cyan-600/20 to-cyan-800/20 backdrop-blur-sm border border-cyan-500/30 rounded-xl">
              <div className="p-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-600/40 flex items-center justify-center border border-cyan-500/50 mb-3">
                  <BarChart3 className="h-5 w-5 text-cyan-400" />
                </div>
                <p className="text-xs text-cyan-300 font-medium">O'SISH</p>
                <p className="text-2xl font-bold text-white mt-1">--%</p>
              </div>
            </div>
          </div>
        </section>

        {/* So'nggi Foydalanuvchilar - Disabled */}
        <section className="px-4 mt-6 opacity-50 pointer-events-none">
          <h2 className="text-sm font-semibold text-gray-400 uppercase mb-3 flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            So'nggi Foydalanuvchilar
          </h2>
          
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-0 shadow-lg bg-black/30 backdrop-blur-sm rounded-xl">
                <div className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center text-white font-bold">
                    --
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="h-4 bg-gray-700/50 rounded w-24 mb-1"></div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      <div className="h-3 bg-gray-700/50 rounded w-20"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-3 bg-gray-700/50 rounded w-16 mb-1"></div>
                    <div className="h-3 bg-gray-700/50 rounded w-12"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Orqaga Qaytish Tugmasi */}
        <section className="px-4 mt-6">
          <button
            onClick={goBack}
            className="w-full h-12 bg-blue-600/20 border-2 border-blue-500/50 text-blue-400 hover:bg-blue-600/30 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Orqaga Qaytish
          </button>
        </section>

        {/* Footer Info */}
        <section className="px-4 mt-6 text-center">
          <p className="text-xs text-gray-500">
            Admin funksiyalari tez orada faollashtiriladi
          </p>
          <p className="text-xs text-gray-600 mt-1">
            v1.0.0-beta
          </p>
        </section>
      </div>
    </div>
  );
}