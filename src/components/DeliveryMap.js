"use client";
import { useEffect, useRef, useState } from "react";

async function geocode(address) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch {}
  return null;
}

export default function DeliveryMap({
  pickupAddress,
  dropoffAddress,
  driverLat,
  driverLng,
  driverName,
  status,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const [geocoded, setGeocode] = useState({ pickup: null, dropoff: null });
  const [mapReady, setMapReady] = useState(false);

  // Geocode addresses on mount
  useEffect(() => {
    const doGeocode = async () => {
      const [pickup, dropoff] = await Promise.all([
        geocode(pickupAddress),
        geocode(dropoffAddress),
      ]);
      setGeocode({ pickup, dropoff });
    };
    if (pickupAddress || dropoffAddress) doGeocode();
  }, [pickupAddress, dropoffAddress]);

  // Initialize map
  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    let timeoutId;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      // Bail if component unmounted or already initialized
      if (cancelled) return;
      if (mapInstanceRef.current) return;
      if (!mapRef.current) return;

      // If Leaflet already stamped this container, destroy it first
      if (mapRef.current._leaflet_id) {
        mapRef.current._leaflet_id = null;
      }

      const center = driverLat && driverLng
        ? [driverLat, driverLng]
        : geocoded.pickup
          ? [geocoded.pickup.lat, geocoded.pickup.lng]
          : geocoded.dropoff
            ? [geocoded.dropoff.lat, geocoded.dropoff.lng]
            : [36.7538, 3.0588];

      const map = L.map(mapRef.current, {
        center,
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      if (!cancelled) setMapReady(true);
    };

    timeoutId = setTimeout(initMap, 100);

    // Cleanup: destroy map on unmount
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        driverMarkerRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // Add markers once map is ready + geocoding done
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    const addMarkers = async () => {
      const L = (await import("leaflet")).default;
      const map = mapInstanceRef.current;

      const makeIcon = (emoji, color) => L.divIcon({
        html: `<div style="
          background:${color};border:3px solid white;border-radius:50%;
          width:36px;height:36px;display:flex;align-items:center;
          justify-content:center;font-size:16px;
          box-shadow:0 2px 8px rgba(0,0,0,0.25);
        ">${emoji}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        className: "",
      });

      const bounds = [];

      if (geocoded.pickup) {
        L.marker([geocoded.pickup.lat, geocoded.pickup.lng], {
          icon: makeIcon("📦", "#2563eb"),
        }).addTo(map).bindPopup(`<b>Pickup</b><br>${pickupAddress}`);
        bounds.push([geocoded.pickup.lat, geocoded.pickup.lng]);
      }

      if (geocoded.dropoff) {
        L.marker([geocoded.dropoff.lat, geocoded.dropoff.lng], {
          icon: makeIcon("🏠", "#dc2626"),
        }).addTo(map).bindPopup(`<b>Delivery</b><br>${dropoffAddress}`);
        bounds.push([geocoded.dropoff.lat, geocoded.dropoff.lng]);
      }

      if (driverLat && driverLng) {
        driverMarkerRef.current = L.marker([driverLat, driverLng], {
          icon: makeIcon("🚗", "#16a34a"),
        }).addTo(map).bindPopup(`<b>${driverName || "Driver"}</b><br>On the way`).openPopup();
        bounds.push([driverLat, driverLng]);
      }

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [40, 40] });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 14);
      }
    };

    addMarkers();
  }, [mapReady, geocoded, driverLat, driverLng]);

  // Update driver marker position
  useEffect(() => {
    if (!mapInstanceRef.current || !driverMarkerRef.current) return;
    if (!driverLat || !driverLng) return;
    driverMarkerRef.current.setLatLng([driverLat, driverLng]);
  }, [driverLat, driverLng]);

  const hasAnything = driverLat || geocoded.pickup || geocoded.dropoff;

  return (
    <div className="relative rounded-2xl overflow-hidden">
      <div ref={mapRef} className="w-full h-56 md:h-64 z-0" />
      {!hasAnything && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center p-4">
            <p className="text-2xl mb-2">🗺️</p>
            <p className="text-sm text-gray-500">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}