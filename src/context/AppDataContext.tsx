import { createContext, useContext, useMemo, useState, useCallback, useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { GeoPoint } from "../utils/geo";
import { haversineDistance } from "../utils/geo";
import { buildPriorityZones, calculatePriorityScore, getUrgencyValue, getSeverityValue } from "../utils/analytics";

// Types
export interface EmergencyRequest {
  id: string;
  userId: string;
  category: string;
  urgency: string;
  description: string;
  location: GeoPoint | null;
  status: string;
  citizenName: string;
  ngoId: string;
  ngoName: string;
  assignedVolunteerId: string;
  volunteerName: string;
  eta: number | null;
  priorityScore: number;
  photoUrl: string;
  createdAt: number;
  distanceKm?: number | null;
}

export interface Volunteer {
  id: string;
  userId: string;
  name: string;
  email: string;
  skills: string[];
  location: GeoPoint | null;
  available: boolean;
  trustScore: number;
  completedTasks: number;
  distanceKm?: number | null;
}

export interface Ngo {
  id: string;
  userId: string;
  ngoName: string;
  email: string;
  services: string[];
  location: GeoPoint | null;
  trustScore: number;
  capacity: number;
  distanceKm?: number | null;
}

export interface UserProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: "citizen" | "volunteer" | "ngo";
  phone: string;
  location: GeoPoint | null;
  trustScore: number;
}

interface AppDataContextValue {
  loading: boolean;
  location: GeoPoint | null;
  requests: EmergencyRequest[];
  activeRequests: EmergencyRequest[];
  nearbyRequests: EmergencyRequest[];
  myRequests: EmergencyRequest[];
  volunteers: Volunteer[];
  ngos: Ngo[];
  priorityZones: any[];
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  emergencyMode: boolean;
  createEmergency: (data: Record<string, any>) => Promise<string>;
  acceptRequest: (id: string) => Promise<void>;
  assignVolunteer: (requestId: string, volunteerId: string) => Promise<void>;
  volunteerAdvance: (requestId: string, status: string) => Promise<void>;
  completeRequest: (id: string) => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => Promise<void>;
  setEmergencyMode: (v: boolean) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

const FALLBACK_LOCATION: GeoPoint = { lat: 12.9716, lng: 77.5946 };

function toGeo(lat: number | null, lng: number | null): GeoPoint | null {
  return lat != null && lng != null ? { lat, lng } : null;
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [ngos, setNgos] = useState<Ngo[]>([]);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [location, setLocation] = useState<GeoPoint | null>(FALLBACK_LOCATION);

  const isAuthenticated = user !== null;

  // Real browser geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}, // keep fallback on error
      { enableHighAccuracy: true, timeout: 10000 }
    );
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Fetch profile
  useEffect(() => {
    if (!user) { setProfile(null); return; }
    supabase.from("profiles").select("*").eq("user_id", user.id).single()
      .then(({ data }) => {
        if (data) {
          setProfile({
            id: data.id,
            userId: data.user_id,
            name: data.full_name || data.email.split("@")[0],
            email: data.email,
            role: data.role as "citizen" | "volunteer" | "ngo",
            phone: data.phone || "",
            location: toGeo(data.location_lat, data.location_lng),
            trustScore: data.trust_score ?? 4.5,
          });
        }
      });
  }, [user]);

