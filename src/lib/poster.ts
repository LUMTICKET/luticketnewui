import { getApiBaseUrl } from "@/lib/auth";

export const POSTER_ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_SOURCE_BYTES = 10 * 1024 * 1024; // what we accept from the device
const MAX_EDGE = 1400; // px, longest side after resizing
const TARGET_BYTES = 1_200_000; // API limit is 1.5 MB

/** Turn the API's poster value (relative `/api/...` path or absolute URL) into an <img src>. */
export function posterSrc(image: unknown): string | null {
  if (typeof image !== "string" || !image) return null;
  if (image.startsWith("/")) return `${getApiBaseUrl()}${image}`;
  return image;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file couldn't be read as an image."));
    };
    img.src = url;
  });
}

/**
 * Validate a chosen poster/flyer and shrink it in the browser to a JPEG data URL
 * that fits the API's size limit. Throws an Error with a user-facing message.
 */
export async function preparePoster(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Upload a JPG, PNG or WebP image.");
  }
  if (file.size > MAX_SOURCE_BYTES) throw new Error("That image is over 10 MB. Choose a smaller file.");

  const img = await loadImage(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser couldn't process this image.");
  ctx.fillStyle = "#ffffff"; // flatten transparent PNGs
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  for (const quality of [0.88, 0.78, 0.68, 0.55]) {
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (Math.floor((dataUrl.length * 3) / 4) <= TARGET_BYTES) return dataUrl;
  }
  throw new Error("That image is too detailed to upload. Try a smaller one.");
}
