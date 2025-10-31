import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface Registration {
  id: string;
  status: string;
  created_at: string;
  user_id: string;
  event_id: string;
  profiles: {
    name: string;
    college: string;
  };
  events: {
    title: string;
  };
}

interface RegistrationManagementProps {
  eventId?: string;
}

export const RegistrationManagement = ({ eventId }: RegistrationManagementProps) => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRegistrations();
  }, [eventId]);

  const fetchRegistrations = async () => {
    setLoading(true);
    
    const { data: regData, error: regError } = await supabase
      .from("registrations")
      .select("*")
      .order("created_at", { ascending: false });

    if (regError) {
      toast({
        title: "Error fetching registrations",
        description: regError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Fetch profiles and events data
    const userIds = [...new Set(regData.map(r => r.user_id))];
    const eventIds = [...new Set(regData.map(r => r.event_id))];

    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, name, college")
      .in("id", userIds);

    const { data: eventsData } = await supabase
      .from("events")
      .select("id, title")
      .in("id", eventIds);

    // Combine the data
    const enrichedData = regData.map(reg => {
      const profile = profilesData?.find(p => p.id === reg.user_id);
      const event = eventsData?.find(e => e.id === reg.event_id);
      return {
        ...reg,
        profiles: profile || { name: "Unknown", college: "Unknown" },
        events: event || { title: "Unknown Event" }
      };
    }).filter(reg => !eventId || reg.event_id === eventId);

    setRegistrations(enrichedData);
    setLoading(false);
  };

  const handleStatusChange = async (registrationId: string, newStatus: "approved" | "rejected") => {
    const { error } = await supabase
      .from("registrations")
      .update({ status: newStatus })
      .eq("id", registrationId);

    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Registration updated",
        description: `Registration ${newStatus} successfully`,
      });
      fetchRegistrations();
    }
  };

  const statusBadge = (status: string) => {
    const config = {
      pending: { icon: Clock, text: "Pending", variant: "outline" as const },
      approved: { icon: CheckCircle, text: "Approved", variant: "default" as const },
      rejected: { icon: XCircle, text: "Rejected", variant: "destructive" as const },
    };
    const { icon: Icon, text, variant } = config[status as keyof typeof config] || config.pending;
    return (
      <Badge variant={variant} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {text}
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading registrations...</div>;
  }

  if (registrations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">No registrations found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registration Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {registrations.map((registration) => (
            <div
              key={registration.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium">{registration.profiles.name}</p>
                <p className="text-sm text-muted-foreground">{registration.profiles.college}</p>
                <p className="text-sm text-muted-foreground">
                  Event: {registration.events.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Applied: {new Date(registration.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(registration.status)}
                {registration.status === "pending" && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleStatusChange(registration.id, "approved")}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleStatusChange(registration.id, "rejected")}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
