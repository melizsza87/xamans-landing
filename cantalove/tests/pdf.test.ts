import test from "node:test";
import assert from "node:assert/strict";
import {
  PDFDocument,
  PDFRawStream,
  PDFArray,
  decodePDFRawStream,
} from "pdf-lib";
import { lyricsPdf } from "../src/lib/lyrics-pdf";

test("Spanish PDF wraps long lines and writes all continued pages without truncation", async () => {
  const lyrics =
    Array.from(
      { length: 150 },
      (_, i) =>
        `Línea ${i + 1}: ¡Qué alegría, corazón! José, María, canción, pingüino, año. ${"amor ".repeat(24)}`,
    ).join("\n") + "\nÚLTIMA LÍNEA CONSERVADA";
  const bytes = await lyricsPdf("José y María 💕", lyrics);
  const pdf = await PDFDocument.load(bytes);
  assert.ok(pdf.getPageCount() > 3, "long lyrics must span pages");
  let decoded = "";
  for (const page of pdf.getPages()) {
    const contents = page.node.Contents();
    assert.ok(contents instanceof PDFArray);
    let pageText = "";
    for (let i = 0; i < contents.size(); i++) {
      const stream = pdf.context.lookup(contents.get(i));
      assert.ok(stream instanceof PDFRawStream);
      pageText += Buffer.from(decodePDFRawStream(stream).decode()).toString(
        "latin1",
      );
    }
    assert.match(
      pageText,
      /Tj/,
      "each page must contain text, including continuation pages",
    );
    decoded += pageText;
  }
  const text = Array.from(decoded.matchAll(/<([A-Fa-f0-9]+)>\s*Tj/g))
    .map((m) => Buffer.from(m[1], "hex").toString("latin1"))
    .join("\n");
  assert.match(text, /José y María/);
  assert.match(text, /pingüino/);
  assert.match(text, /¡Qué alegría, corazón!/);
  assert.match(text, /ÚLTIMA LÍNEA CONSERVADA/);
});
