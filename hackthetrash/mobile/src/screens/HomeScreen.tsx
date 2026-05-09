import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { colors } from "../lib/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heroIcon}>🗑️</Text>
      <Text style={styles.title}>Together, let's clean up our cities.</Text>
      <Text style={styles.subtitle}>
        Spot illegal trash? Snap a photo, drop a pin, change your community.
      </Text>

      <TouchableOpacity
        style={[styles.btn, styles.btnPrimary]}
        onPress={() => navigation.navigate("Report")}
      >
        <Text style={styles.btnPrimaryText}>📸 Report Trash</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, styles.btnGhost]}
        onPress={() => navigation.navigate("Map")}
      >
        <Text style={styles.btnGhostText}>🗺️ View Map</Text>
      </TouchableOpacity>

      <View style={styles.steps}>
        {[
          { n: "1", t: "Snap", d: "Photograph the trash" },
          { n: "2", t: "Locate", d: "Auto-detect GPS" },
          { n: "3", t: "Submit", d: "Anonymous or signed-in" }
        ].map((s) => (
          <View key={s.n} style={styles.step}>
            <Text style={styles.stepNum}>{s.n}</Text>
            <Text style={styles.stepTitle}>{s.t}</Text>
            <Text style={styles.stepDesc}>{s.d}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, alignItems: "center", backgroundColor: colors.bg, flexGrow: 1 },
  heroIcon: { fontSize: 64, marginVertical: 12 },
  title: { fontSize: 24, fontWeight: "800", textAlign: "center", color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.muted, textAlign: "center", marginBottom: 24 },
  btn: { width: "100%", padding: 16, borderRadius: 12, alignItems: "center", marginVertical: 6 },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  btnGhost: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border },
  btnGhostText: { color: colors.text, fontWeight: "600", fontSize: 16 },
  steps: { width: "100%", marginTop: 24, gap: 12 },
  step: { backgroundColor: "#fff", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  stepNum: { fontSize: 28, fontWeight: "800", color: colors.primary },
  stepTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginTop: 4 },
  stepDesc: { fontSize: 13, color: colors.muted, marginTop: 2 }
});
