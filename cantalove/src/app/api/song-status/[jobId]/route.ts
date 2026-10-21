import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getJobStatus } from "@/lib/apiframe";

// Single, fast poll against Apiframe — no waiting/looping here, so this
// route always finishes in well under a second. The client polls this
// endpoint on an interval instead.
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/song-status/[jobId]">
) {
  const { jobId } = await params;
  const supabase = supabaseAdmin();

  const { data: song, error: songError } = await supabase
    .from("songs")
    .select("id, order_id, status, preview_url, alternate_url")
    .eq("apiframe_job_id", jobId)
    .single();

  if (songError || !song) {
    return NextResponse.json({ error: "Trabajo no encontrado" }, { status: 404 });
  }

  // Already resolved in a previous poll — avoid hitting Apiframe again.
  if (song.status === "ready" && song.preview_url) {
    return NextResponse.json({ status: "ready", audioUrl: song.preview_url, audioUrl2: song.alternate_url });
  }
  if (song.status === "failed") {
    return NextResponse.json({ status: "failed" });
  }

  let job;
  try {
    job = await getJobStatus(jobId);
  } catch (err) {
    console.error("Error consultando el job de Apiframe:", err);
    return NextResponse.json(
      { error: "No se pudo consultar el estado de la canción" },
      { status: 502 }
    );
  }

  if (job.status === "failed") {
    await supabase.from("songs").update({ status: "failed" }).eq("id", song.id);
    await supabase
      .from("orders")
      .update({ status: "failed" })
      .eq("id", song.order_id);
    return NextResponse.json({ status: "failed", error: job.error });
  }

  if (job.status !== "finished") {
    return NextResponse.json({ status: "processing" });
  }

  const tracks = job.result?.tracks || [];
  const audioUrl = tracks[0]?.audioUrl;
  const audioUrl2 = tracks[1]?.audioUrl;

  if (!audioUrl) {
    return NextResponse.json(
      { error: "Apiframe no devolvió un track de audio" },
      { status: 502 }
    );
  }

  await supabase
    .from("songs")
    .update({ preview_url: audioUrl, alternate_url: audioUrl2 || null, status: "ready" })
    .eq("id", song.id);

  await supabase
    .from("orders")
    .update({ status: "preview" })
    .eq("id", song.order_id);

  return NextResponse.json({ status: "ready", audioUrl, audioUrl2 });
}
