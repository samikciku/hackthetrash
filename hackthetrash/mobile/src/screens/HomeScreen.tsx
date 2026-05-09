import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { colors } from "../lib/theme";
import { t } from "../lib/i18n";
import { queueSize, flushQueue } from "../lib/queue";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    queueSize().then(setPending);
    const i = setInterval(() => queueSize().then(setPending), 5000);
    return () => clearInterval(i);
  }, []);

  const sync = async () => {
    setSyncing(true);
    await flushQueue();
    setPending(await queueSize());
    setSyncing(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heroIcon}>🗑️</Text>
      <Text style={styles.title}>{t("app.tagline")}</Text>
      <Text style={styles.subtitle}>{t("home.subtitle")}</Text>

      {pending > 0 && (
        <View style={styles.queueBanner}>
          <Text style={styles.queueText}>
            {t(pending === 1 ? "queue.pending_one" : "queue.pending_other", { count: pending })}
          </Text>
          <TouchableOpacity onPress={sync} disabled={syncing}>
            <Text style={styles.queueAction}>{syncing ? t("queue.syncing") : t("queue.syncNow")}</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={[styles.btn, styles.btnPrimary]}
        onPress={() => navigation.navigate("Report")}
      >
        <Text style={styles.btnPrimaryText}>📸 {t("home.ctaReport")}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, styles.btnGhost]}
        onPress={() => navigation.navigate("Map")}
      >
        <Text style={styles.btnGhostText}>🗺️ {t("home.ctaMap")}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, styles.btnGhost]}
        onPress={() => navigation.navigate("Settings")}
      >
        <Text style={styles.btnGhostText}>⚙️ Settings</Text>
      </TouchableOpacity>

      <View style={styles.steps}>
        {[
          { n: "1", t: t("home.step1"), d: t("home.step1d") },
          { n: "2", t: t("home.step2"), d: t("home.step2d") },
          { n: "3", t: t("home.step3"), d: t("home.step3d") }
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
  queueBanner: { width: "100%", backgroundColor: "#FEF3C7", padding: 12, borderRadius: 10, marginBottom: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  queueText: { color: "#92400E", flex: 1 },
  queueAction: { color: "#92400E", fontWeight: "700" },
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
