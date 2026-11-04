import { useEffect, useRef } from "react";
import L from "leaflet";
import type { ReportStatus } from "@/lib/report-data";

export default function MiniMap({ lat, lng, status }: { lat: number; lng: number; status: ReportStatus }) {
  const elRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!elRef.current) return;
    const map = L.map(elRef.current, { scrollWheelZoom: false }).setView([lat, lng], 16);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap contributors", maxZoom: 19 }).addTo(map);
    const icon = L.divIcon({ className: "", html: `<div class="fmc-pin fmc-pin--${status}"></div>`, iconSize: [22, 22], iconAnchor: [11, 22] });
    L.marker([lat, lng], { icon }).addTo(map);
    return () => { map.remove(); };
  }, [lat, lng, status]);
  return <div ref={elRef} className="h-56 w-full overflow-hidden rounded-xl border" />;
}
