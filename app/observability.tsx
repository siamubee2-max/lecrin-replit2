import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getTryOnObservabilityDashboard, type TryOnObservabilityDashboard } from "@/services/tryon-observability-service";
import { getAbConversionSnapshot } from "@/services/ab-testing-service";

export default function ObservabilityScreen() {
  const colors = useColors();
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState<TryOnObservabilityDashboard | null>(null);
  const [abSnapshot, setAbSnapshot] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, ab] = await Promise.all([
        getTryOnObservabilityDashboard(),
        getAbConversionSnapshot(),
      ]);
      setDashboard(data);
      setAbSnapshot(ab);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScreenContainer containerClassName="bg-background">
      <View className="px-4 py-3 flex-row items-center justify-between border-b border-border">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <IconSymbol name="chevron.left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-foreground ml-2">Observabilite</Text>
        </View>
        <TouchableOpacity
          onPress={load}
          className="px-3 py-1 rounded-full"
          style={{ borderWidth: 1, borderColor: colors.border }}
          disabled={loading}
        >
          <Text className="text-xs text-foreground">{loading ? "..." : "Actualiser"}</Text>
        </TouchableOpacity>
      </View>

      {loading && !dashboard ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 120 }}>
          <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, padding: 12, gap: 6 }}>
            <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "700" }}>Generations IA</Text>
            <Text style={{ color: colors.foreground, fontSize: 12 }}>Total: {dashboard?.totalGenerations ?? 0}</Text>
            <Text style={{ color: colors.foreground, fontSize: 12 }}>Temps moyen: {dashboard?.averageDurationMs ?? 0} ms</Text>
            <Text style={{ color: (dashboard?.overallFailureRate ?? 0) > 0.2 ? colors.error : colors.primary, fontSize: 12, fontWeight: "700" }}>
              Taux d'echec global: {Math.round((dashboard?.overallFailureRate ?? 0) * 100)}%
            </Text>
            {!!dashboard?.lastUpdatedAt && (
              <Text style={{ color: colors.muted, fontSize: 11 }}>Derniere mesure: {new Date(dashboard.lastUpdatedAt).toLocaleString("fr-FR")}</Text>
            )}
          </View>

          <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, padding: 12, gap: 8 }}>
            <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "700" }}>Echec par type d'essayage</Text>
            {(dashboard?.byType ?? []).map((row) => (
              <View key={row.type} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.background, padding: 10, gap: 2 }}>
                <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "700" }}>{row.type}</Text>
                <Text style={{ color: colors.foreground, fontSize: 11 }}>Generations: {row.total}</Text>
                <Text style={{ color: colors.foreground, fontSize: 11 }}>Temps moyen: {row.avgDurationMs} ms</Text>
                <Text style={{ color: row.failureRate > 0.2 ? colors.error : colors.primary, fontSize: 11, fontWeight: "700" }}>
                  Taux d'echec: {Math.round(row.failureRate * 100)}%
                </Text>
              </View>
            ))}
          </View>

          <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, padding: 12, gap: 8 }}>
            <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "700" }}>A/B tests UI (conversions)</Text>
            {Object.keys(abSnapshot).length === 0 ? (
              <Text style={{ color: colors.muted, fontSize: 11 }}>Aucune conversion enregistree pour le moment.</Text>
            ) : (
              Object.entries(abSnapshot).map(([key, value]) => (
                <Text key={key} style={{ color: colors.foreground, fontSize: 11 }}>
                  {key}: {value}
                </Text>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
