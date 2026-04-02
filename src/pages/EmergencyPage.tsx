import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";
import { REQUEST_CATEGORIES, URGENCY_OPTIONS, getCategoryMeta, STATUS_COPY, STATUS_COLORS } from "../data/system";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Send, Clock, CheckCircle2, MapPin, Locate } from "lucide-react";
import FoodForm from "@/components/emergency/FoodForm";
import DisasterForm from "@/components/emergency/DisasterForm";
import SanitationForm from "@/components/emergency/SanitationForm";
import MediaUpload from "@/components/emergency/MediaUpload";

export default function EmergencyPage() {
  const { currentUser, isAuthenticated, createEmergency, myRequests, location } = useAppData();
  const [category, setCategory] = useState("food");
  const [urgency, setUrgency] = useState("critical");
  const [description, setDescription] = useState("");
  const [extraFields, setExtraFields] = useState<Record<string, any>>({});
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const updateField = (field: string, value: any) => {
    setExtraFields((prev) => ({ ...prev, [field]: value }));
  };

  const handleSend = async () => {
    // Sanitation requires proof
    if (category === "sanitation" && mediaUrls.length === 0) {
      return;
    }

    setSubmitting(true);
    try {
      await createEmergency({
        category,
        urgency,
        description,
        ...extraFields,
        media_urls: mediaUrls,
      });
      setSent(true);
      setDescription("");
      setExtraFields({});
      setMediaUrls([]);
      setTimeout(() => setSent(false), 4000);
    } catch (err) {
      console.error("Failed to create emergency:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const recentActive = myRequests.filter((r) => r.status !== "Completed" && r.status !== "Cancelled").slice(0, 5);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
      <div>
        <Badge variant="outline" className="border-emergency/30 text-emergency mb-3">
          <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Emergency reporting
        </Badge>
        <h1 className="text-2xl font-bold text-foreground">Report an emergency</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Select category, fill in details, and we'll auto-match the nearest help.
        </p>
      </div>

      {/* Category Grid */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Category</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {REQUEST_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setCategory(cat.id); setExtraFields({}); }}
              className={`rounded-lg p-3 text-left transition-all border ${
                category === cat.id
                  ? "border-emergency bg-emergency/10 shadow-sm"
                  : "border-border bg-card hover:border-emergency/30"
              }`}
            >
              <span className="text-xl">{cat.emoji}</span>
              <p className="text-xs font-medium text-foreground mt-1">{cat.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{cat.summary}</p>
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

      {/* Dynamic Category Form */}
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-4">
          <p className="text-sm font-medium text-foreground">
            {getCategoryMeta(category).emoji} {getCategoryMeta(category).label} details
          </p>

          {category === "food" && <FoodForm data={extraFields} onChange={updateField} />}
          {category === "disaster" && <DisasterForm data={extraFields} onChange={updateField} />}
          {category === "sanitation" && <SanitationForm data={extraFields} onChange={updateField} />}
          {category === "others" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Nearby landmark</label>
                <Input
                  placeholder="Near school / temple / hospital..."
                  value={extraFields.landmark || ""}
                  onChange={(e) => updateField("landmark", e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media Upload */}
      <MediaUpload
        userId={currentUser?.userId || "anon"}
        files={mediaUrls}
        onChange={setMediaUrls}
        required={category === "sanitation"}
      />

      {/* Location indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card rounded-lg border border-border p-3">
        <Locate className="w-4 h-4 text-info" />
        {location ? (
          <span>📍 Location detected: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
        ) : (
          <span>📍 Getting your location...</span>
        )}
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
        disabled={submitting || (category === "sanitation" && mediaUrls.length === 0)}
      >
        <Send className="w-5 h-5 mr-2" />
        {submitting ? "Sending..." : "Request Help"}
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
                  <p className="text-xs text-muted-foreground">Finding nearest volunteers…</p>
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
                    <Badge variant="outline" className={`text-xs flex-shrink-0 ${STATUS_COLORS[req.status] || ""}`}>
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
