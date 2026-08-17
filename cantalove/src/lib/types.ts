export type OrderStatus =
  | "pending"
  | "generating"
  | "preview"
  | "paid"
  | "delivered"
  | "failed";

export type Tier = "basic" | "premium" | "vip";

export type Occasion =
  | "San Valentín"
  | "Día de las Madres"
  | "Boda/Vals"
  | "XV Años"
  | "Aniversario"
  | "Cumpleaños"
  | "Navidad"
  | "Otro";

export type Genre =
  | "Bolero"
  | "Balada pop"
  | "Ranchera"
  | "Cumbia"
  | "Norteño"
  | "Banda"
  | "Mariachi"
  | "Vals clásico";

export type Voice = "Femenina" | "Masculina" | "Dueto";

export type Duration = "1:30 min" | "2:00 min" | "2:30 min";

export interface Order {
  id: string;
  created_at: string;
  status: OrderStatus;
  tier: Tier | null;
  amount: number | null;
  mp_payment_id: string | null;
  mp_preference_id: string | null;
  contact_email: string | null;
}

export interface Personalization {
  id: string;
  order_id: string;
  occasion: string;
  names: string;
  story: string;
  genre: string;
  voice: string;
  duration: string;
}

export type SongStatus = "generating" | "ready" | "failed";

export interface Song {
  id: string;
  order_id: string;
  lyrics: string | null;
  preview_url: string | null;
  full_url: string | null;
  status: SongStatus;
}
