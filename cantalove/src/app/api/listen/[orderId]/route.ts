import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { authorizedOrder } from "@/lib/access";
import { failure, HttpError } from "@/lib/http";
// Full free listening with a session-checked streaming proxy. The browser never
// receives provider or storage URLs; recording the stream cannot be prevented.
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/listen/[orderId]">,
) {
  try {
    const { orderId } = await params;
    if (!(await authorizedOrder(orderId)))
      throw new HttpError(404, "Verifica tu correo para escuchar tu canción.");
    const version = new URL(request.url).searchParams.get("version") ?? "0";
    if (!/^[01]$/.test(version)) throw new HttpError(400, "Versión inválida.");
    const db = supabaseAdmin();
    const { data: song } = await db
      .from("songs")
      .select("status,track_paths")
      .eq("order_id", orderId)
      .single();
    const path = song?.track_paths[Number(version)];
    if (song?.status !== "ready" || path !== `${orderId}/${version}.mp3`)
      throw new HttpError(404, "La canción todavía no está lista.");
    const { data: signed, error } = await db.storage
      .from("tracks")
      .createSignedUrl(path, 30);
    if (error || !signed) throw new Error("Stream unavailable");
    const range = request.headers.get("range");
    if (range && !/^bytes=\d+-\d*$/.test(range))
      throw new HttpError(416, "Rango inválido.");
    const upstream = await fetch(signed.signedUrl, {
      headers: range ? { Range: range } : {},
      signal: AbortSignal.timeout(25000),
      cache: "no-store",
      redirect: "error",
    });
    if (![200, 206].includes(upstream.status))
      throw new Error("Audio unavailable");
    const headers = new Headers({
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, no-store",
      "Content-Disposition": "inline",
      "Accept-Ranges": "bytes",
    });
    for (const name of ["content-range", "content-length"]) {
      const v = upstream.headers.get(name);
      if (v) headers.set(name, v);
    }
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (e) {
    return failure(e);
  }
}
