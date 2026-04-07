export interface Doctor {
  id: string;
  google_place_id: string;
  name: string;
  specialty: string[];
  address: string;
  city: string;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviews_count: number | null;
  languages: string[];
  photo_url: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  doctor_id: string;
  user_id: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled";
  notes: string | null;
  created_at: string;
  doctor?: Doctor;
}

export interface AIRecommendation {
  id: string;
  user_id: string | null;
  query: string;
  city: string;
  result: RecommendationResult;
  created_at: string;
}

export interface RecommendationResult {
  summary: string;
  ranked_doctors: RankedDoctor[];
  best_match: string;
}

export interface RankedDoctor {
  doctor_id: string;
  name: string;
  rank: number;
  score: number;
  reasons: string[];
  concerns: string[];
}

export interface SearchParams {
  city: string;
  specialty: string;
  language?: string;
}

export type Specialty =
  | "General Practitioner"
  | "Dentist"
  | "Cardiologist"
  | "Dermatologist"
  | "Orthopedist"
  | "Pediatrician"
  | "Gynecologist"
  | "Ophthalmologist"
  | "ENT Specialist"
  | "Neurologist"
  | "Psychiatrist"
  | "Urologist"
  | "Emergency Medicine";

export const SPECIALTIES: Specialty[] = [
  "General Practitioner",
  "Dentist",
  "Cardiologist",
  "Dermatologist",
  "Orthopedist",
  "Pediatrician",
  "Gynecologist",
  "Ophthalmologist",
  "ENT Specialist",
  "Neurologist",
  "Psychiatrist",
  "Urologist",
  "Emergency Medicine",
];

export const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "Arabic",
  "Chinese (Mandarin)",
  "German",
  "Portuguese",
  "Russian",
  "Japanese",
  "Hindi",
  "Turkish",
  "Italian",
];
