import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { QRCameraView } from "@/components/scanner/QRCameraView";
import { SafeView } from "@/components/common";
import { COLORS, SPACING } from "@/constants/theme";
import { authApi } from "@/services/api";
import { useAuthStore } from "@/stores/authStore";
import { useScanHistoryStore } from "@/stores/scanHistoryStore";
import { getUserFriendlyError } from "@/utils/errors";
import { extractQrToken } from "@/utils/qr";

export default function ScanScreen() {
  const { authKey } = useAuthStore();
  const { addEntry } = useScanHistoryStore();
  const [loading, setLoading] = useState(false);

  const handleScan = async (data: string) => {
    const qrToken = extractQrToken(data);
    if (!qrToken) {
      Alert.alert("Invalid QR", "That QR code is not recognized.");
      return;
    }
    if (!authKey) {
      Alert.alert("Not linked", "Please link your account first.");
      router.replace("/(onboarding)/link-account");
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.scanQRCode(qrToken, authKey);
      if (!result.success) {
        const message = getUserFriendlyError(result.error || "Unable to scan QR.");
        await addEntry({
          serviceName: null,
          outcome: "failure",
          detail: result.error || "UNKNOWN",
        });
        Alert.alert("Scan failed", message);
        return;
      }

      await addEntry({
        serviceName: result.service_name ?? null,
        outcome: "success",
      });

      router.push({
        pathname: "/(auth)/result",
        params: {
          pin: result.pin,
          expiresIn: String(result.expires_in ?? 300),
          serviceName: result.service_name ?? "",
        },
      });
    } catch (e) {
      const message = getUserFriendlyError((e as Error).message);
      await addEntry({
        serviceName: null,
        outcome: "failure",
        detail: (e as Error).message || "UNKNOWN",
      });
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan QR</Text>
        <Text style={styles.subtitle}>
          Point your camera at the code on the login screen.
        </Text>
      </View>

      <View style={styles.cameraWrap}>
        <QRCameraView
          onScan={handleScan}
          onCancel={() => router.back()}
          disabled={loading}
        />
        {loading && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>Processing…</Text>
          </View>
        )}
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SPACING.xl, paddingBottom: SPACING.md, gap: SPACING.xs },
  title: { fontSize: 24, fontWeight: "700", color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary },
  cameraWrap: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  loadingText: { color: COLORS.text, fontSize: 16, fontWeight: "600" },
});

