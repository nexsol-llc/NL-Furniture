// Client-side image optimizer — converts images to WebP via canvas.
// Same approach as the skinchoice optimizer: max 1200px, quality 0.82,
// keep the original when conversion isn't possible or doesn't save space.

export const OPTIMIZER_MAX_WIDTH = 1200;
export const OPTIMIZER_MAX_HEIGHT = 1200;
export const OPTIMIZER_QUALITY = 0.82;

/** Types we never convert: animated / vector formats lose their point on canvas. */
const SKIP_TYPES = ["image/gif", "image/svg+xml", "image/webp", "image/avif"];

export function isConvertible(type: string): boolean {
  return type.startsWith("image/") && !SKIP_TYPES.includes(type);
}

/** Draws the blob on a canvas (downscaled to fit 1200×1200) and encodes WebP. */
export function compressToWebP(blob: Blob): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > OPTIMIZER_MAX_WIDTH || height > OPTIMIZER_MAX_HEIGHT) {
        const ratio = Math.min(OPTIMIZER_MAX_WIDTH / width, OPTIMIZER_MAX_HEIGHT / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(blob); return; }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (out) => {
          // Some browsers (e.g. Safari) can't encode WebP and return PNG or null
          if (out && out.type === "image/webp") resolve(out);
          else resolve(blob);
        },
        "image/webp",
        OPTIMIZER_QUALITY
      );
    };

    img.onerror = () => { URL.revokeObjectURL(url); resolve(blob); };
    img.src = url;
  });
}

/**
 * Converts an upload File to WebP. Returns the original file when the type
 * is skipped, encoding failed, or the WebP isn't at least 10% smaller.
 */
export async function convertFileToWebP(file: File): Promise<File> {
  if (!isConvertible(file.type)) return file;

  const compressed = await compressToWebP(file);
  if (compressed === file || compressed.type !== "image/webp") return file;
  if (compressed.size >= file.size * 0.9) return file;

  const webpName = file.name.replace(/\.[^.]+$/, "") + ".webp";
  return new File([compressed], webpName, { type: "image/webp" });
}
