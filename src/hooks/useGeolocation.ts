"use client";

import { useState, useCallback } from "react";

interface Coords {
  lat: number;
  lng: number;
}

interface GeolocationState {
  coords: Coords | null;
  city: string | null;
  loading: boolean;
  error: string | null;
  request: () => void;
}

export function useGeolocation(): GeolocationState {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords({ lat, lng });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { "User-Agent": "TravelDocAI/1.0" } }
          );
          if (res.ok) {
            const data = await res.json();
            const cityName =
              data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              data.address?.county ||
              null;
            setCity(cityName);
          }
        } catch {
          // coords still set, city just remains null
        }
        setLoading(false);
      },
      (err) => {
        setError(
          err.code === 1
            ? "Location permission denied. Please allow location access."
            : "Could not get your location. Please try again."
        );
        setLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  }, []);

  return { coords, city, loading, error, request };
}
