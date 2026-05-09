import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { colors } from "../lib/theme";
import { t } from "../lib/i18n";

type Props = NativeStackScreenProps<RootStackParamList, "Success">;

export default function SuccessScreen({ navigation, route }: Props) {
  const { lat, lng, id, queued } = route.params;
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{queued ? "📥" : "✅"}</Text>
      <Text style={styles.title}>{queued ? t("report.queuedTitle") : t("success.title")}</Text>
      <Text style={styles.subtitle}>{queued ? t("report.queuedBody") : t("success.body")}</Text>
      {!queued && (
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary]}
          onPress={() => navigation.replace("Map", { lat, lng, id })}
        >
          <Text style={styles.btnPrimaryText}>{t("success.seeOnMap")}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[styles.btn, styles.btnGhost]}
        onPress={() => navigation.popToTop()}
      >
        <Text style={styles.btnGhostText}>{t("success.backHome")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: colors.bg },
  icon: { fontSize: 64, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: "800", color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.muted, textAlign: "center", marginBottom: 24 },
  btn: { width: "100%", padding: 16, borderRadius: 12, alignItems: "center", marginVertical: 6 },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  btnGhost: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border },
  btnGhostText: { color: colors.text, fontWeight: "600", fontSize: 16 }
});
