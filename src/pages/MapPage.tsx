import { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import L from "leaflet";
import { useAppData } from "../context/AppDataContext";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";

function requestColor(req: any) {
  if (req.status === "Completed") return "#22c55e";
  if (req.urgency === "critical") return "#ef4444";
  if (req.urgency === "high") return "#f97316";
  return "#eab308";
}

export default function MapPage() {
  const { nearbyRequests, volunteers, ngos, location, isAuthenticated, priorityZones } = useAppData();
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const center: [number, number] = location ? [location.lat, location.lng] : [12.9716, 77.5946];

  // Initialize and update map
  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current).setView(center, 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapRef.current);
    }

    // Clear existing markers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) {
        mapRef.current!.removeLayer(layer);
      }
    });

    // Add request markers
    nearbyRequests.filter((r) => r.location).forEach((req) => {
      L.circleMarker([req.location!.lat, req.location!.lng], {
        radius: req.urgency === "critical" ? 10 : 7,
        fillColor: requestColor(req),
        color: requestColor(req),
        weight: 2,
        fillOpacity: 0.7,
      })
        .bindPopup(`<strong>${req.category}</strong><br/>${req.description || "Emergency"}<br/><em>${req.status}</em>`)
        .addTo(mapRef.current!);
    });

    // Add volunteer markers
    volunteers.filter((v) => v.location).forEach((vol) => {
      L.circleMarker([vol.location!.lat, vol.location!.lng], {
        radius: 6,
        fillColor: "#3b82f6",
        color: "#3b82f6",
        weight: 2,
        fillOpacity: 0.7,
      })
        .bindPopup(`<strong>${vol.name}</strong><br/>${(vol.skills || []).join(", ")}<br/>${vol.available ? "Available" : "Busy"}`)
        .addTo(mapRef.current!);
    });

    // Add NGO markers
    ngos.filter((n) => n.location).forEach((ngo) => {
      L.circleMarker([ngo.location!.lat, ngo.location!.lng], {
        radius: 8,
        fillColor: "#22c55e",
        color: "#22c55e",
        weight: 2,
        fillOpacity: 0.7,
      })
        .bindPopup(`<strong>${ngo.ngoName}</strong><br/>${(ngo.services || []).join(", ")}<br/>Capacity: ${ngo.capacity}`)
        .addTo(mapRef.current!);
    });

    // Add user location marker
    if (location) {
      L.circleMarker([location.lat, location.lng], {
        radius: 8,
        fillColor: "#8b5cf6",
        color: "#8b5cf6",
        weight: 3,
        fillOpacity: 0.9,
      })
        .bindPopup("Your location")
        .addTo(mapRef.current!);
    }

    return () => {
      // Don't destroy map on data updates, only on unmount
    };
  }, [nearbyRequests, volunteers, ngos, location]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-4">
      <div>
        <Badge variant="outline" className="border-info/30 text-info mb-3">
          <MapPin className="w-3.5 h-3.5 mr-1" /> Map intelligence
        </Badge>
        <h1 className="text-2xl font-bold text-foreground">Live coordination map</h1>
        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
          <span><strong className="text-foreground">{nearbyRequests.length}</strong> nearby requests</span>
          <span><strong className="text-foreground">{priorityZones.length}</strong> priority zones</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emergency inline-block" /> Emergency</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-warning inline-block" /> Request</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-info inline-block" /> Volunteer</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-success inline-block" /> NGO</span>
      </div>

      <Card className="overflow-hidden border-border/50">
        <div ref={containerRef} style={{ height: "400px", width: "100%" }} />
      </Card>
    </div>
  );
}
