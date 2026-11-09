import { describe, expect, it } from "vitest";
import { PHOTO_TOO_LARGE, PHOTO_WRONG_TYPE, validatePhoto } from "@/lib/photo-validation";

const pad = (bytes: number[]) => new Uint8Array([...bytes, ...Array(12).fill(0)].slice(0, 12));
const JPEG = pad([0xff, 0xd8, 0xff, 0xe0]);
const PNG = pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]);
const GIF = pad([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
const TEXT = new TextEncoder().encode("hello world!");
const MB = 1024 * 1024;

describe("report photo validation", () => {
  it("accepts a real JPEG as .jpg", () => expect(validatePhoto(1000, JPEG)).toEqual({ ext: "jpg", mime: "image/jpeg" }));
  it("accepts a real PNG as .png", () => expect(validatePhoto(1000, PNG)).toEqual({ ext: "png", mime: "image/png" }));
  it("accepts a real WebP as .webp", () => expect(validatePhoto(1000, WEBP)).toEqual({ ext: "webp", mime: "image/webp" }));
  it("accepts a photo of exactly 5 MB", () => expect(validatePhoto(5 * MB, JPEG).ext).toBe("jpg"));
  it("rejects a photo over 5 MB", () => expect(() => validatePhoto(5 * MB + 1, JPEG)).toThrow(PHOTO_TOO_LARGE));
  it("rejects a GIF", () => expect(() => validatePhoto(1000, GIF)).toThrow(PHOTO_WRONG_TYPE));
  it("rejects a non-image renamed to look like a photo", () => expect(() => validatePhoto(1000, TEXT)).toThrow(PHOTO_WRONG_TYPE));
});
