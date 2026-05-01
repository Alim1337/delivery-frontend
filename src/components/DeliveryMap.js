"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix leaflet default icon issue in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom colored markers
const createIcon = (color) => L.divIcon({
  className: "",
  html: `
    <div style="
      background: ${color};
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

const pickupIcon = createIcon("#3B82F6"); // blue
const dropoffIcon = createIcon("#10B981"); // green

// Geocode an address using OpenStreetMap Nominatim (free, no API key)
async function geocode(address) {
  try {
    const encoded = encodeURIComponent(address);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    if (data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch {}
  return null;
}

// Auto-fit map bounds
function FitBounds({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length >= 2) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (coords.length === 1) {
      map.setView(coords[0], 13);
    }
  }, [coords, map]);
  return null;
}

export default function DeliveryMap({ pickupAddress, dropoffAddress, status }) {
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [pickup, dropoff] = await Promise.all([
        geocode(pickupAddress),
        geocode(dropoffAddress),
      ]);
      setPickupCoords(pickup);
      setDropoffCoords(dropoff);
      setLoading(false);
      if (!pickup && !dropoff) setError(true);
    };
    if (pickupAddress || dropoffAddress) load();
  }, [pickupAddress, dropoffAddress]);

  if (loading) {
    return (
      <div className="h-48 bg-gray-100 rounded-2xl flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          Finding locations on map...
        </div>
      </div>
    );
  }

  if (error || (!pickupCoords && !dropoffCoords)) {
    return (
      <div className="h-48 bg-gray-100 rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-sm">Could not load map</p>
          <p className="text-gray-300 text-xs mt-1">Address not found on map</p>
        </div>
      </div>
    );
  }

  const center = pickupCoords || dropoffCoords;
  const allCoords = [pickupCoords, dropoffCoords].filter(Boolean);
  const delivered = status === "DELIVERED";

  return (
    <div className="rounded-2xl overflow-hidden" style={{ height: "240px" }}>
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
        scrollWheelZoom={false}>

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds coords={allCoords} />

        {/* Pickup marker */}
        {pickupCoords && (
          <Marker position={pickupCoords} icon={pickupIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-blue-600 mb-1">📦 Pickup point</p>
                <p className="text-gray-600">{pickupAddress}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Dropoff marker */}
        {dropoffCoords && (
          <Marker position={dropoffCoords} icon={dropoffIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-green-600 mb-1">
                  {delivered ? "✅ Delivered here" : "🏠 Delivery point"}
                </p>
                <p className="text-gray-600">{dropoffAddress}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route line between pickup and dropoff */}
        {pickupCoords && dropoffCoords && (
          <Polyline
            positions={[pickupCoords, dropoffCoords]}
            color={delivered ? "#10B981" : "#3B82F6"}
            weight={3}
            dashArray={delivered ? undefined : "8 6"}
            opacity={0.7}
          />
        )}
      </MapContainer>
    </div>
  );
}