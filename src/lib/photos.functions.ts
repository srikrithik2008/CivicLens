import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PHOTO_MISSING, validatePhoto } from "@/lib/photo-validation";

/** Uploads a report photo into the signed-in user's own folder after checking its size and real file type. */
export const uploadReportPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error(PHOTO_MISSING);
    const file = data.get("photo");
    if (!(file instanceof Blob)) throw new Error(PHOTO_MISSING);
    return { file };
  })
  .handler(async ({ data, context }) => {
    const { file } = data;
    const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const type = validatePhoto(file.size, head);

    const path = `${context.userId}/${crypto.randomUUID()}.${type.ext}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage
      .from("report-photos")
      .upload(path, file, { contentType: type.mime, upsert: false });
    if (error) {
      console.error("Report photo upload failed", error);
      throw new Error("Couldn't upload the photo. Please try again.");
    }
    return { path };
  });
