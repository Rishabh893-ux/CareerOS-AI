const pdfParseLib = require("pdf-parse");
const pdfParse = pdfParseLib.default || pdfParseLib; // handle both ESM default and CJS export
const { chatCompletion, VISION_MODEL } = require("./aiService");

// ── Helper: extract text from PDF buffer via pdf-parse ──
async function extractTextFromPdf(buffer) {
  try {
    const parsed = await pdfParse(buffer);
    if (parsed.text && parsed.text.trim().length > 50) {
      return parsed.text.trim();
    }
    throw new Error("PDF text too short");
  } catch (err) {
    console.warn("[PDF Parse] pdf-parse failed or empty");
    return null;
  }
}

// ── Shared pdfjs-dist loader ──
// pdfjs-dist's Node "fake worker" caches its handler on a process-wide global
// (globalThis.pdfjsWorker), not per module instance. If more than one
// pdfjs-dist version ever runs in this process, whichever loads its worker
// first "poisons" that global for every other version afterwards, causing a
// hard "API version does not match Worker version" crash. So this app must
// only ever load ONE pdfjs-dist instance - always through this function -
// rather than pulling in a second copy via another package (e.g. pdf-to-img).
let pdfjsLibPromise = null;
function getPdfjsLib() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import("pdfjs-dist/legacy/build/pdf.mjs").then((pdfjsLib) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = require("url").pathToFileURL(
        require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs")
      ).href;
      return pdfjsLib;
    });
  }
  return pdfjsLibPromise;
}

// ── Helper: extract text from PDF buffer via pdfjs-dist's own text layer API ──
// This is a text-only extraction that never touches Canvas/rendering, so it's
// far more robust than the rasterization path below - it recovers text from
// PDFs that trip up pdf-parse (unusual encodings, ligatures, certain embedded
// fonts) without needing the Canvas/clip-path machinery at all.
async function extractTextViaPdfJs(buffer) {
  try {
    const pdfjsLib = await getPdfjsLib();
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer), isEvalSupported: false }).promise;

    const pageTexts = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      pageTexts.push(content.items.map((item) => item.str).join(" "));
    }

    const text = pageTexts.join("\n\n").trim();
    return text.length > 50 ? text : null;
  } catch (err) {
    console.warn("[PDF Parse] pdfjs-dist text extraction failed:", err.message);
    return null;
  }
}

// ── Helper: extract text from a single image buffer via Groq Vision (qwen3.8-27b) ──
async function extractTextFromImageBuffer(buffer, mimeType) {
  const base64 = buffer.toString("base64");

  const text = await chatCompletion([{
    role: "user",
    content: [
      { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
      { type: "text", text: "Extract ALL text from this resume image exactly as it appears. Return only the raw text content, no commentary." },
    ],
  }], { model: VISION_MODEL });

  return text.trim();
}

// ── Helper: scanned/image-based PDF fallback ──
// Groq has no native PDF/document input (only image_url), so a PDF that has
// no real text layer gets rasterized page-by-page (via the same pdfjs-dist
// instance as above, paired with @napi-rs/canvas) and each page is OCR'd
// through Groq Vision instead.
const MAX_VISION_PAGES = 5;

async function extractTextFromScannedPdf(buffer) {
  const pdfjsLib = await getPdfjsLib();
  const { createCanvas } = require("@napi-rs/canvas");

  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer), isEvalSupported: false }).promise;
  const numPages = Math.min(doc.numPages, MAX_VISION_PAGES);

  const pageTexts = [];
  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = createCanvas(viewport.width, viewport.height);
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
    const pageText = await extractTextFromImageBuffer(canvas.toBuffer("image/png"), "image/png");
    pageTexts.push(pageText);
  }
  return pageTexts.join("\n\n");
}

// ── Helper: extract text from an uploaded resume file (PDF or image) ──
// PDFs try pdf-parse, then pdfjs-dist's own text layer as a second attempt
// (recovers text pdf-parse chokes on, still no rendering involved), and only
// fall back to rasterizing pages + Groq Vision if there's truly no text layer
// (a scanned/image-only PDF). Images always go straight through Groq Vision.
async function extractResumeFileText(file) {
  const isPdf = file.mimetype === "application/pdf";
  const isImage = file.mimetype.startsWith("image/");

  if (isPdf) {
    const text = await extractTextFromPdf(file.buffer);
    if (text) return text;

    const pdfjsText = await extractTextViaPdfJs(file.buffer);
    if (pdfjsText) return pdfjsText;

    console.log("[Resume] Falling back to Groq Vision (page rasterization) for scanned PDF");
    return extractTextFromScannedPdf(file.buffer);
  }
  if (isImage) {
    return extractTextFromImageBuffer(file.buffer, file.mimetype);
  }
  return "";
}

module.exports = { extractResumeFileText };