  // Fetch data
  useEffect(() => {
    if (!user) { setDataLoading(false); return; }

    const fetchAll = async () => {
      const [reqRes, volRes, ngoRes] = await Promise.all([
        supabase.from("emergency_requests").select("*, ngos(ngo_name), volunteers(user_id, profiles:profiles!volunteers_user_id_fkey(full_name))").order("created_at", { ascending: false }),
        supabase.from("volunteers").select("*, profiles!volunteers_user_id_fkey(full_name, email, trust_score)"),
        supabase.from("ngos").select("*, profiles!ngos_user_id_fkey(full_name, email, trust_score)"),
      ]);

      if (reqRes.data) {
        setRequests(reqRes.data.map((r: any) => ({
          id: r.id,
          userId: r.user_id,
          category: r.category,
          urgency: r.urgency,
          description: r.description,
          location: toGeo(r.location_lat, r.location_lng),
          status: r.status,
          citizenName: r.citizen_name || "",
          ngoId: r.ngo_id || "",
          ngoName: r.ngos?.ngo_name || "",
          assignedVolunteerId: r.assigned_volunteer_id || "",
          volunteerName: r.volunteers?.profiles?.full_name || "",
          eta: r.eta,
          priorityScore: r.priority_score || 0,
          photoUrl: r.photo_url || "",
          createdAt: new Date(r.created_at).getTime(),
        })));
      }

      if (volRes.data) {
        setVolunteers(volRes.data.map((v: any) => ({
          id: v.id,
          userId: v.user_id,
          name: v.profiles?.full_name || "",
          email: v.profiles?.email || "",
          skills: v.skills || [],
          location: toGeo(v.location_lat, v.location_lng),
          available: v.available ?? true,
          trustScore: v.profiles?.trust_score ?? 4.5,
          completedTasks: v.completed_tasks || 0,
        })));
      }

      if (ngoRes.data) {
        setNgos(ngoRes.data.map((n: any) => ({
          id: n.id,
          userId: n.user_id,
          ngoName: n.ngo_name,
          email: n.profiles?.email || "",
          services: n.services || [],
          location: toGeo(n.location_lat, n.location_lng),
          trustScore: n.profiles?.trust_score ?? 4.5,
          capacity: n.capacity || 10,
        })));
      }

      setDataLoading(false);
    };

    fetchAll();

    // Realtime subscription for requests
    const channel = supabase.channel("requests-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "emergency_requests" }, () => {
        fetchAll();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const activeRequests = useMemo(() => requests.filter((r) => r.status !== "Completed"), [requests]);

  const nearbyRequests = useMemo(() => {
    return activeRequests
      .map((r) => ({ ...r, distanceKm: haversineDistance(location, r.location) }))
      .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
  }, [activeRequests, location]);

  const myRequests = useMemo(() => {
    if (!profile) return [];
    if (profile.role === "citizen") return requests.filter((r) => r.userId === user?.id);
    if (profile.role === "volunteer") {
      const vol = volunteers.find((v) => v.userId === user?.id);
      return vol ? requests.filter((r) => r.assignedVolunteerId === vol.id) : [];
    }
    if (profile.role === "ngo") {
      const ngo = ngos.find((n) => n.userId === user?.id);
      return ngo ? requests.filter((r) => r.ngoId === ngo.id) : [];
    }
    return [];
  }, [requests, profile, user, volunteers, ngos]);

  const priorityZones = useMemo(() => buildPriorityZones([], requests), [requests]);

  const createEmergency = useCallback(async (data: Record<string, any>) => {
    const ps = calculatePriorityScore({
      averageUrgency: getUrgencyValue(data.urgency),
      severity: getSeverityValue(data.category),
      totalReports: 1,
      recentReports: 1,
    });

    const { data: row, error } = await supabase.from("emergency_requests").insert({
      user_id: user!.id,
      category: data.category,
      urgency: data.urgency,
      description: data.description,
      location_lat: location?.lat ?? null,
      location_lng: location?.lng ?? null,
      citizen_name: profile?.name || "",
      priority_score: ps,
      status: "Created",
      people_affected: data.people_affected ? parseInt(data.people_affected) || null : null,
      volunteers_needed: data.volunteers_needed || null,
      disaster_type: data.disaster_type || null,
      severity_level: data.severity_level || null,
      immediate_danger: data.immediate_danger || null,
      landmark: data.landmark || null,
      media_urls: data.media_urls || [],
      food_type_needed: data.food_type_needed || null,
      sanitization_type: data.sanitization_type || null,
      area_size: data.area_size || null,
    }).select().single();

    if (error) throw error;
    return row.id;
  }, [user, profile, location]);

  const acceptRequest = useCallback(async (id: string) => {
    const ngo = ngos.find((n) => n.userId === user?.id);
    await supabase.from("emergency_requests").update({
      status: "Accepted",
      ngo_id: ngo?.id || null,
    }).eq("id", id);
  }, [user, ngos]);

  const assignVolunteer = useCallback(async (requestId: string, volunteerId: string) => {
    await supabase.from("emergency_requests").update({
      status: "Volunteer assigned",
      assigned_volunteer_id: volunteerId,
    }).eq("id", requestId);
  }, []);

  const volunteerAdvance = useCallback(async (requestId: string, status: string) => {
    await supabase.from("emergency_requests").update({ status }).eq("id", requestId);
  }, []);

  const completeRequest = useCallback(async (id: string) => {
    await supabase.from("emergency_requests").update({ status: "Completed" }).eq("id", id);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await signIn(email, password);
    return true;
  }, [signIn]);

  const register = useCallback(async (data: any) => {
    const metadata: Record<string, string> = {
      full_name: data.fullName || data.ngoName || "",
      role: data.role || "citizen",
    };
    await signUp(data.email, data.password, metadata);

    // After signup, if volunteer or ngo, create their extra record
    // This will be handled after the user confirms email and logs in
    return true;
  }, [signUp]);

  const logout = useCallback(async () => {
    await signOut();
    setProfile(null);
  }, [signOut]);

  const value = useMemo(() => ({
    loading: authLoading || dataLoading,
    location,
    requests,
    activeRequests,
    nearbyRequests,
    myRequests,
    volunteers,
    ngos,
    priorityZones,
    currentUser: profile,
    isAuthenticated,
    emergencyMode,
    createEmergency,
    acceptRequest,
    assignVolunteer,
    volunteerAdvance,
    completeRequest,
    login,
    register,
    logout,
    setEmergencyMode,
  }), [authLoading, dataLoading, requests, activeRequests, nearbyRequests, myRequests, volunteers, ngos, priorityZones, profile, isAuthenticated, emergencyMode, createEmergency, acceptRequest, assignVolunteer, volunteerAdvance, completeRequest, login, register, logout]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
