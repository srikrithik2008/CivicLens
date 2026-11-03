import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, CheckCircle2, Construction, Lightbulb, MapPinned, ThumbsUp, Trash2, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import hero from "@/assets/hero-city.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FixMyCity — Report local issues in your neighbourhood" },
      { name: "description", content: "Report potholes, broken streetlights, garbage and water problems. Track fixes and upvote what matters in your city." },
      { property: "og:title", content: "FixMyCity — Report local issues" },
      { property: "og:description", content: "Snap a photo, drop a pin, and help your city fix what's broken." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const issues = [
  { icon: Construction, label: "Potholes" },
  { icon: Lightbulb, label: "Streetlights" },
  { icon: Trash2, label: "Garbage" },
  { icon: Droplets, label: "Water" },
];

const steps = [
  { icon: Camera, title: "Snap & describe", text: "Add a photo, a short title and what's wrong." },
  { icon: MapPinned, title: "Drop a pin", text: "Mark the exact spot so crews can find it." },
  { icon: ThumbsUp, title: "Rally support", text: "Neighbours upvote to push urgent issues up." },
  { icon: CheckCircle2, title: "Track the fix", text: "Follow it from Reported to In Progress to Resolved." },
];

function Index() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="relative overflow-hidden">
        <img src={hero} alt="Green, tidy city street" width={1600} height={1008} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-32">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" /> Citizen-powered city care
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-6xl">
              See it. Report it. <span className="text-primary">Fix your city.</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Potholes, dark streetlights, overflowing bins — tell the people who can fix them, in under a minute.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 rounded-xl bg-gradient-primary px-6 text-base shadow-glow">
                <Link to="/report/new">Report an Issue</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-xl bg-card px-6 text-base">
                <Link to="/auth">Create account</Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-2">
              {issues.map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5 rounded-full border bg-card/80 px-3 py-1.5 text-sm">
                  <Icon className="h-4 w-4 text-primary" /> {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <h2 className="text-3xl font-bold sm:text-4xl">How it works</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="rounded-2xl border bg-card p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-display text-sm font-semibold text-muted-foreground">0{i + 1}</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} FixMyCity
      </footer>
    </div>
  );
}
