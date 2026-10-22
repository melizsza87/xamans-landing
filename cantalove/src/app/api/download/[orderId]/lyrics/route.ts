import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { supabaseAdmin } from "@/lib/supabase-admin";

function winAnsi(text: string): string {
  // The bundled standard PDF fonts cannot encode emoji and arbitrary Unicode.
  return text.normalize("NFC").replace(/[^\x20-\x7E\u00A1-\u00FF]/g, "?");
}
function wrap(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = winAnsi(text).split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const rows: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? line + " " + word : word;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) rows.push(line);
    if (font.widthOfTextAtSize(word, fontSize) <= maxWidth) {
      line = word;
    } else {
      let part = "";
      for (const char of word) {
        if (font.widthOfTextAtSize(part + char, fontSize) > maxWidth && part) {
          rows.push(part);
          part = "";
        }
        part += char;
      }
      line = part;
    }
  }
  if (line) rows.push(line);
  return rows;
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/download/[orderId]/lyrics">
) {
  const { orderId } = await params;
  const supabase = supabaseAdmin();
  const { data: order } = await supabase.from("orders")
    .select("status, tier").eq("id", orderId).single();
  if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  if (!["paid", "delivered"].includes(order.status)) {
    return NextResponse.json({ error: "Pago pendiente" }, { status: 403 });
  }
  if (order.tier !== "premium") {
    return NextResponse.json({ error: "El PDF de letra requiere Premium" }, { status: 403 });
  }

  const [{ data: song }, { data: personalization }] = await Promise.all([
    supabase.from("songs").select("lyrics").eq("order_id", orderId).single(),
    supabase.from("personalizations").select("names").eq("order_id", orderId).single(),
  ]);
  if (!song?.lyrics) return NextResponse.json({ error: "Letra no disponible" }, { status: 404 });

  const pdf = await PDFDocument.create();
  const titleFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await pdf.embedFont(StandardFonts.Helvetica);
  const margin = 54;
  const maxWidth = 595 - margin * 2;
  let page: PDFPage = pdf.addPage([595, 842]);
  let y = 780;
  for (const line of wrap("Una canción para " + (personalization?.names || "ti"), titleFont, 19, maxWidth)) {
    page.drawText(line, { x: margin, y, size: 19, font: titleFont, color: rgb(.75,.13,.19) });
    y -= 27;
  }
  y -= 18;

  for (const paragraph of song.lyrics.split("\n")) {
    const rows = wrap(paragraph, bodyFont, 12, maxWidth);
    for (const line of rows) {
      if (y < margin) {
        page = pdf.addPage([595, 842]);
        y = 782;
      }
      if (line) page.drawText(line, { x: margin, y, size: 12, font: bodyFont, color: rgb(.15,.15,.18) });
      y -= 18;
    }
  }

  return new NextResponse(Buffer.from(await pdf.save()), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="cantalove-letra.pdf"',
      "Cache-Control": "private, no-store",
    },
  });
}