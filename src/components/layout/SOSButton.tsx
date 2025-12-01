import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const SOSButton = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Don't show on auth page
  if (location.pathname === "/auth") return null;

  const handleSOS = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Please sign in",
          description: "You need to be signed in to use SOS",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Get location if permitted
      let locationData = null;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              enableHighAccuracy: true,
            });
          });
          locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
        } catch (e) {
          console.log("Location not available");
        }
      }

      const { error } = await supabase.from("sos_logs").insert({
        user_id: user.id,
        location: locationData,
        current_screen: location.pathname,
      });

      if (error) throw error;

      toast({
        title: "SOS Alert Sent!",
        description: "An admin has been notified and will contact you shortly.",
        variant: "destructive",
      });
    } catch (error) {
      console.error("SOS error:", error);
      toast({
        title: "Error",
        description: "Failed to send SOS. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button
        variant="sos"
        size="icon"
        className="fixed right-4 top-4 z-50 rounded-full shadow-lg"
        onClick={() => setIsOpen(true)}
      >
        <AlertTriangle className="h-5 w-5" />
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Emergency SOS
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately notify our admin team. Use this only for urgent situations.
              Your location and current screen will be shared if available.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSOS}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Sending..." : "Send SOS Alert"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
