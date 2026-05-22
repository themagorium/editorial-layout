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
  if (file.size < 120_000) return false;
  if (typeof document === "undefined") return false;
  return true;
}

export async function fileToOptimizedDataUrl(file: File): Promise<string> {
  const original = await readFileAsDataUrl(file);
  if (!shouldOptimizeImage(file, original)) return original;

  try {
    const image = await loadImage(original);
    const maxDimension = 1600;
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

    const optimized = canvas.toDataURL("image/webp", 0.76);
    // Keep original if compression gain is negligible.
    if (optimized.length >= original.length * 0.92) return original;
    return optimized;
  } catch {
    return original;
  }
}
