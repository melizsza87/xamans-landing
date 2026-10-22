import { recordOrderEvent } from "@/lib/telemetry";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { fetchPrivateTrack, getJobStatus } from "@/lib/apiframe";
import { authorizedOrder } from "@/lib/access";

export const maxDuration = 60;

const HEADERS = { "Cache-Control": "private, no-store", "Retry-After": "5" };
function reply(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: HEADERS });
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/song-status/[jobId]">,
) {
  const { jobId } = await params;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      jobId,
    )
  ) {
    return reply({ error: "Trabajo no encontrado" }, 404);
  }
  try {
    const db = supabaseAdmin();
    const { data: song, error: readError } = await db
      .from("songs")
      .select("id, order_id, status, full_url, track_paths")
      .eq("apiframe_job_id", jobId)
      .single();
    if (readError || !song || !(await authorizedOrder(song.order_id))) {
      return reply({ error: "Trabajo no encontrado" }, 404);
    }
    const expectedPaths = [0, 1].map(
      (index) => `${song.order_id}/${index}.mp3`,
    );
    if (
      song.status === "ready" &&
      song.full_url === expectedPaths[0] &&
      song.track_paths?.length === 2 &&
      expectedPaths.every((path) => song.track_paths.includes(path))
    ) {
      return reply({ status: "ready" });
    }
    if (song.status === "failed")
      return reply({
        status: "failed",
        error:
          "No pudimos terminar tu canción. Conservamos tu pedido para revisarlo.",
      });

    // One poll/import per order at a time across processes and serverless
    // instances. The expiring lease recovers safely if a request is interrupted.
    const now = new Date().toISOString();
    const lease = new Date(Date.now() + 90_000).toISOString();
    const { data: locked, error: lockError } = await db
      .from("songs")
      .update({ processing_until: lease })
      .eq("id", song.id)
      .neq("status", "failed")
      .or(`processing_until.is.null,processing_until.lt.${now}`)
      .select("id")
      .maybeSingle();
    if (lockError)
      return reply(
        {
          error:
            "No pudimos consultar tu canción. Intenta de nuevo en unos segundos.",
        },
        503,
      );
    if (!locked) return reply({ status: "processing" });
    try {
      const job = await getJobStatus(jobId);
      if (job.status === "FAILED") {
        const { error } = await db
          .from("songs")
          .update({
            status: "failed",
            provider_credits:
              Number.isInteger(job.creditCost) && job.creditCost! >= 0
                ? job.creditCost
                : null,
          })
          .eq("id", song.id)
          .eq("processing_until", lease);
        if (error) throw new Error("Song update failed");
        await db
          .from("orders")
          .update({ status: "failed" })
          .eq("id", song.order_id)
          .in("status", ["pending", "generating"]);
        // Provider failure details can contain private prompt text; never expose.
        return reply({
          status: "failed",
          error:
            "No pudimos terminar tu canción. Conservamos tu pedido para revisarlo.",
        });
      }
      if (job.status !== "COMPLETED") return reply({ status: "processing" });
      const tracks = job.result?.tracks;
      if (
        !Array.isArray(tracks) ||
        tracks.length < 2 ||
        !tracks[0]?.audioUrl ||
        !tracks[1]?.audioUrl
      ) {
        throw new Error("Music versions are incomplete");
      }
      // Both versions must be imported successfully before offering Premium.
      // Raw CDN URLs stay exclusively on the server, never in page/API payloads.
      await Promise.all(
        expectedPaths.map(async (path, index) => {
          const bytes = await fetchPrivateTrack(tracks[index].audioUrl!);
          const { error } = await db.storage
            .from("tracks")
            .upload(path, bytes, {
              contentType: "audio/mpeg",
              cacheControl: "0",
              upsert: true,
            });
          if (error) throw new Error("Private music storage unavailable");
        }),
      );
      const { error: saveError } = await db
        .from("songs")
        .update({
          full_url: expectedPaths[0],
          track_paths: expectedPaths,
          preview_url: null,
          status: "ready",
          provider_credits:
            Number.isInteger(job.creditCost) && job.creditCost! >= 0
              ? job.creditCost
              : null,
        })
        .eq("id", song.id)
        .eq("processing_until", lease);
      if (saveError) throw new Error("Song update failed");
      const { error: orderError } = await db
        .from("orders")
        .update({ status: "preview" })
        .eq("id", song.order_id)
        .in("status", ["pending", "generating"]);
      if (orderError) throw new Error("Order update failed");
      await recordOrderEvent("generation_complete", song.order_id);
      return reply({ status: "ready" });
    } catch {
      // A failed status fetch or import is retryable. Never submit a new job
      // here: polling retries cannot create another provider charge.
      return reply(
        {
          error:
            "La canción sigue en proceso. Reintentaremos la consulta; no necesitas generar otra.",
        },
        502,
      );
    } finally {
      await db
        .from("songs")
        .update({ processing_until: null })
        .eq("id", song.id)
        .eq("processing_until", lease);
    }
  } catch {
    return reply(
      {
        error:
          "No pudimos consultar tu canción. Intenta de nuevo en unos segundos.",
      },
      503,
    );
  }
}
