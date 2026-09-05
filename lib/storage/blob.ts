import { put } from "@vercel/blob";

export async function uploadFileToBlob(
  file: File | Buffer,
  fileName: string,
  contentType: string
): Promise<{ url: string; size: number }> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (token) {
    try {
      const blob = await put(fileName, file, {
        access: "public",
        token,
        contentType,
      });
      return {
        url: blob.url,
        size: "size" in blob ? (blob.size as number) : 0,
      };
    } catch (err) {
      console.warn("Vercel Blob upload failed, falling back to simulated storage:", err);
    }
  }

  const mockUrl = `/uploads/${Date.now()}-${encodeURIComponent(fileName)}`;
  return {
    url: mockUrl,
    size: Buffer.isBuffer(file) ? file.length : 1024,
  };
}
