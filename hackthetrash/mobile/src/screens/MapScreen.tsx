import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { WebView } from "react-native-webview";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { fetchReports, fullPhotoUrl, Report } from "../lib/api";
import { colors } from "../lib/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Map">;

// Build a self-contained Leaflet HTML page that uses OpenStreetMap tiles.
// Reports are injected as a JS variable; the page reads it and renders pins
// (with photo thumbnails in popups). The native side reloads with new HTML
// whenever reports change, so the OSM layer always reflects latest data.
function buildHtml(reports: Report[], focus?: { lat: number; lng: number; id?: string }): string {
  const safeReports = reports.map((r) => ({
    id: r.id,
    lat: r.latitude,
    lng: r.longitude,
    status: r.status,
    description: r.description ?? "",
    severity: r.severity ?? "",
    tags: r.tags ?? [],
    photos: (r.photoUrls ?? r.photo_urls ?? []).map(fullPhotoUrl),
    createdAt: r.createdAt ?? r.created_at ?? ""
  }));
  const json = JSON.stringify(safeReports).replace(/</g, "\u003c");
  const focusJson = JSON.stringify(focus ?? null);

  return `<!doctype html>
<html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
  html,body,#map{height:100%;margin:0;padding:0;font-family:-apple-system,sans-serif}
  .popup img{height:90px;border-radius:6px;margin-right:4px;object-fit:cover}
  .popup .photos{display:flex;overflow-x:auto;margin-bottom:6px}
  .popup .status{font-weight:700;text-transform:capitalize}
  .popup .meta{font-size:11px;color:#6B7280;margin-top:6px}
  .popup .tags{font-size:12px;color:#6B7280;margin-top:4px}
</style>
</head><body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var STATUS_COLORS = {
    reported: "#DC2626",
    verified: "#F59E0B",
    cleaning: "#3B82F6",
    cleaned: "#10B981",
    rejected: "#6B7280"
  };
  var REPORTS = ${json};
  var FOCUS = ${focusJson};
  var PRISTINA = [42.6629, 21.1655];
  var PRISTINA_ZOOM = 13;
  var PRISTINA_BOUNDS = [[42.55, 21.05], [42.78, 21.30]];

  var map = L.map("map", {
    center: FOCUS ? [FOCUS.lat, FOCUS.lng] : PRISTINA,
    zoom: FOCUS ? 16 : PRISTINA_ZOOM,
    minZoom: 11,
    maxZoom: 19,
    maxBounds: PRISTINA_BOUNDS,
    maxBoundsViscosity: 0.7
  });
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19
  }).addTo(map);

  // Home control: tap to recentre on Pristina
  var HomeControl = L.Control.extend({
    options: { position: "topright" },
    onAdd: function () {
      var btn = L.DomUtil.create("a", "leaflet-bar");
      btn.href = "#";
      btn.title = "Pristina";
      btn.style.cssText = "display:flex;align-items:center;justify-content:center;width:auto;padding:0 10px;height:30px;background:#fff;color:#111;font:600 12px -apple-system,sans-serif;text-decoration:none";
      btn.innerHTML = "&#127968; Pristina";
      L.DomEvent.on(btn, "click", function (e) {
        L.DomEvent.preventDefault(e);
        map.flyTo(PRISTINA, PRISTINA_ZOOM, { duration: 1 });
      });
      return btn;
    }
  });
  new HomeControl().addTo(map);

  function pinIcon(color) {
    return L.divIcon({
      className: "",
      html: '<div style="background:'+color+';width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 4px rgba(0,0,0,.3)"></div>',
      iconSize: [18, 18]
    });
  }

  REPORTS.forEach(function(r) {
    var color = STATUS_COLORS[r.status] || "#999";
    var marker = L.marker([r.lat, r.lng], { icon: pinIcon(color) }).addTo(map);
    var photosHtml = "";
    if (r.photos && r.photos.length) {
      photosHtml = '<div class="photos">' + r.photos.map(function(u){
        return '<img src="'+u+'" alt="trash"/>';
      }).join("") + '</div>';
    }
    var tagsHtml = r.tags && r.tags.length ? '<div class="tags">Tags: '+r.tags.join(", ")+'</div>' : "";
    var sevHtml = r.severity ? '<div class="tags">Size: '+r.severity+'</div>' : "";
    var coordHtml = '<div class="meta">'+r.lat.toFixed(5)+', '+r.lng.toFixed(5)+(r.createdAt?' &middot; '+new Date(r.createdAt).toLocaleString():'')+'</div>';
    var youHtml = (FOCUS && FOCUS.id === r.id) ? ' <span style="color:#16A34A;font-size:11px">(your report)</span>' : "";
    var html = '<div class="popup">'+photosHtml+'<div class="status" style="color:'+color+'">&#9679; '+r.status+youHtml+'</div>'+
      (r.description ? '<div>'+r.description+'</div>' : '')+tagsHtml+sevHtml+coordHtml+'</div>';
    marker.bindPopup(html, { maxWidth: 260 });
    if (FOCUS && FOCUS.id === r.id) marker.openPopup();
  });
</script>
</body></html>`;
}

export default function MapScreen({ route }: Props) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const focus = route.params && route.params.lat && route.params.lng
    ? { lat: route.params.lat, lng: route.params.lng, id: route.params.id }
    : undefined;

  const load = async () => {
    try {
      setError(null);
      const r = await fetchReports();
      setReports(r);
    } catch (e: any) {
      setError(e.message || "Failed to load reports");
      // Fallback demo
      setReports([
        { id: "demo1", latitude: 42.6629, longitude: 21.1655, status: "reported", description: "Demo: plastic bottles near Skanderbeg Square" },
        { id: "demo2", latitude: 42.6699, longitude: 21.1782, status: "cleaned", description: "Demo: cleaned debris in Sunny Hill" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 8, color: colors.muted }}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <WebView
        originWhitelist={["*"]}
        source={{ html: buildHtml(reports, focus) }}
        style={{ flex: 1 }}
      />
      <TouchableOpacity style={styles.refresh} onPress={load}>
        <Text style={{ fontWeight: "700" }}>Refresh</Text>
      </TouchableOpacity>
      {error && (
        <View style={styles.errorBar}>
          <Text style={{ color: "#fff", fontSize: 12 }}>Showing demo data (server unreachable)</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  refresh: { position: "absolute", top: 12, right: 12, backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  errorBar: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: colors.danger, padding: 6, alignItems: "center" }
});
