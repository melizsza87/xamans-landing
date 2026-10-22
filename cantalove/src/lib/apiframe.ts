import "server-only";

// Contract checked against docs-v2.apiframe.ai/docs/music/suno and /jobs/get.
// A submit is intentionally NEVER retried automatically: a timeout can mean
// the provider accepted it, and a retry could charge for a second generation.
const API_BASE = "https://api.apiframe.ai";
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const JOB_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MODELS = ["V4", "V4_5", "V4_5ALL", "V4_5PLUS", "V5", "V5_5"];

function authHeaders() {
  const key = process.env.APIFRAME_API_KEY;
  if (!key) throw new Error("Music service is not configured");
  // Never send the API key to a configurable third-party origin.
  if (
    process.env.APIFRAME_API_BASE &&
    process.env.APIFRAME_API_BASE !== API_BASE
  ) {
    throw new Error("Music API origin is not allowed");
  }
  return { "Content-Type": "application/json", "X-API-Key": key };
}

interface GenerateSongInput {
  lyrics: string;
  genre: string;
  voice: string;
  duration: string;
  title: string;
  brand?: "love" | "heartbreak";
  instrumental?: boolean;
}

export type ApiframeJobStatus =
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";
export interface ApiframeTrack {
  audioUrl?: string;
}
export interface ApiframeJob {
  id: string;
  status: ApiframeJobStatus;
  creditCost?: number;
  result?: { tracks?: ApiframeTrack[] } | null;
}

export function buildSunoPayload(input: GenerateSongInput) {
  if (!input.lyrics.trim() || input.lyrics.length > 5000) {
    throw new Error("Lyrics exceed music provider limits");
  }
  const model = process.env.APIFRAME_MODEL_VERSION || "V4_5PLUS";
  if (!MODELS.includes(model))
    throw new Error("Music model is not configured correctly");
  const vocalGender =
    input.voice === "Masculina"
      ? "m"
      : input.voice === "Femenina"
        ? "f"
        : undefined;
  const mood =
    input.brand === "heartbreak"
      ? "despecho, catarsis y dignidad; contundente y sin amenazas"
      : "romántico, cálido, íntimo y emotivo";
  return {
    prompt: input.lyrics,
    model: "suno",
    sunoParams: {
      custom_mode: true,
      title: input.title.slice(0, 80),
      // Duration is an artistic request: Suno has no exact-duration parameter.
      style:
        `${input.genre} en español de México; ${mood}; voz ${input.voice}; duración deseada ${input.duration}; instrumentación latina auténtica; sin intro hablada`.slice(
          0,
          1000,
        ),
      ...(vocalGender ? { vocal_gender: vocalGender } : {}),
      model_version: model,
      instrumental: input.instrumental === true,
    },
  };
}

export async function submitSunoGeneration(
  input: GenerateSongInput,
): Promise<string> {
  const res = await fetch(`${API_BASE}/v2/music/generate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(buildSunoPayload(input)),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    cache: "no-store",
    redirect: "error",
  });
  if (!res.ok) throw new Error(`Music submission failed (${res.status})`);
  const data = await res.json();
  if (typeof data.jobId !== "string" || !JOB_ID.test(data.jobId)) {
    throw new Error("Music submission returned an invalid job");
  }
  return data.jobId;
}

export async function getJobStatus(jobId: string): Promise<ApiframeJob> {
  if (!JOB_ID.test(jobId)) throw new Error("Invalid music job");
  const res = await fetch(`${API_BASE}/v2/jobs/${encodeURIComponent(jobId)}`, {
    headers: authHeaders(),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    cache: "no-store",
    redirect: "error",
  });
  if (!res.ok) throw new Error(`Music status unavailable (${res.status})`);
  const data = await res.json();
  if (
    data.id !== jobId ||
    !["QUEUED", "PROCESSING", "COMPLETED", "FAILED"].includes(data.status)
  ) {
    throw new Error("Music service returned an invalid job status");
  }
  return data as ApiframeJob;
}

export function isAllowedAudioUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    // Exact documented CDN only. Do not allow arbitrary subdomains, credentials,
    // ports, IP addresses or redirects (including redirect-to-private-network).
    return (
      url.protocol === "https:" &&
      url.hostname === "cdn2.apiframe.ai" &&
      !url.port &&
      !url.username &&
      !url.password &&
      /^\/audio\/[a-zA-Z0-9_-]+\.mp3$/.test(url.pathname)
    );
  } catch {
    return false;
  }
}

export async function fetchPrivateTrack(raw: string): Promise<Uint8Array> {
  if (!isAllowedAudioUrl(raw))
    throw new Error("Music asset origin is not allowed");
  const res = await fetch(raw, {
    redirect: "error",
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  if (!res.ok || !res.body) throw new Error("Music asset is unavailable");
  const declaredLength = Number(res.headers.get("content-length") || "0");
  const type = (res.headers.get("content-type") || "").split(";")[0].trim();
  if (
    !["audio/mpeg", "audio/mp3", "application/octet-stream"].includes(type) ||
    declaredLength > MAX_AUDIO_BYTES
  ) {
    await res.body.cancel();
    throw new Error("Music asset format is invalid");
  }
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_AUDIO_BYTES)
        throw new Error("Music asset exceeds size limit");
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
  if (total < 4) throw new Error("Music asset is empty");
  const audio = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    audio.set(chunk, offset);
    offset += chunk.byteLength;
  }
  // MP3s start with ID3 metadata or an MPEG frame sync, never HTML/JSON.
  const id3 = audio[0] === 0x49 && audio[1] === 0x44 && audio[2] === 0x33;
  const frame = audio[0] === 0xff && (audio[1] & 0xe0) === 0xe0;
  if (!id3 && !frame) throw new Error("Music asset is not an MP3");
  return audio;
}
