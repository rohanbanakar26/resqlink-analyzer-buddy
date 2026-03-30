import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from "react";
import type { GeoPoint } from "../utils/geo";
import { haversineDistance, formatDistance } from "../utils/geo";
import { findBestNgo, findBestVolunteer } from "../utils/matching";
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
  createEmergency: (data: { category: string; urgency: string; description: string }) => string;
  acceptRequest: (id: string) => void;
  assignVolunteer: (requestId: string, volunteerId: string) => void;
  volunteerAdvance: (requestId: string, status: string) => void;
  completeRequest: (id: string) => void;
  login: (email: string, password: string) => boolean;
  register: (data: any) => boolean;
  logout: () => void;
  setEmergencyMode: (v: boolean) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

// Demo data
const DEMO_LOCATION: GeoPoint = { lat: 12.9716, lng: 77.5946 }; // Bangalore

const DEMO_VOLUNTEERS: Volunteer[] = [
  { id: "v1", name: "Priya Sharma", email: "priya@help.org", skills: ["medical", "first aid"], location: { lat: 12.975, lng: 77.590 }, available: true, trustScore: 4.8, completedTasks: 23 },
  { id: "v2", name: "Arjun Patel", email: "arjun@help.org", skills: ["food", "logistics", "delivery"], location: { lat: 12.965, lng: 77.600 }, available: true, trustScore: 4.5, completedTasks: 15 },
  { id: "v3", name: "Meera Reddy", email: "meera@help.org", skills: ["rescue", "disaster", "transport"], location: { lat: 12.980, lng: 77.585 }, available: true, trustScore: 4.9, completedTasks: 41 },
  { id: "v4", name: "Karan Singh", email: "karan@help.org", skills: ["shelter", "community support"], location: { lat: 12.960, lng: 77.610 }, available: false, trustScore: 4.3, completedTasks: 8 },
];

const DEMO_NGOS: Ngo[] = [
  { id: "n1", ngoName: "Bangalore Relief Force", email: "brf@ngo.org", services: ["disaster", "food", "shelter"], location: { lat: 12.970, lng: 77.600 }, trustScore: 4.9, capacity: 50 },
  { id: "n2", ngoName: "Care Foundation India", email: "cfi@ngo.org", services: ["medical", "senior", "education"], location: { lat: 12.985, lng: 77.580 }, trustScore: 4.7, capacity: 30 },
  { id: "n3", ngoName: "Green Helpers", email: "gh@ngo.org", services: ["sanitation", "education"], location: { lat: 12.950, lng: 77.620 }, trustScore: 4.4, capacity: 15 },
];

