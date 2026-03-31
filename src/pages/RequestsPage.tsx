import { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";
import { getCategoryMeta, STATUS_COPY } from "../data/system";
import { formatDistance, haversineDistance, getDirectionsUrl } from "../utils/geo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation, CheckCircle2, Play, UserCheck, Clock } from "lucide-react";

export default function RequestsPage() {
  const navigate = useNavigate();
  const {
    currentUser, isAuthenticated, location, requests, nearbyRequests,
    myRequests, volunteers, acceptRequest, assignVolunteer, volunteerAdvance, completeRequest,
  } = useAppData();

  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }

  const role = currentUser?.role ?? "citizen";
  const displayRequests = role === "citizen" ? myRequests : nearbyRequests;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Requests</h1>
        <p className="text-sm text-muted-foreground">
          {role === "citizen" ? "Track your help requests" : `${displayRequests.length} active requests nearby`}
        </p>
      </div>

      {displayRequests.length === 0 && (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No requests yet.</CardContent></Card>
      )}

      <div className="space-y-3">
        {displayRequests.map((req) => {
          const cat = getCategoryMeta(req.category);
          const dist = haversineDistance(location, req.location);

          return (
            <Card key={req.id} className="border-border/50 overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cat.emoji}</span>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{cat.label}</p>
                      <p className="text-xs text-muted-foreground">{req.citizenName}</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      req.status === "Completed" ? "border-success/50 text-success" :
                      req.urgency === "critical" ? "border-emergency/50 text-emergency" :
                      "border-warning/50 text-warning"
                    }
                  >
                    {STATUS_COPY[req.status] || req.status}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground">{req.description || "No additional details."}</p>

                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {dist != null && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {formatDistance(dist)}
                    </span>
                  )}
                  {req.volunteerName && (
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3 h-3" /> {req.volunteerName}
                    </span>
                  )}
                  {req.ngoName && (
                    <span className="flex items-center gap-1">
                      <Navigation className="w-3 h-3" /> {req.ngoName}
                    </span>
                  )}
                  {req.eta && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> ~{req.eta} min
                    </span>
                  )}
                </div>

                {/* NGO Actions */}
                {role === "ngo" && req.status !== "Completed" && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {req.status === "Requested" && (
                      <Button size="sm" variant="outline" onClick={() => acceptRequest(req.id)}>
                        Accept
                      </Button>
                    )}
                    {(req.status === "Accepted" || req.status === "Requested") && (
                      <Select onValueChange={(v) => assignVolunteer(req.id, v)}>
                        <SelectTrigger className="w-auto h-8 text-xs">
                          <SelectValue placeholder="Assign volunteer" />
                        </SelectTrigger>
                        <SelectContent>
                          {volunteers.filter((v) => v.available).map((v) => (
                            <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button size="sm" variant="outline" className="text-success" onClick={() => completeRequest(req.id)}>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Complete
                    </Button>
                  </div>
                )}

                {/* Volunteer Actions */}
                {role === "volunteer" && req.status !== "Completed" && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {req.status !== "In progress" && (
                      <Button size="sm" variant="outline" onClick={() => volunteerAdvance(req.id, "In progress")}>
                        <Play className="w-3.5 h-3.5 mr-1" /> Start
                      </Button>
                    )}
                    {req.location && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={getDirectionsUrl(req.location)} target="_blank" rel="noopener noreferrer">
                          <Navigation className="w-3.5 h-3.5 mr-1" /> Navigate
                        </a>
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="text-success" onClick={() => completeRequest(req.id)}>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Complete
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
