"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons in Leaflet
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

type Coords = { lat: number; lng: number };

function ClickHandler({ onChange }: { onChange: (c: Coords) => void }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });
  return null;
}

export default function LocationPicker({
  coords,
  onChange
}: {
  coords: Coords | null;
  onChange: (c: Coords) => void;
}) {
  // The picker always opens on Prishtina city centre. As soon as the user
  // taps a point or hits "Use my location", the map re-centres on the chosen
  // coordinate (forced via the key prop so leaflet remounts cleanly).
  const center: [number, number] = coords ? [coords.lat, coords.lng] : [42.6629, 21.1655];
  const zoom = coords ? 16 : 13;

  return (
    <div className="h-64 rounded overflow-hidden border">
      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={11}
        maxZoom={19}
        key={`${center[0]}-${center[1]}`}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onChange={onChange} />
        {coords && <Marker position={[coords.lat, coords.lng]} icon={icon} />}
      </MapContainer>
    </div>
  );
}
