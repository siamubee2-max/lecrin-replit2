import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  RefreshControl,
 Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type Application = {
  id: string;
  brandName: string;
  contactName: string;
  email: string;
  websiteUrl?: string | null;
  jewelryTypes?: string | null;
  priceRange?: string | null;
  message?: string | null;
  status?: string | null;
  createdAt: string | Date;
};

export default function AdminCandidaturesScreen() {
  const colors = useColors();
  const router = useRouter();
  const [adminCode, setAdminCode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Query pour lister les candidatures (seulement si authentifié)
  const { data, isLoading, error, refetch } = trpc.partnerApplications.list.useQuery(
    { adminCode },
    { enabled: isAuthenticated }
  );

  // Mutation pour mettre à jour le statut
  const updateStatusMutation = trpc.partnerApplications.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedApp(null);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err) => {
      Alert.alert("Erreur", err.message);
    },
  });

  const handleLogin = () => {
    if (!adminCode.trim()) return;
    setIsAuthenticated(true);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleUpdateStatus = (id: string, status: "approved" | "rejected" | "pending") => {
    const labels = { approved: "Approuver", rejected: "Rejeter", pending: "Remettre en attente" };
    Alert.alert(
      labels[status],
      `Confirmer : ${labels[status].toLowerCase()} cette candidature ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          style: status === "rejected" ? "destructive" : "default",
          onPress: () => updateStatusMutation.mutate({ adminCode, id, status }),
        },
      ]
    );
  };

  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case "approved": return colors.success;
      case "rejected": return colors.error;
      default: return colors.warning;
    }
  };

  const getStatusLabel = (status: string | null | undefined) => {
    switch (status) {
      case "approved": return "✓ Approuvée";
      case "rejected": return "✗ Rejetée";
      default: return "⏳ En attente";
    }
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const applications: Application[] = data?.applications ?? [];
  const pendingCount = applications.filter(a => !a.status || a.status === "pending").length;
  const approvedCount = applications.filter(a => a.status === "approved").length;
  const rejectedCount = applications.filter(a => a.status === "rejected").length;

  // Écran de connexion admin
  if (!isAuthenticated) {
    return (
      <ScreenContainer className="p-6">
        <View style={styles.loginContainer}>
          {/* Header */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color={colors.muted} />
            <Text style={[styles.backText, { color: colors.muted }]}>Retour</Text>
          </TouchableOpacity>

          <View style={styles.loginContent}>
            <Text style={[styles.lockIcon]}>🔐</Text>
            <Text style={[styles.loginTitle, { color: colors.foreground }]}>Espace Admin</Text>
            <Text style={[styles.loginSubtitle, { color: colors.muted }]}>
              Gestion des candidatures partenaires
            </Text>

            <View style={[styles.codeInput, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <TextInput
                value={adminCode}
                onChangeText={setAdminCode}
                placeholder="Code administrateur"
                placeholderTextColor={colors.muted}
                secureTextEntry
                style={[styles.codeInputText, { color: colors.foreground }]}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              style={[styles.loginBtn, { backgroundColor: colors.foreground }]}
              activeOpacity={0.85}
            >
              <Text style={[styles.loginBtnText, { color: colors.background }]}>ACCÉDER</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // Détail d'une candidature
  if (selectedApp) {
    return (
      <ScreenContainer>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <TouchableOpacity onPress={() => setSelectedApp(null)} style={styles.backBtn}>
            <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color={colors.muted} />
            <Text style={[styles.backText, { color: colors.muted }]}>Retour</Text>
          </TouchableOpacity>

          <Text style={[styles.detailTitle, { color: colors.foreground }]}>{selectedApp.brandName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedApp.status) + "22", borderColor: getStatusColor(selectedApp.status) }]}>
            <Text style={[styles.statusBadgeText, { color: getStatusColor(selectedApp.status) }]}>
              {getStatusLabel(selectedApp.status)}
            </Text>
          </View>

          <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <DetailRow label="Contact" value={selectedApp.contactName} colors={colors} />
            <DetailRow label="Email" value={selectedApp.email} colors={colors} />
            {selectedApp.websiteUrl && <DetailRow label="Site web" value={selectedApp.websiteUrl} colors={colors} />}
            {selectedApp.jewelryTypes && <DetailRow label="Types de bijoux" value={selectedApp.jewelryTypes} colors={colors} />}
            {selectedApp.priceRange && <DetailRow label="Gamme de prix" value={selectedApp.priceRange} colors={colors} />}
            {selectedApp.message && <DetailRow label="Message" value={selectedApp.message} colors={colors} multiline />}
            <DetailRow label="Date" value={formatDate(selectedApp.createdAt)} colors={colors} />
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            {selectedApp.status !== "approved" && (
              <TouchableOpacity
                onPress={() => handleUpdateStatus(selectedApp.id, "approved")}
                style={[styles.actionBtn, { backgroundColor: colors.success }]}
                activeOpacity={0.85}
              >
                <Text style={styles.actionBtnText}>✓ Approuver</Text>
              </TouchableOpacity>
            )}
            {selectedApp.status !== "rejected" && (
              <TouchableOpacity
                onPress={() => handleUpdateStatus(selectedApp.id, "rejected")}
                style={[styles.actionBtn, { backgroundColor: colors.error }]}
                activeOpacity={0.85}
              >
                <Text style={styles.actionBtnText}>✗ Rejeter</Text>
              </TouchableOpacity>
            )}
            {selectedApp.status !== "pending" && (
              <TouchableOpacity
                onPress={() => handleUpdateStatus(selectedApp.id, "pending")}
                style={[styles.actionBtn, { backgroundColor: colors.warning }]}
                activeOpacity={0.85}
              >
                <Text style={styles.actionBtnText}>⏳ En attente</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // Liste des candidatures
  return (
    <ScreenContainer>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ padding: 20 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color={colors.muted} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Candidatures Partenaires</Text>
          <TouchableOpacity onPress={() => setIsAuthenticated(false)}>
            <Text style={[styles.logoutText, { color: colors.muted }]}>Déco.</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.warning + "22", borderColor: colors.warning }]}>
            <Text style={[styles.statNum, { color: colors.warning }]}>{pendingCount}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>En attente</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.success + "22", borderColor: colors.success }]}>
            <Text style={[styles.statNum, { color: colors.success }]}>{approvedCount}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Approuvées</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.error + "22", borderColor: colors.error }]}>
            <Text style={[styles.statNum, { color: colors.error }]}>{rejectedCount}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Rejetées</Text>
          </View>
        </View>

        {/* Loading */}
        {isLoading && (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[styles.loadingText, { color: colors.muted }]}>Chargement...</Text>
          </View>
        )}

        {/* Erreur */}
        {error && (
          <View style={[styles.errorBox, { backgroundColor: colors.error + "22", borderColor: colors.error }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>
              {error.message.includes("invalide") ? "Code admin incorrect" : error.message}
            </Text>
            <TouchableOpacity onPress={() => setIsAuthenticated(false)}>
              <Text style={[styles.retryText, { color: colors.primary }]}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Liste vide */}
        {!isLoading && !error && applications.length === 0 && (
          <View style={styles.centered}>
            <Text style={[styles.emptyText, { color: colors.muted }]}>Aucune candidature pour l'instant</Text>
          </View>
        )}

        {/* Candidatures */}
        {applications.map((app) => (
          <TouchableOpacity
            key={app.id}
            onPress={() => setSelectedApp(app)}
            style={[styles.appCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.85}
          >
            <View style={styles.appCardHeader}>
              <Text style={[styles.appBrandName, { color: colors.foreground }]}>{app.brandName}</Text>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(app.status) }]} />
            </View>
            <Text style={[styles.appContact, { color: colors.muted }]}>{app.contactName} · {app.email}</Text>
            {app.priceRange && (
              <Text style={[styles.appMeta, { color: colors.muted }]}>💰 {app.priceRange}</Text>
            )}
            <Text style={[styles.appDate, { color: colors.muted }]}>{formatDate(app.createdAt)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

function DetailRow({ label, value, colors, multiline }: { label: string; value: string; colors: any; multiline?: boolean }) {
  return (
    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.detailLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.foreground }, multiline && styles.detailValueMultiline]} numberOfLines={multiline ? 0 : 2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loginContainer: { flex: 1 },
  loginContent: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  lockIcon: { fontSize: 48 },
  loginTitle: { fontSize: 24, fontWeight: "700", letterSpacing: 2 },
  loginSubtitle: { fontSize: 14, textAlign: "center" },
  codeInput: { width: "100%", borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  codeInputText: { fontSize: 16 },
  loginBtn: { width: "100%", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  loginBtnText: { fontSize: 14, fontWeight: "700", letterSpacing: 2 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  backText: { fontSize: 14 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  logoutText: { fontSize: 13 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: { flex: 1, borderWidth: 1, borderRadius: 10, padding: 12, alignItems: "center" },
  statNum: { fontSize: 24, fontWeight: "700" },
  statLabel: { fontSize: 11, marginTop: 2 },
  centered: { alignItems: "center", paddingVertical: 40, gap: 12 },
  loadingText: { fontSize: 14 },
  errorBox: { borderWidth: 1, borderRadius: 10, padding: 16, alignItems: "center", gap: 8 },
  errorText: { fontSize: 14, textAlign: "center" },
  retryText: { fontSize: 14, fontWeight: "600" },
  emptyText: { fontSize: 15, textAlign: "center" },
  appCard: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 12, gap: 4 },
  appCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  appBrandName: { fontSize: 16, fontWeight: "700", flex: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  appContact: { fontSize: 13 },
  appMeta: { fontSize: 12 },
  appDate: { fontSize: 11, marginTop: 4 },
  detailTitle: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  statusBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, alignSelf: "flex-start", marginBottom: 16 },
  statusBadgeText: { fontSize: 13, fontWeight: "600" },
  detailCard: { borderWidth: 1, borderRadius: 12, marginBottom: 20, overflow: "hidden" },
  detailRow: { flexDirection: "row", padding: 14, borderBottomWidth: 0.5, gap: 12 },
  detailLabel: { fontSize: 13, width: 100, flexShrink: 0 },
  detailValue: { fontSize: 13, flex: 1 },
  detailValueMultiline: { lineHeight: 20 },
  actionRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: "center", minWidth: 100 },
  actionBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
