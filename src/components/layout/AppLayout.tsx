import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { SOSButton } from "./SOSButton";
import Galaxy from "@/components/ui/Galaxy/Galaxy";

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-[#0A122A] relative">
      {/* Galaxy animatsiyasi - barcha sahifalar uchun */}
      <div className="fixed top-0 left-0 w-full h-full z-0 opacity-70 pointer-events-none">
        <Galaxy 
          mouseInteraction={false} 
          density={1.5}
          glowIntensity={0.8} 
          hueShift={0}
          saturation={0.0} 
          transparent={true} 
        />
      </div>

      {/* SOS Button */}
      <div className="relative z-20">
        <SOSButton />
      </div>

      {/* Main Content */}
      <main className="relative z-10 pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <div className="relative z-20">
        <BottomNav />
      </div>
    </div>
  );
};