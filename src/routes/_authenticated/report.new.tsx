import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState, type FormEvent } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { toast } from "sonner";
import { Camera, Crosshair, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, MAX_PHOTO_BYTES, reportSchema, type Category } from "@/lib/reports";

const LocationPicker = lazy(() => import("@/components/LocationPicker"));

export const Route = createFileRoute("/_authenticated/report/new")({
  head: () => ({
    meta: [
      { title: "Report an issue — FixMyCity" },
      { name: "description", content: "Submit a pothole, streetlight, garbage or water issue with a photo and location." },
      { property: "og:title", content: "Report an issue — FixMyCity" },
      { property: "og:description", content: "Tell your city what needs fixing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewReport,
});

const DEFAULT_CENTER = { lat: 13.0827, lng: 80.2707 };

function NewReport() {
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();
  const [category, setCategory] = useState<Category | "">("");
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [address, setAddress] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!photo) { setPreview(null); return; }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  useEffect(() => {
    if (!pos) return;
    const ctrl = new AbortController();
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => d?.display_name && setAddress(String(d.display_name).slice(0, 300)))
      .catch(() => {});
    return () => ctrl.abort();
  }, [pos]);

  function useMyLocation() {
    if (!navigator.geolocation) return void toast.error("Location isn't available on this device");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const here = { lat: p.coords.latitude, lng: p.coords.longitude };
        setCenter(here);
        setPos(here);
      },
      () => toast.error("Couldn't get your location — tap the map instead"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function onPhoto(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return void toast.error("Please choose an image file");
    if (file.size > MAX_PHOTO_BYTES) return void toast.error("Photo must be under 5 MB");
    setPhoto(file);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = reportSchema.safeParse({
      title: fd.get("title"),
      description: fd.get("description"),
      category: category || undefined,
      latitude: pos?.lat,
      longitude: pos?.lng,
      address: address || undefined,
    });
    if (!parsed.success) return void toast.error(parsed.error.issues[0]?.message);
    if (!photo) return void toast.error("Please add a photo of the issue");

    setSubmitting(true);
    try {
      const ext = photo.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("report-photos").upload(path, photo, { contentType: photo.type });
      if (upErr) throw upErr;
      const { error } = await supabase.from("reports").insert({ ...parsed.data, address: parsed.data.address ?? null, user_id: user.id, photo_url: path });
      if (error) {
        await supabase.storage.from("report-photos").remove([path]);
        throw error;
      }
      toast.success("Thanks! Your report has been submitted.");
      navigate({ to: "/" });
    } catch (err) {
      const message = err && typeof err === "object" && "message" in err && typeof err.message === "string" ? err.message : "";
      toast.error(message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <h1 className="text-3xl font-bold">Report an issue</h1>
        <p className="mt-1 text-muted-foreground">A clear photo and exact location help crews fix it faster.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-6 rounded-2xl border bg-card p-5 shadow-soft sm:p-8">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="e.g. Deep pothole near bus stop" maxLength={120} required />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  aria-pressed={category === c.value}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    category === c.value ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={4} maxLength={2000} placeholder="What's the problem and how long has it been there?" required />
          </div>

          <div className="space-y-2">
            <Label>Photo</Label>
            {preview ? (
              <div className="relative overflow-hidden rounded-xl border">
                <img src={preview} alt="Selected issue" className="max-h-72 w-full object-cover" />
                <Button type="button" size="icon" variant="secondary" className="absolute right-2 top-2" onClick={() => setPhoto(null)} aria-label="Remove photo">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-muted/50 px-4 py-10 text-center hover:bg-accent">
                <Camera className="h-7 w-7 text-primary" />
                <span className="text-sm font-medium">Tap to take or upload a photo</span>
                <span className="text-xs text-muted-foreground">JPG or PNG, up to 5 MB</span>
                <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => onPhoto(e.target.files?.[0])} />
              </label>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Location</Label>
              <Button type="button" variant="outline" size="sm" onClick={useMyLocation}>
                <Crosshair className="mr-1 h-4 w-4" /> Use my location
              </Button>
            </div>
            <ClientOnly fallback={<div className="h-72 animate-pulse rounded-xl bg-muted" />}>
              <Suspense fallback={<div className="h-72 animate-pulse rounded-xl bg-muted" />}>
                <LocationPicker value={pos} onChange={setPos} center={center} />
              </Suspense>
            </ClientOnly>
            <p className="text-xs text-muted-foreground">
              {pos ? address || `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}` : "Tap the map to drop a pin, then drag to adjust."}
            </p>
          </div>

          <Button type="submit" size="lg" className="h-12 w-full bg-gradient-primary text-base shadow-glow" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit report"}
          </Button>
        </form>
      </main>
    </div>
  );
}
