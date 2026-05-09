import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, ActivityIndicator, Alert
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { colors } from "../lib/theme";
import { submitReport } from "../lib/api";

type Props = NativeStackScreenProps<RootStackParamList, "Report">;

const TRASH_TYPES = ["Plastic", "E-waste", "Hazardous", "Construction", "Organic", "Other"];
const SEVERITY = ["small", "medium", "large"] as const;
type Severity = typeof SEVERITY[number];

export default function ReportScreen({ navigation }: Props) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [severity, setSeverity] = useState<Severity>("medium");
  const [description, setDescription] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Camera access is required.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      exif: false
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPhotos((p) => [...p, uri].slice(0, 5));
    }
  };

  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Photo library access is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, 5 - photos.length),
      quality: 0.7,
      exif: false
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setPhotos((p) => [...p, ...uris].slice(0, 5));
    }
  };

  const useMyLocation = async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Location is required.");
      return;
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
  };

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const removePhoto = (idx: number) =>
    setPhotos((p) => p.filter((_, i) => i !== idx));

  const onSubmit = async () => {
    if (!coords) return Alert.alert("Missing location", "Tap the location button first.");
    if (photos.length === 0) return Alert.alert("Missing photo", "Please add at least one photo.");

    setSubmitting(true);
    try {
      const result = await submitReport({
        latitude: coords.lat,
        longitude: coords.lng,
        photos: photos.map((uri, i) => ({ uri, name: `photo_${i}.jpg`, type: "image/jpeg" })),
        tags,
        severity,
        description,
        anonymous
      });
      navigation.replace("Success", { lat: coords.lat, lng: coords.lng, id: result.id });
    } catch (e: any) {
      Alert.alert("Submission failed", e.message || "Could not reach the server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.container}>
      <Text style={styles.label}>Photos ({photos.length}/5)</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.btn, styles.btnPrimary, { flex: 1 }]} onPress={takePhoto}>
          <Text style={styles.btnPrimaryText}>Take Photo</Text>
        </TouchableOpacity>
        <View style={{ width: 8 }} />
        <TouchableOpacity style={[styles.btn, styles.btnGhost, { flex: 1 }]} onPress={pickFromLibrary}>
          <Text style={styles.btnGhostText}>From Library</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
        {photos.map((uri, i) => (
          <TouchableOpacity key={i} onPress={() => removePhoto(i)}>
            <Image source={{ uri }} style={styles.thumb} />
            <Text style={styles.removeHint}>tap to remove</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Location</Text>
      <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={useMyLocation}>
        <Text style={styles.btnGhostText}>{coords ? "Update location" : "Use my location"}</Text>
      </TouchableOpacity>
      {coords && (
        <Text style={styles.coords}>
          Lat: {coords.lat.toFixed(5)}, Lng: {coords.lng.toFixed(5)}
        </Text>
      )}

      <Text style={styles.label}>Trash type</Text>
      <View style={styles.chips}>
        {TRASH_TYPES.map((t) => {
          const active = tags.includes(t);
          return (
            <TouchableOpacity
              key={t}
              onPress={() => toggleTag(t)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{t}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Size</Text>
      <View style={styles.row}>
        {SEVERITY.map((s) => {
          const active = severity === s;
          return (
            <TouchableOpacity
              key={s}
              style={[styles.seg, active && styles.segActive]}
              onPress={() => setSeverity(s)}
            >
              <Text style={[styles.segText, active && styles.segTextActive]}>{s}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput
        style={styles.textarea}
        multiline
        numberOfLines={3}
        placeholder="e.g. Pile of debris near the park entrance"
        value={description}
        onChangeText={setDescription}
      />

      <TouchableOpacity style={styles.checkRow} onPress={() => setAnonymous((v) => !v)}>
        <Text style={{ fontSize: 18 }}>{anonymous ? "[x]" : "[ ]"}</Text>
        <Text style={{ marginLeft: 8 }}>Submit anonymously</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, styles.btnPrimary, { marginTop: 16 }]}
        onPress={onSubmit}
        disabled={submitting}
      >
        {submitting
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnPrimaryText}>SUBMIT REPORT</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  label: { fontWeight: "700", marginTop: 18, marginBottom: 8, color: colors.text },
  row: { flexDirection: "row" },
  btn: { padding: 14, borderRadius: 10, alignItems: "center" },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
  btnGhost: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border },
  btnGhostText: { color: colors.text, fontWeight: "600" },
  thumb: { width: 80, height: 80, borderRadius: 8, marginRight: 8 },
  removeHint: { fontSize: 10, color: colors.muted, textAlign: "center" },
  coords: { fontSize: 12, color: colors.muted, marginTop: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap" },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff", marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 12 },
  chipTextActive: { color: "#fff" },
  seg: { flex: 1, padding: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff", alignItems: "center", marginRight: 6, borderRadius: 8 },
  segActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  segText: { textTransform: "capitalize", color: colors.text },
  segTextActive: { color: "#fff", fontWeight: "700" },
  textarea: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, minHeight: 80, textAlignVertical: "top" },
  checkRow: { flexDirection: "row", alignItems: "center", marginTop: 14 }
});
