import { useEffect, useRef } from "react";
import L from "leaflet";
import type { ReportWithPhoto } from "@/lib/report-data";
import { CATEGORIES } from "@/lib/reports";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export default function ReportsMap({ reports }: { reports: ReportWithPhoto[] }) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const map = L.map(elRef.current).setView([13.0827, 80.2707], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();
    for (const r of reports) {
      const icon = L.divIcon({ className: "", html: `<div class="fmc-pin fmc-pin--${r.status}"></div>`, iconSize: [22, 22], iconAnchor: [11, 22], popupAnchor: [0, -22] });
      const cat = CATEGORIES.find((c) => c.value === r.category)?.label ?? r.category;
      const html = `<div class="fmc-popup">
        ${r.photoSignedUrl ? `<img src="${esc(r.photoSignedUrl)}" alt="" />` : ""}
        <strong>${esc(r.title)}</strong>
        <div>${esc(cat)} · 👍 ${r.upvote_count}</div>
        <a href="/reports/${r.id}">View details</a>
      </div>`;
      L.marker([r.latitude, r.longitude], { icon }).bindPopup(html, { maxWidth: 240 }).addTo(layer);
    }
  }, [reports]);

  return <div ref={elRef} className="h-[calc(100vh-12rem)] min-h-96 w-full overflow-hidden rounded-xl border" />;
}
