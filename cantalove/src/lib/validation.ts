export const OCCASIONS = [
  "Aniversario",
  "Boda",
  "Mamá o papá",
  "Cumpleaños",
  "Amistad",
  "Otra ocasión",
  "Despecho",
  "San Valentín",
  "Día de las Madres",
  "Boda/Vals",
  "XV Años",
  "Navidad",
  "Otro",
];
export const GENRES = [
  "Balada pop",
  "Bolero",
  "Mariachi",
  "Regional mexicano",
  "Cumbia",
  "Pop latino",
  "Rock en español",
  "Ranchera",
  "Corrido tumbado",
  "Norteño",
  "Banda",
  "Vals clásico",
];
export const EMOTIONS = [
  "Emoción y ternura",
  "Alegría y celebración",
  "Nostalgia bonita",
  "Humor y picardía",
  "Despecho y liberación",
];
export const VOICES = ["Femenina", "Masculina", "Dueto"];
export const DURATIONS = ["1:30 min", "2:00 min", "2:30 min"];
export const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? email
    : null;
}
export interface Brief {
  occasion: string;
  names: string;
  story: string;
  genre: string;
  voice: string;
  duration: string;
  brand: "love" | "heartbreak";
  email: string;
  requestId: string;
  consent: true;
  vibe?: string;
}
export function validateBrief(value: unknown): Brief | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (
    ["occasion", "genre", "voice", "duration"].some(
      (key) => typeof v[key] !== "string",
    )
  )
    return null;
  if (
    !OCCASIONS.includes(String(v.occasion)) ||
    !GENRES.includes(String(v.genre)) ||
    !VOICES.includes(String(v.voice)) ||
    !DURATIONS.includes(String(v.duration))
  )
    return null;
  if (
    v.vibe !== undefined &&
    (typeof v.vibe !== "string" || !EMOTIONS.includes(v.vibe))
  )
    return null;
  if (v.brand !== "love" && v.brand !== "heartbreak") return null;
  if (
    typeof v.names !== "string" ||
    v.names.trim().length < 1 ||
    v.names.length > 90 ||
    typeof v.story !== "string" ||
    v.story.trim().length < 10 ||
    v.story.length > 1800
  )
    return null;
  if (
    !normalizeEmail(v.email) ||
    typeof v.requestId !== "string" ||
    !UUID.test(v.requestId) ||
    v.consent !== true
  )
    return null;
  return {
    ...v,
    email: normalizeEmail(v.email)!,
    names: v.names.trim(),
    story: v.story.trim(),
  } as Brief;
}
