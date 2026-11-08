// Lecture slides uploaded as PDF (saved from PowerPoint) are shown exactly as designed.
// pdf.js is loaded on demand from the jsDelivr CDN (allowed in the site's CSP).
const PDFJS_VERSION = "6.2.108";

function pdfjsBase() {
  if (typeof window !== "undefined" && window.__PDFJS_BASE__) return window.__PDFJS_BASE__;
  return `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/`;
}

let libPromise = null;
export function loadPdfjs() {
  if (!libPromise) {
    const base = pdfjsBase();
    libPromise = import(/* @vite-ignore */ `${base}build/pdf.min.mjs`)
      .then((lib) => {
        lib.GlobalWorkerOptions.workerSrc = `${base}build/pdf.worker.min.mjs`;
        return lib;
      })
      .catch((e) => {
        libPromise = null;
        throw e;
      });
  }
  return libPromise;
}

export async function openPdf(data) {
  const lib = await loadPdfjs();
  const base = pdfjsBase();
  return lib.getDocument({
    data,
    cMapUrl: `${base}cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${base}standard_fonts/`,
    wasmUrl: `${base}wasm/`,
    iccUrl: `${base}iccs/`,
  }).promise;
}

export function closePdf(doc) {
  try {
    if (doc && doc.loadingTask && typeof doc.loadingTask.destroy === "function") doc.loadingTask.destroy();
    else if (doc && typeof doc.destroy === "function") doc.destroy();
  } catch (e) {
    /* ignore */
  }
}

// Text of one page grouped into lines (top to bottom).
async function pageLines(page) {
  const content = await page.getTextContent();
  const lines = [];
  let current = "";
  let lastY = null;
  for (const item of content.items) {
    if (typeof item.str !== "string") continue;
    const y = item.transform ? Math.round(item.transform[5]) : lastY;
    if (lastY !== null && y !== null && Math.abs(y - lastY) > 2 && current.trim()) {
      lines.push(current.trim());
      current = "";
    }
    current += item.str;
    if (item.hasEOL) {
      if (current.trim()) lines.push(current.trim());
      current = "";
    }
    lastY = y;
  }
  if (current.trim()) lines.push(current.trim());
  return lines.map((l) => l.replace(/\s+/g, " ")).filter(Boolean);
}

export function narrationFromLines(lines) {
  return lines
    .map((p) => p.replace(/[.،؛:]+$/, ""))
    .join(". ")
    .concat(lines.length ? "." : "");
}

// Reads a PDF file chosen by the lecturer: page count + the text of every page
// (used for the AI voice and for generating the post-test questions).
export async function extractPdfSlides(file) {
  if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") {
    throw new Error("الرجاء اختيار ملف بصيغة PDF (من PowerPoint: ملف ← حفظ باسم ← PDF).");
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("حجم ملف PDF أكبر من 20 ميجابايت. قلّل جودة الصور عند الحفظ من PowerPoint ثم أعد المحاولة.");
  }
  let doc;
  try {
    doc = await openPdf(new Uint8Array(await file.arrayBuffer()));
  } catch (e) {
    throw new Error("تعذّرت قراءة ملف PDF. تأكد أن الملف سليم وغير محمي بكلمة مرور.");
  }
  const slides = [];
  for (let i = 1; i <= Math.min(doc.numPages, 200); i++) {
    const page = await doc.getPage(i);
    const lines = await pageLines(page);
    const title = lines[0] || "";
    const bullets = lines.slice(1, 41);
    slides.push({ title, bullets, narration: narrationFromLines(lines).slice(0, 4000) });
  }
  closePdf(doc);
  if (!slides.length) throw new Error("ملف PDF لا يحتوي صفحات.");
  return slides;
}
