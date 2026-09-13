// Client-side watermarking: stamps a semi-transparent KANZIY wordmark into
// the bottom-right corner of uploaded photos before they leave the browser,
// so the stored file itself carries the brand. Small images (< 200px) and
// GIFs (animation would be lost) are left untouched.

export async function applyWatermark(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    if (Math.min(bitmap.width, bitmap.height) < 200) return file;

    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0);

    const text = 'KANZIY';
    const fontSize = Math.max(16, Math.round(Math.min(bitmap.width, bitmap.height) * 0.045));
    ctx.font = `700 ${fontSize}px Inter, Arial, sans-serif`;
    const pad = Math.round(fontSize * 0.7);
    const width = ctx.measureText(text).width;
    const x = canvas.width - width - pad;
    const y = canvas.height - pad;

    // Navy outline + white fill keeps the mark legible on light and dark photos.
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(1, 29, 72, 0.45)';
    ctx.lineWidth = Math.max(2, fontSize / 8);
    ctx.strokeText(text, x, y);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.fillText(text, x, y);

    const keepPng = file.type === 'image/png';
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, keepPng ? 'image/png' : 'image/jpeg', 0.85)
    );
    if (!blob) return file;
    return new File([blob], file.name, { type: keepPng ? 'image/png' : 'image/jpeg' });
  } catch {
    return file;
  }
}
