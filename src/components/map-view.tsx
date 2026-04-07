"use client";

import { useEffect, useRef } from "react";
import { Doctor } from "@/lib/types";

interface MapViewProps {
  doctors: Doctor[];
}

export function MapView({ doctors }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  const withCoords = doctors.filter((d) => d.lat && d.lng);

  useEffect(() => {
    if (!mapRef.current || !withCoords.length) return;

    // Dynamic import to avoid SSR issues
    import("leaflet").then((L) => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
      }

      const map = L.default.map(mapRef.current!, {
        center: [withCoords[0].lat!, withCoords[0].lng!],
        zoom: 13,
      });

      L.default.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const icon = L.default.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });

      withCoords.forEach((doctor) => {
        const marker = L.default.marker([doctor.lat!, doctor.lng!], { icon }).addTo(map);
        const url = `/doctor/${doctor.google_place_id}?name=${encodeURIComponent(doctor.name)}&address=${encodeURIComponent(doctor.address)}&phone=${encodeURIComponent(doctor.phone ?? "")}&website=${encodeURIComponent(doctor.website ?? "")}`;
        marker.bindPopup(`
          <div style="min-width:160px">
            <strong style="font-size:13px">${doctor.name}</strong><br/>
            <span style="font-size:11px;color:#6b7280">${doctor.address}</span><br/>
            <a href="${url}" style="font-size:12px;color:#2563eb;font-weight:600;margin-top:6px;display:inline-block">View Profile →</a>
          </div>
        `);
      });

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [withCoords]);

  if (!withCoords.length) return null;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div
        ref={mapRef}
        className="w-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
        style={{ height: "400px" }}
      />
    </>
  );
}
