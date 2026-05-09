import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { colors } from "../lib/theme";
import { i18n, setLocale, SUPPORTED, Locale, t } from "../lib/i18n";
import { listQueue, flushQueue, removeFromQueue, PendingReport } from "../lib/queue";
import { getStoredToken } from "../lib/notifications";

const LANG_NAMES: Record<Locale, string> = { en: "English", sq: "Shqip" };

export default function SettingsScreen() {
  const [, setTick] = useState(0);
  const [queue, setQueue] = useState<PendingReport[]>([]);
  const [pushToken, setPushToken] = useState<string | null>(null);

  const reload = async () => {
    setQueue(await listQueue());
    setPushToken(await getStoredToken());
  };

  useEffect(() => {
    reload();
  }, []);

  const onLocale = async (l: Locale) => {
    await setLocale(l);
    setTick((x) => x + 1);
  };

  const sync = async () => {
    const r = await flushQueue();
    Alert.alert("Sync", `Sent ${r.sent}, failed ${r.failed}, remaining ${r.remaining}`);
    reload();
  };

  const drop = async (id: string) => {
    await removeFromQueue(id);
    reload();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.section}>Language</Text>
      <View style={styles.row}>
        {SUPPORTED.map((l) => {
          const active = i18n.locale === l;
          return (
            <TouchableOpacity
              key={l}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => onLocale(l)}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{LANG_NAMES[l]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.section}>Offline queue</Text>
      <View style={styles.card}>
        <Text style={{ marginBottom: 8 }}>
          {queue.length === 0
            ? "No reports waiting."
            : t(queue.length === 1 ? "queue.pending_one" : "queue.pending_other", { count: queue.length })}
        </Text>
        {queue.length > 0 && (
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={sync}>
            <Text style={styles.btnPrimaryText}>{t("queue.syncNow")}</Text>
          </TouchableOpacity>
        )}
        {queue.map((q) => (
          <View key={q.id} style={styles.queueItem}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700" }}>
                {q.payload.latitude.toFixed(4)}, {q.payload.longitude.toFixed(4)}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                {new Date(q.createdAt).toLocaleString()} - attempts: {q.attempts}
              </Text>
              {q.lastError && (
                <Text style={{ color: colors.danger, fontSize: 11 }} numberOfLines={1}>
                  {q.lastError}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={() => drop(q.id)}>
              <Text style={{ color: colors.danger, fontWeight: "700" }}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <Text style={styles.section}>Push notifications</Text>
      <View style={styles.card}>
        <Text style={{ color: colors.muted, fontSize: 12 }}>
          {pushToken ? `Registered: ${pushToken.slice(0, 24)}...` : "Not registered (simulator or denied)"}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: colors.bg },
  section: { fontSize: 13, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 16, marginBottom: 8 },
  row: { flexDirection: "row", flexWrap: "wrap" },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff", marginRight: 8, marginBottom: 8 },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { color: colors.text },
  pillTextActive: { color: "#fff", fontWeight: "700" },
  card: { backgroundColor: "#fff", padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  queueItem: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8 },
  btn: { padding: 12, borderRadius: 10, alignItems: "center", marginBottom: 12 },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryText: { color: "#fff", fontWeight: "700" }
});
