import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, XCircle } from "lucide-react";

interface EventRegistrationProps {
  eventId: string;
  userId: string;
  onRegistrationChange?: () => void;
}

export const EventRegistration = ({ eventId, userId, onRegistrationChange }: EventRegistrationProps) => {
  const [registration, setRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRegistration();
  }, [eventId, userId]);

  const fetchRegistration = async () => {
    const { data } = await supabase
      .from("registrations")
      .select("*")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle();
    
    setRegistration(data);
  };

  const handleRegister = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("registrations")
      .insert({
        event_id: eventId,
        user_id: userId,
        status: "pending"
      });

    if (error) {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Registration submitted",
        description: "Your registration is pending approval",
      });
      fetchRegistration();
      onRegistrationChange?.();
    }
    setLoading(false);
  };

  if (!registration) {
    return (
      <Button onClick={handleRegister} disabled={loading} size="sm">
        Register
      </Button>
    );
  }

  const statusConfig = {
    pending: { icon: Clock, text: "Pending", variant: "outline" as const },
    approved: { icon: CheckCircle, text: "Registered", variant: "default" as const },
    rejected: { icon: XCircle, text: "Rejected", variant: "destructive" as const },
  };

  const config = statusConfig[registration.status as keyof typeof statusConfig];
  const Icon = config.icon;

  return (
    <Button variant={config.variant} size="sm" disabled>
      <Icon className="w-4 h-4 mr-2" />
      {config.text}
    </Button>
  );
};
