import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, SafeView } from "@/components/common";
import { systemApi } from "@/services/api";
import { useAuthStore } from "@/stores/authStore";
import { COLORS, SPACING } from "@/constants/theme";

export default function HomeScreen() {
  const { user, clear } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [systemMessage, setSystemMessage] = useState<string | null>(null);
  const [systemOpen, setSystemOpen] = useState<boolean | null>(null);

  const loadStatus = async () => {
    try {
      const status = await systemApi.getStatus();
      setSystemOpen(status.status === "open");
      setSystemMessage(status.message);
    } catch (e) {
      setSystemOpen(null);
      setSystemMessage((e as Error).message);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <SafeView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await loadStatus();
              setRefreshing(false);
            }}
            tintColor={COLORS.primary}
          />
        }>
        <View style={styles.header}>
          <Text style={styles.title}>Ready to scan</Text>
          <Text style={styles.subtitle}>
            {user?.full_name ? `Signed in as ${user.full_name}` : "Signed in"}
          </Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>System status</Text>
          <Text style={styles.statusValue}>
            {systemOpen === null ? "Unknown" : systemOpen ? "Open" : "Closed"}
          </Text>
          {!!systemMessage && (
            <Text style={styles.statusMessage}>{systemMessage}</Text>
          )}
        </View>

        <Button
          title="Scan QR"
          size="large"
          onPress={() => router.push("/(auth)/scan")}
        />

        <View style={styles.actions}>
          <Button title="Sign out" variant="outline" onPress={() => clear()} />
        </View>
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.xl, gap: SPACING.lg },
  header: { gap: SPACING.xs },
  title: { fontSize: 32, fontWeight: "700", color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary },
  statusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.xs,
  },
  statusTitle: { fontSize: 14, fontWeight: "600", color: COLORS.textSecondary },
  statusValue: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  statusMessage: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  actions: { marginTop: SPACING.md },
});