const INITIAL_REQUESTS: EmergencyRequest[] = [
  { id: "r1", userId: "u1", category: "food", urgency: "high", description: "Community kitchen needed for 50+ families affected by flooding in Koramangala", location: { lat: 12.935, lng: 77.612 }, status: "Volunteer assigned", citizenName: "Ravi Kumar", ngoId: "n1", ngoName: "Bangalore Relief Force", assignedVolunteerId: "v2", volunteerName: "Arjun Patel", eta: 15, priorityScore: 210, photoUrl: "", createdAt: Date.now() - 3600000 },
  { id: "r2", userId: "u2", category: "medical", urgency: "critical", description: "Elderly person needs urgent medical attention, medication running out", location: { lat: 12.978, lng: 77.592 }, status: "In progress", citizenName: "Sunita Devi", ngoId: "n2", ngoName: "Care Foundation India", assignedVolunteerId: "v1", volunteerName: "Priya Sharma", eta: 5, priorityScore: 280, photoUrl: "", createdAt: Date.now() - 1800000 },
  { id: "r3", userId: "u3", category: "disaster", urgency: "critical", description: "Building partially collapsed after heavy rains, families trapped on upper floors", location: { lat: 12.960, lng: 77.595 }, status: "Accepted", citizenName: "Mohammed Ali", ngoId: "n1", ngoName: "Bangalore Relief Force", assignedVolunteerId: "", volunteerName: "", eta: null, priorityScore: 320, photoUrl: "", createdAt: Date.now() - 900000 },
  { id: "r4", userId: "u4", category: "shelter", urgency: "high", description: "Family of 6 displaced, need temporary shelter urgently", location: { lat: 12.945, lng: 77.605 }, status: "Requested", citizenName: "Lakshmi Bai", ngoId: "", ngoName: "", assignedVolunteerId: "", volunteerName: "", eta: null, priorityScore: 190, photoUrl: "", createdAt: Date.now() - 600000 },
  { id: "r5", userId: "u5", category: "sanitation", urgency: "medium", description: "Drainage overflow causing health hazard in residential area", location: { lat: 12.990, lng: 77.575 }, status: "Completed", citizenName: "Venkat Rao", ngoId: "n3", ngoName: "Green Helpers", assignedVolunteerId: "v3", volunteerName: "Meera Reddy", eta: null, priorityScore: 120, photoUrl: "", createdAt: Date.now() - 7200000 },
];

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [requests, setRequests] = useState<EmergencyRequest[]>(INITIAL_REQUESTS);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const location = DEMO_LOCATION;

  const isAuthenticated = currentUser !== null;

  const activeRequests = useMemo(
    () => requests.filter((r) => r.status !== "Completed"),
    [requests],
  );

  const nearbyRequests = useMemo(() => {
    return activeRequests
      .map((r) => ({ ...r, distanceKm: haversineDistance(location, r.location) }))
      .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
  }, [activeRequests, location]);

  const myRequests = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === "citizen") return requests.filter((r) => r.userId === currentUser.id);
    if (currentUser.role === "volunteer") return requests.filter((r) => r.assignedVolunteerId === currentUser.id);
    if (currentUser.role === "ngo") return requests.filter((r) => r.ngoId === currentUser.id);
    return [];
  }, [requests, currentUser]);

  const priorityZones = useMemo(() => buildPriorityZones([], requests), [requests]);

  const createEmergency = useCallback((data: { category: string; urgency: string; description: string }) => {
    const id = `r-${Date.now()}`;
    const bestNgo = findBestNgo({ ...data, location }, DEMO_NGOS);
    const bestVol = findBestVolunteer({ ...data, location }, DEMO_VOLUNTEERS);
    const ps = calculatePriorityScore({
      averageUrgency: getUrgencyValue(data.urgency),
      severity: getSeverityValue(data.category),
      totalReports: 1,
      recentReports: 1,
    });

    const newReq: EmergencyRequest = {
      id,
      userId: currentUser?.id ?? "anon",
      category: data.category,
      urgency: data.urgency,
      description: data.description,
      location,
      status: bestVol ? "Volunteer assigned" : bestNgo ? "Accepted" : "Requested",
      citizenName: currentUser?.name ?? "Citizen",
      ngoId: bestNgo?.id ?? "",
      ngoName: bestNgo?.ngoName ?? "",
      assignedVolunteerId: bestVol?.id ?? "",
      volunteerName: bestVol?.name ?? "",
      eta: bestVol?.distanceKm ? Math.max(5, Math.round(bestVol.distanceKm * 3)) : null,
      priorityScore: ps,
      photoUrl: "",
      createdAt: Date.now(),
    };

    setRequests((prev) => [newReq, ...prev]);
    return id;
  }, [currentUser, location]);

  const acceptRequest = useCallback((id: string) => {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "Accepted", ngoId: currentUser?.id ?? "", ngoName: currentUser?.name ?? "" } : r));
  }, [currentUser]);

  const assignVolunteer = useCallback((requestId: string, volunteerId: string) => {
    const vol = DEMO_VOLUNTEERS.find((v) => v.id === volunteerId);
    setRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, status: "Volunteer assigned", assignedVolunteerId: volunteerId, volunteerName: vol?.name ?? "" } : r));
  }, []);

  const volunteerAdvance = useCallback((requestId: string, status: string) => {
    setRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, status } : r));
  }, []);

  const completeRequest = useCallback((id: string) => {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "Completed" } : r));
  }, []);

  const login = useCallback((email: string, _password: string) => {
    setCurrentUser({
      id: "demo-user",
      name: email.split("@")[0],
      email,
      role: "citizen",
      phone: "",
      location: DEMO_LOCATION,
      trustScore: 4.5,
    });
    return true;
  }, []);

  const register = useCallback((data: any) => {
    setCurrentUser({
      id: "demo-user",
      name: data.fullName || data.ngoName || "User",
      email: data.email,
      role: data.role || "citizen",
      phone: data.phone || "",
      location: DEMO_LOCATION,
      trustScore: 4.5,
    });
    return true;
  }, []);

  const logout = useCallback(() => setCurrentUser(null), []);

  const value = useMemo(() => ({
    loading: false,
    location,
    requests,
    activeRequests,
    nearbyRequests,
    myRequests,
    volunteers: DEMO_VOLUNTEERS,
    ngos: DEMO_NGOS,
    priorityZones,
    currentUser,
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
  }), [requests, activeRequests, nearbyRequests, myRequests, priorityZones, currentUser, isAuthenticated, emergencyMode, createEmergency, acceptRequest, assignVolunteer, volunteerAdvance, completeRequest, login, register, logout]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
