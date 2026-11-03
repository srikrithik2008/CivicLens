import { z } from "zod";

export const CATEGORIES = [
  { value: "pothole", label: "Pothole" },
  { value: "streetlight", label: "Streetlight" },
  { value: "garbage", label: "Garbage" },
  { value: "water", label: "Water" },
  { value: "other", label: "Other" },
] as const;

export type Category = (typeof CATEGORIES)[number]["value"];

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export const reportSchema = z.object({
  title: z.string().trim().min(3, "Title needs at least 3 characters").max(120, "Keep the title under 120 characters"),
  description: z.string().trim().min(1, "Please describe the issue").max(2000, "Keep it under 2000 characters"),
  category: z.enum(["pothole", "streetlight", "garbage", "water", "other"], {
    errorMap: () => ({ message: "Pick a category" }),
  }),
  latitude: z.number({ invalid_type_error: "Pick a location on the map" }).min(-90).max(90),
  longitude: z.number({ invalid_type_error: "Pick a location on the map" }).min(-180).max(180),
  address: z.string().trim().max(300).optional(),
});
