import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
// Standard fonts support Spanish (ñ/á/ü/¿/¡). Strip only glyphs outside
// WinAnsi rather than crashing on an emoji in a customer's story.
export async function lyricsPdf(names: string, lyrics: string) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const clean = (value: string) =>
    Array.from(value.normalize("NFC"))
      .map((c) => {
        try {
          font.encodeText(c);
          return c;
        } catch {
          return "";
        }
      })
      .join("");
  let page = doc.addPage([595, 842]),
    y = 780;
  function line(text: string, size = 12) {
    if (y < 58) {
      page = doc.addPage([595, 842]);
      y = 780;
    }
    page.drawText(text, { x: 56, y, size, font, color: rgb(0.22, 0.15, 0.15) });
    y -= size + 7;
  }
  function paragraph(text: string, size = 12) {
    let row = "";
    for (const word of clean(text).split(/\s+/)) {
      const candidate = row ? row + " " + word : word;
      if (font.widthOfTextAtSize(candidate, size) > 480) {
        if (row) line(row, size);
        row = "";
        for (const c of word) {
          if (font.widthOfTextAtSize(row + c, size) > 480) {
            line(row, size);
            row = "";
          }
          row += c;
        }
      } else row = candidate;
    }
    line(row, size);
  }
  paragraph(`Para ${names}`, 20);
  line("");
  for (const text of lyrics.split("\n")) paragraph(text);
  return doc.save();
}
