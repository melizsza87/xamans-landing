import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/download/[orderId]/lyrics">
) {
  const { orderId } = await params;
  const supabase = supabaseAdmin();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status, tier")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  if (order.status !== "paid" && order.status !== "delivered") {
    return NextResponse.json(
      { error: "El pago de esta orden aún no está confirmado" },
      { status: 403 }
    );
  }

  if (order.tier !== "premium" && order.tier !== "vip") {
    return NextResponse.json(
      { error: "El PDF de letra sólo está disponible en los tiers Premium y VIP" },
      { status: 403 }
    );
  }

  const [{ data: song }, { data: personalization }] = await Promise.all([
    supabase.from("songs").select("lyrics").eq("order_id", orderId).single(),
    supabase
      .from("personalizations")
      .select("names, occasion")
      .eq("order_id", orderId)
      .single(),
  ]);

  if (!song?.lyrics) {
    return NextResponse.json({ error: "Letra no disponible" }, { status: 404 });
  }

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 56;
  let y = 780;

  const title = personalization
    ? `Para ${(personalization as { names?: string }).names ?? ""}`
    : "cantalove";
  page.drawText(title, {
    x: margin,
    y,
    size: 20,
    font,
    color: rgb(0.86, 0.15, 0.15),
  });
  y -= 32;

  const lines = (song.lyrics as string).split("\n");
  for (const line of lines) {
    if (y < margin) {
      const newPage = pdfDoc.addPage([595, 842]);
      y = 780;
      newPage.drawText(line, { x: margin, y, size: 12, font: bodyFont });
      y -= 18;
      continue;
    }
    page.drawText(line.slice(0, 95), {
      x: margin,
      y,
      size: 12,
      font: bodyFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 18;
  }

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="cantalove-letra-${orderId}.pdf"`,
    },
  });
}
