import { MAX_PHOTO_BYTES } from "@/lib/reports";

export const PHOTO_TOO_LARGE = "Photo must be under 5 MB";
export const PHOTO_WRONG_TYPE = "This file isn't a JPEG, PNG or WebP image. Please choose a different photo.";
export const PHOTO_MISSING = "Please add a photo of the issue";

export type PhotoType = { ext: "jpg" | "png" | "webp"; mime: "image/jpeg" | "image/png" | "image/webp" };

/** Identify an image by its first bytes (magic numbers), ignoring the file name and claimed type. */
export function detectPhotoType(head: Uint8Array): PhotoType | null {
  const at = (i: number, bytes: number[]) => bytes.every((b, j) => head[i + j] === b);
  if (at(0, [0xff, 0xd8, 0xff])) return { ext: "jpg", mime: "image/jpeg" };
  if (at(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { ext: "png", mime: "image/png" };
  if (at(0, [0x52, 0x49, 0x46, 0x46]) && at(8, [0x57, 0x45, 0x42, 0x50])) return { ext: "webp", mime: "image/webp" };
  return null;
}

/** Throws a user-facing error unless the photo is non-empty, at most 5 MB, and really a JPEG, PNG or WebP. */
export function validatePhoto(size: number, head: Uint8Array): PhotoType {
  if (size <= 0) throw new Error(PHOTO_MISSING);
  if (size > MAX_PHOTO_BYTES) throw new Error(PHOTO_TOO_LARGE);
  const type = detectPhotoType(head);
  if (!type) throw new Error(PHOTO_WRONG_TYPE);
  return type;
}
