import { useNavigate } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";
import { getCategoryMeta, STATUS_COPY } from "../data/system";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, LogOut, Star, CheckCircle2, Clock, Shield } from "lucide-react";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, myRequests, logout } = useAppData();

  if (!isAuthenticated || !currentUser) {
    navigate("/auth");
    return null;
  }

  const activeCount = myRequests.filter((r) => r.status !== "Completed").length;
  const completedCount = myRequests.filter((r) => r.status === "Completed").length;

  const roleLabel = currentUser.role === "ngo" ? "NGO Coordinator"
    : currentUser.role === "volunteer" ? "Volunteer"
    : "Citizen Reporter";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">{currentUser.name}</h1>
              <p className="text-sm text-muted-foreground">{currentUser.email}</p>
              <Badge variant="outline" className="mt-1 text-xs">{roleLabel}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-5 h-5 mx-auto text-warning mb-1" />
            <p className="text-xl font-bold text-foreground">{activeCount}</p>
            <p className="text-[10px] text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-5 h-5 mx-auto text-success mb-1" />
            <p className="text-xl font-bold text-foreground">{completedCount}</p>
            <p className="text-[10px] text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="w-5 h-5 mx-auto text-warning mb-1" />
            <p className="text-xl font-bold text-foreground">{currentUser.trustScore.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">Trust Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Trust & Verification */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-success" />
            <div>
              <p className="text-sm font-medium text-foreground">Verified Account</p>
              <p className="text-xs text-muted-foreground">Your identity has been verified on the ResQLink network.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {myRequests.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-foreground mb-3">Recent Activity</h2>
          <div className="space-y-2">
            {myRequests.slice(0, 5).map((req) => (
              <Card key={req.id} className="border-border/50">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{getCategoryMeta(req.category).emoji}</span>
                    <div>
                      <p className="text-xs font-medium text-foreground">{getCategoryMeta(req.category).label}</p>
                      <p className="text-[10px] text-muted-foreground">{req.description?.slice(0, 40) || "Request"}</p>
                    </div>
                  </div>
                  <Badge variant={req.status === "Completed" ? "secondary" : "outline"} className="text-[10px]">
                    {STATUS_COPY[req.status] || req.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Separator />

      <Button
        variant="outline"
        className="w-full text-destructive hover:bg-destructive/10"
        onClick={async () => {
          await logout();
          navigate("/");
        }}
      >
        <LogOut className="w-4 h-4 mr-2" /> Sign Out
      </Button>
    </div>
  );
}
