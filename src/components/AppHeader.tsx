import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Bell, LogOut, Zap } from "lucide-react";

export default function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, activeRequests, logout, emergencyMode, setEmergencyMode } = useAppData();

  if (location.pathname === "/" || location.pathname === "/auth") {
    return null;
  }

  const criticalCount = activeRequests.filter((r) => r.urgency === "critical").length;

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between max-w-5xl mx-auto px-4 h-14">
        <Link to="/emergency" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emergency flex items-center justify-center">
            <Zap className="w-4 h-4 text-emergency-foreground" />
          </div>
          <span className="font-bold text-foreground text-sm">
            Res<span className="text-emergency">Q</span>Link
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-emergency relative"
              onClick={() => navigate("/requests")}
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-emergency text-emergency-foreground text-[10px] flex items-center justify-center">
                {criticalCount}
              </span>
            </Button>
          )}

          {isAuthenticated && (
            <Button variant="ghost" size="sm" onClick={async () => { await logout(); navigate("/"); }}>
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
