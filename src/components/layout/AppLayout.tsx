import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { SOSButton } from "./SOSButton";

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <SOSButton />
      <main className="pb-20">{children}</main>
      <BottomNav />
    </div>
  );
};
