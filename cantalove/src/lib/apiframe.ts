import "server-only";

// Apiframe (https://docs.apiframe.ai) proxies the Suno music-generation API.
// Generation is async: POST /v2/music/generate returns a jobId immediately,
// and GET /v2/jobs/:id is polled until the job's status is "finished" (or
// "failed"). Every Suno-specific field (custom_mode, title, style,
// vocal_gender, model_version, instrumental) must live inside sunoParams —
// the top level only accepts prompt, model, webhookUrl, and webhookEvents.

const API_BASE = process.env.APIFRAME_API_BASE || "https://api.apiframe.ai";

function apiKey() {
  const key = process.env.APIFRAME_API_KEY;
  if (!key) throw new Error("Missing APIFRAME_API_KEY environment variable");
  return key;
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "X-API-Key": apiKey(),
  };
}

interface GenerateSongInput {
  lyrics: string;
  genre: string;
  voice: string;
  duration: string;
  title: string;
}

export type ApiframeJobStatus = "pending" | "processing" | "finished" | "failed";

interface SubmitResponse {
  jobId: string;
}

export interface ApiframeTrack {
  audioUrl?: string;
}

export interface ApiframeJob {
  jobId: string;
  status: ApiframeJobStatus;
  error?: string;
  result?: {
    tracks?: ApiframeTrack[];
  };
}

function buildStylePrompt({ genre, voice, duration }: GenerateSongInput) {
  return `${genre} en español, voz ${voice}, duración aproximada ${duration}, instrumentación auténtica latina, producción profesional, sin intro hablada, respetando el tono de la letra`;
}

// Apiframe's sunoParams.vocal_gender expects "female" | "male" | "duet" —
// re-check against docs.apiframe.ai if this mapping changes.
function mapVocalGender(voice: string): string {
  const normalized = voice.trim().toLowerCase();
  if (normalized === "masculina") return "male";
  if (normalized === "dueto") return "duet";
  return "female";
}

// Submits a Suno generation job. Returns immediately with a jobId — the
// actual audio is produced asynchronously and must be polled for via
// getJobStatus (see /api/song-status/[jobId]).
export async function submitSunoGeneration(
  input: GenerateSongInput
): Promise<string> {
  const res = await fetch(`${API_BASE}/v2/music/generate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      prompt: input.lyrics,
      model: "suno",
      sunoParams: {
        custom_mode: true,
        title: input.title,
        style: buildStylePrompt(input),
        vocal_gender: mapVocalGender(input.voice),
        model_version: process.env.APIFRAME_MODEL_VERSION || "v4_5plus",
        instrumental: false,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Apiframe submit failed: ${res.status} ${await res.text()}`
    );
  }

  const data = (await res.json()) as SubmitResponse;
  if (!data.jobId) {
    throw new Error("Apiframe submit response missing jobId");
  }
  return data.jobId;
}

// Fetches the current status of a previously submitted job. When
// status === "finished", result.tracks[0].audioUrl / tracks[1].audioUrl
// hold the two generated versions.
export async function getJobStatus(jobId: string): Promise<ApiframeJob> {
  const res = await fetch(`${API_BASE}/v2/jobs/${jobId}`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error(
      `Apiframe job fetch failed: ${res.status} ${await res.text()}`
    );
  }

  return (await res.json()) as ApiframeJob;
}
