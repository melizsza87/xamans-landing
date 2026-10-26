import { recordEvent } from "@/lib/telemetry";
import { NextResponse } from "next/server";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function failure(error: unknown) {
  void recordEvent("error");
  if (error instanceof HttpError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  // Never log provider response bodies, stories, addresses, tokens or secrets.
  console.error("cantalove_request_failed", {
    type: error instanceof Error ? error.name : "unknown",
  });
  return NextResponse.json(
    {
      error:
        "El servicio no está disponible en este momento. Tu pedido no se cobrará de nuevo.",
    },
    { status: 503 },
  );
}
export async function jsonBody(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new HttpError(415, "Envía datos JSON.");
  const origin = request.headers.get("origin");
  const allowed = new Set([new URL(request.url).origin]);
  if (process.env.NODE_ENV !== "production" && request.headers.get("host"))
    allowed.add(`http://${request.headers.get("host")}`);
  if (!origin || !allowed.has(origin))
    throw new HttpError(403, "Solicitud no autorizada.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Faltan datos.");
  let length = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 12000) {
      await reader.cancel();
      throw new HttpError(413, "La historia es demasiado larga.");
    }
    chunks.push(value);
  }
  try {
    const value: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error("Invalid object");
    return value;
  } catch {
    throw new HttpError(400, "Datos inválidos.");
  }
}
export function requireKeys(...keys: string[]) {
  if (keys.some((k) => !process.env[k]))
    throw new HttpError(
      503,
      "El servicio está pendiente de configuración. Inténtalo más tarde.",
    );
}
