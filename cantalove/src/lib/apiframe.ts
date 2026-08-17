import "server-only";

// Apiframe (https://docs.apiframe.ai) proxies the Suno music-generation API.
// Generation is async: a submit call returns a task_id, and a /fetch call is
// polled until the task's status flips to "finished" (or "failed"). Field
// names below follow Apiframe's documented Suno endpoints as of this writing —
// re-check them against docs.apiframe.ai/suno if Apiframe changes their contract.

const API_BASE = process.env.APIFRAME_API_BASE || "https://api.apiframe.pro";
const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000; // Suno renders usually finish in 1-3 minutes

function apiKey() {
  const key = process.env.APIFRAME_API_KEY;
  if (!key) throw new Error("Missing APIFRAME_API_KEY environment variable");
  return key;
}

interface GenerateSongInput {
  lyrics: string;
  genre: string;
  voice: string;
  duration: string;
  title: string;
}

export interface SunoClip {
  id: string;
  audioUrl: string;
}

interface SubmitResponse {
  task_id: string;
}

interface FetchResponse {
  task_id: string;
  status: "pending" | "processing" | "finished" | "failed";
  error?: string;
  clips?: Array<{ id: string; audio_url?: string; audio?: string }>;
}

function buildStylePrompt({ genre, voice, duration }: GenerateSongInput) {
  return `${genre} romántico en español, voz ${voice}, tempo ${duration}, instrumentación auténtica latina, emocionalmente poderoso, producción profesional, sin intro hablada`;
}

async function submitGeneration(input: GenerateSongInput): Promise<string> {
  const res = await fetch(`${API_BASE}/suno/custom-generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey(),
    },
    body: JSON.stringify({
      custom_mode: true,
      prompt: input.lyrics,
      tags: buildStylePrompt(input),
      title: input.title,
      make_instrumental: false,
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Apiframe submit failed: ${res.status} ${await res.text()}`
    );
  }

  const data = (await res.json()) as SubmitResponse;
  if (!data.task_id) {
    throw new Error("Apiframe submit response missing task_id");
  }
  return data.task_id;
}

async function fetchTask(taskId: string): Promise<FetchResponse> {
  const res = await fetch(`${API_BASE}/fetch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey(),
    },
    body: JSON.stringify({ task_id: taskId }),
  });

  if (!res.ok) {
    throw new Error(
      `Apiframe fetch failed: ${res.status} ${await res.text()}`
    );
  }

  return (await res.json()) as FetchResponse;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Submits a Suno generation job and polls until it completes, returning the
// generated clip. Throws if the job fails or exceeds POLL_TIMEOUT_MS.
export async function generateSunoTrack(
  input: GenerateSongInput
): Promise<SunoClip> {
  const taskId = await submitGeneration(input);
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);
    const task = await fetchTask(taskId);

    if (task.status === "failed") {
      throw new Error(task.error || "La generación de la canción falló");
    }

    if (task.status === "finished") {
      const clip = task.clips?.[0];
      const audioUrl = clip?.audio_url || clip?.audio;
      if (!clip || !audioUrl) {
        throw new Error("Apiframe no devolvió un clip de audio");
      }
      return { id: clip.id, audioUrl };
    }
  }

  throw new Error("Tiempo de espera agotado generando la canción");
}
