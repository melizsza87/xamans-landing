import "server-only";
import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getClient() {
  if (client) return client;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable");
  }

  client = new Anthropic({ apiKey });
  return client;
}

interface GenerateLyricsInput {
  occasion: string;
  names: string;
  story: string;
  genre: string;
}

const SYSTEM_PROMPT_TEMPLATE = ({
  occasion,
  names,
  story,
  genre,
}: GenerateLyricsInput) =>
  `Eres un compositor profesional de música latina. Genera una letra personalizada emocionalmente poderosa para una canción de ${genre} en español. La letra debe mencionar explícitamente los nombres '${names}', hacer referencia a su historia real '${story}', y estar estructurada en: [Verse 1], [Pre-Chorus], [Chorus], [Verse 2], [Bridge], [Outro]. El tono debe ser ${occasion} — emotivo, íntimo, memorable. Devuelve SOLO la letra con etiquetas de sección, sin explicaciones.`;

export async function generateLyrics(
  input: GenerateLyricsInput
): Promise<string> {
  const anthropic = getClient();

  const message = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
    max_tokens: 1024,
    system: SYSTEM_PROMPT_TEMPLATE(input),
    messages: [
      {
        role: "user",
        content:
          "Genera la letra ahora, siguiendo exactamente las instrucciones del system prompt.",
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude no devolvió texto en la respuesta");
  }

  return textBlock.text.trim();
}
