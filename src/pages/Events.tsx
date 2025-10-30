import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Users, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CreateEventDialog from "@/components/CreateEventDialog";

interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  start_date: string;
  end_date: string;
  max_participants: number;
  created_at: string;
}

const Events = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    checkUser();
    fetchEvents();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }
    
    setUser(session.user);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  };

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("start_date", { ascending: true });

    if (error) {
      toast.error("Failed to load events");
      console.error(error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || event.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      sports: "bg-blue-500",
      hackathon: "bg-green-500",
      cultural: "bg-purple-500",
      workshop: "bg-orange-500",
      other: "bg-gray-500",
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">CampusEventHub</h1>
            <p className="text-sm text-muted-foreground">Discover & Register for Events</p>
          </div>
          
          <div className="flex items-center gap-4">
            <CreateEventDialog onEventCreated={fetchEvents} />
            <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
              Admin Panel
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="hackathon">Hackathon</SelectItem>
                <SelectItem value="cultural">Cultural</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No events found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-elevated transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{event.title}</CardTitle>
                    <Badge className={getCategoryColor(event.category)}>
                      {event.category}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {event.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(event.start_date).toLocaleDateString()}
                  </div>
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2" />
                    {event.location}
                  </div>
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="w-4 h-4 mr-2" />
                    Max {event.max_participants} participants
                  </div>
                  
                  <Button className="w-full mt-4">Register Now</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Events;