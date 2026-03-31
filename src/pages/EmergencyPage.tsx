import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";
import { REQUEST_CATEGORIES, URGENCY_OPTIONS, getCategoryMeta, STATUS_COPY } from "../data/system";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Send, Clock, CheckCircle2, MapPin } from "lucide-react";

export default function EmergencyPage() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, createEmergency, myRequests } = useAppData();
  const [category, setCategory] = useState("general");
  const [urgency, setUrgency] = useState("critical");
  const [description, setDescription] = useState("");
  const [sent, setSent] = useState(false);
  const [lastId, setLastId] = useState<string | null>(null);

  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }

  const handleSend = async () => {
    try {
      const id = await createEmergency({ category, urgency, description });
      setLastId(id);
      setSent(true);
      setDescription("");
      setTimeout(() => setSent(false), 4000);
    } catch (err) {
      console.error("Failed to create emergency:", err);
    }
  };

  const catMeta = getCategoryMeta(category);
  const recentActive = myRequests.filter((r) => r.status !== "Completed").slice(0, 3);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
      <div>
        <Badge variant="outline" className="border-emergency/30 text-emergency mb-3">
          <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Emergency reporting
        </Badge>
        <h1 className="text-2xl font-bold text-foreground">Report an emergency</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Select category, urgency, and describe the situation. We'll auto-match the nearest help.
        </p>
      </div>

      {/* Category Grid */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Category</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {REQUEST_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`rounded-lg p-3 text-left transition-all border ${
                category === cat.id
                  ? "border-emergency bg-emergency/10 shadow-sm"
                  : "border-border bg-card hover:border-emergency/30"
              }`}
            >
              <span className="text-xl">{cat.emoji}</span>
              <p className="text-xs font-medium text-foreground mt-1">{cat.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Urgency */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Urgency</p>
        <div className="flex gap-2">
          {URGENCY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setUrgency(opt.id)}
              className={`flex-1 rounded-lg py-2.5 px-3 text-xs font-medium border transition-all ${
                urgency === opt.id
                  ? "border-emergency bg-emergency/10 text-emergency"
                  : "border-border bg-card text-muted-foreground hover:border-emergency/30"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <p className="text-sm font-medium text-foreground mb-2">Describe the situation</p>
        <Textarea
          placeholder="What's happening? Include any details that can help responders..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      {/* Send */}
      <Button
        className="w-full bg-emergency hover:bg-emergency/90 text-emergency-foreground h-12 text-base"
        onClick={handleSend}
      >
        <Send className="w-5 h-5 mr-2" />
        Send emergency request
      </Button>

      {/* Success toast */}
      <AnimatePresence>
        {sent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-success/30 bg-success/5">
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-sm">Emergency sent!</p>
                  <p className="text-xs text-muted-foreground">Auto-matching with nearest responders...</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Requests */}
      {recentActive.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-foreground mb-3">Your active requests</h2>
          <div className="space-y-2">
            {recentActive.map((req) => (
              <Card key={req.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span>{getCategoryMeta(req.category).emoji}</span>
                        <span className="text-sm font-medium text-foreground">
                          {getCategoryMeta(req.category).label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{req.description || "No details"}</p>
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {STATUS_COPY[req.status] || req.status}
                    </Badge>
                  </div>
                  {req.volunteerName && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {req.volunteerName}
                      {req.eta && <> · <Clock className="w-3 h-3" /> ~{req.eta} min</>}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
