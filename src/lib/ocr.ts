import { createWorker } from 'tesseract.js'

// Offline OCR baseline (Hr 7–13 of the build plan) — Tesseract.js runs
// client-side via WASM, no server or API key needed. Swap for Google Cloud
// Vision later if accuracy on messy photos becomes the bottleneck.

export async function extractText(
  image: File | Blob,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100))
      }
    },
  })
  try {
    const { data } = await worker.recognize(image)
    return data.text.trim()
  } finally {
    await worker.terminate()
  }
}
