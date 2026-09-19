function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to decode image upload."));
    image.src = dataUrl;
  });
}

function shouldOptimizeImage(file: File, dataUrl: string): boolean {
  if (!file.type.startsWith("image/")) return false;
  if (!dataUrl.startsWith("data:image/")) return false;
  if (file.size < 80_000) return false;
  if (typeof document === "undefined") return false;
  return true;
}

async function optimizeDataUrl(file: File): Promise<string> {
  const original = await readFileAsDataUrl(file);
  if (!shouldOptimizeImage(file, original)) return original;
  try {
    const image = await loadImage(original);

    const maxDimension = 1200;
    const largestSide = Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height);
    const scale = largestSide > maxDimension ? maxDimension / largestSide : 1;
    const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
    const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return original;
    context.drawImage(image, 0, 0, width, height);

    const optimized = canvas.toDataURL("image/webp", 0.62);

    if (optimized.length >= original.length * 0.98) return original;
    return optimized;
  } catch {
    return original;
  }
}

// Uploads the optimized image to Vercel Blob and returns a real hosted URL
// instead of a giant base64 string. Falls back to the base64 data URL if the
// upload fails for any reason, so saving still works even if storage hiccups.
export async function fileToOptimizedDataUrl(file: File): Promise<string> {
  const optimized = await optimizeDataUrl(file);

  try {
    const response = await fetch("/api/upload-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, dataUrl: optimized }),
    });

    if (!response.ok) {
      console.error("Image upload failed, falling back to embedded image.");
      return optimized;
    }

    const result = await response.json();
    if (typeof result.url === "string" && result.url) {
      return result.url;
    }
    return optimized;
  } catch {
    console.error("Image upload request failed, falling back to embedded image.");
    return optimized;
  }
}
