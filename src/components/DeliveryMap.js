"use client";
import { useEffect, useRef } from "react";

export default function DeliveryMap({ pickupAddress, dropoffAddress, driverLat, driverLng, driverName, status }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const driverMarkerRef = useRef(null);

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;
    if (mapInstanceRef.current) return; // already initialized

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      // Default to Algiers if no coordinates
      const center = driverLat && driverLng
        ? [driverLat, driverLng]
        : [36.7538, 3.0588];

      const map = L.map(mapRef.current, {
        center,
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Driver marker
      if (driverLat && driverLng) {
        const driverIcon = L.divIcon({
          html: `<div style="
            background: #16a34a;
            border: 3px solid white;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">🚗</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          className: "",
        });

        driverMarkerRef.current = L.marker([driverLat, driverLng], { icon: driverIcon })
          .addTo(map)
          .bindPopup(`<b>${driverName || "Driver"}</b><br>On the way`)
          .openPopup();
      }

      // Pickup marker
      const pickupIcon = L.divIcon({
        html: `<div style="
          background: #2563eb;
          border: 3px solid white;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">📦</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        className: "",
      });

      // Dropoff marker
      const dropoffIcon = L.divIcon({
        html: `<div style="
          background: #dc2626;
          border: 3px solid white;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">🏠</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        className: "",
      });

      // Add placeholder markers near driver location
      if (driverLat && driverLng) {
        L.marker([driverLat + 0.005, driverLng - 0.005], { icon: pickupIcon })
          .addTo(map)
          .bindPopup(`<b>Pickup</b><br>${pickupAddress}`);

        L.marker([driverLat - 0.008, driverLng + 0.008], { icon: dropoffIcon })
          .addTo(map)
          .bindPopup(`<b>Delivery</b><br>${dropoffAddress}`);
      }
    };

    initMap();
  }, []);

  // Update driver marker when location changes
  useEffect(() => {
    if (!mapInstanceRef.current || !driverMarkerRef.current) return;
    if (!driverLat || !driverLng) return;

    driverMarkerRef.current.setLatLng([driverLat, driverLng]);
    mapInstanceRef.current.panTo([driverLat, driverLng]);
  }, [driverLat, driverLng]);

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-56 md:h-72 rounded-2xl overflow-hidden z-0" />
      {!driverLat && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-2xl">
          <div className="text-center">
            <p className="text-2xl mb-1">🗺️</p>
            <p className="text-sm text-gray-500 font-medium">Map available when driver is assigned</p>
          </div>
        </div>
      )}
    </div>
  );
}