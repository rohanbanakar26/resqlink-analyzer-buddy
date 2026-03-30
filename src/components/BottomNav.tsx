import { NavLink, useLocation } from "react-router-dom";
import { AlertTriangle, Radio, Map, Users, User } from "lucide-react";

const items = [
  { to: "/emergency", label: "Emergency", icon: AlertTriangle },
  { to: "/requests", label: "Requests", icon: Radio },
  { to: "/map", label: "Map", icon: Map },
  { to: "/network", label: "Network", icon: Users },
  { to: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const location = useLocation();

  if (location.pathname === "/" || location.pathname === "/auth") {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "text-emergency"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-emergency" : ""}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
