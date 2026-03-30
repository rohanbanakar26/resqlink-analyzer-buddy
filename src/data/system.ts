export interface RoleOption {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
}

export const ROLE_OPTIONS: RoleOption[] = [
  {
    id: "citizen",
    label: "I need help",
    shortLabel: "Citizen",
    description: "Report emergencies, see nearby responders, and track help live.",
  },
  {
    id: "volunteer",
    label: "I want to help",
    shortLabel: "Volunteer",
    description: "Receive nearby tasks, go available instantly, and complete missions fast.",
  },
  {
    id: "ngo",
    label: "I represent an NGO",
    shortLabel: "NGO",
    description: "Coordinate incoming requests, volunteers, and area-level allocation.",
  },
];

export interface CategoryMeta {
  id: string;
  label: string;
  emoji: string;
  summary: string;
}

export const REQUEST_CATEGORIES: CategoryMeta[] = [
  { id: "general", label: "General Emergency", emoji: "🚨", summary: "Fast dispatch when the exact category can be refined after sending" },
  { id: "food", label: "Food", emoji: "🍲", summary: "Food shortage, hunger support, community kitchens" },
  { id: "disaster", label: "Disaster", emoji: "🌊", summary: "Flood, fire, collapse, urgent relief coordination" },
  { id: "medical", label: "Medical", emoji: "🩺", summary: "Urgent care, medicines, first-aid support" },
  { id: "shelter", label: "Shelter", emoji: "🏠", summary: "Safe space, beds, temporary protection" },
  { id: "senior", label: "Senior care", emoji: "🫶", summary: "Daily help, medicine pickup, mobility support" },
  { id: "education", label: "Education", emoji: "📚", summary: "Tutoring, school access, learning support" },
  { id: "sanitation", label: "Sanitation", emoji: "🧹", summary: "Waste cleanup, hygiene, public sanitation needs" },
];

export interface UrgencyOption {
  id: string;
  label: string;
  color: string;
}

export const URGENCY_OPTIONS: UrgencyOption[] = [
  { id: "low", label: "Low", color: "hsl(var(--success))" },
  { id: "medium", label: "Medium", color: "hsl(var(--warning))" },
  { id: "high", label: "High", color: "hsl(var(--accent))" },
  { id: "critical", label: "Critical", color: "hsl(var(--emergency))" },
];

export const REQUEST_STATUSES = [
  "Requested",
  "Pending sync",
  "Accepted",
  "Volunteer assigned",
  "In progress",
  "Completed",
];

export const STATUS_COPY: Record<string, string> = {
  Requested: "Request received",
  "Pending sync": "Waiting for network",
  Accepted: "NGO accepted",
  "Volunteer assigned": "Volunteer matched",
  "In progress": "Help on the way",
  Completed: "Resolved",
};

export function getCategoryMeta(category: string): CategoryMeta {
  return REQUEST_CATEGORIES.find((c) => c.id === category) ?? REQUEST_CATEGORIES[0];
}
