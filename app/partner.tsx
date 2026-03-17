import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const JEWELRY_TYPES = [
  "Boucles d'oreilles",
  "Colliers & Pendentifs",
  "Bagues",
  "Bracelets",
  "Chevillières",
  "Montres",
  "Bijoux de corps",
  "Autre",
];

const PRICE_RANGES = [
  "< 50 €",
  "50 – 150 €",
  "150 – 500 €",
  "500 – 1 000 €",
  "> 1 000 €",
];

export default function PartnerScreen() {
  const colors = useColors();

  const [brandName, setBrandName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleType = (type: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const submitMutation = trpc.partnerApplications.submit.useMutation();

  const handleSubmit = async () => {
    if (!brandName.trim() || !email.trim() || !contactName.trim()) {
      Alert.alert("Champs requis", "Veuillez renseigner le nom de la marque, votre nom et votre e-mail.");
      return;
    }
    if (selectedTypes.length === 0) {
      Alert.alert("Type de bijoux", "Veuillez sélectionner au moins un type de bijoux.");
      return;
    }

    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);

    try {
      const websiteValue = website.trim() || instagram.trim() ? (website.trim() || instagram.trim()) : undefined;
      await submitMutation.mutateAsync({
        brandName: brandName.trim(),
        contactName: contactName.trim(),
        email: email.trim(),
        websiteUrl: websiteValue,
        jewelryTypes: selectedTypes.join(", "),
        priceRange: selectedPriceRange || undefined,
        message: description.trim() || undefined,
      });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
    } catch (e) {
      Alert.alert("Erreur", "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <ScreenContainer>
        <View style={[styles.successContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.successIcon, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
            <IconSymbol name="checkmark" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>
            Candidature envoyée
          </Text>
          <Text style={[styles.successSubtitle, { color: colors.muted }]}>
            Merci pour votre intérêt. Notre équipe étudiera votre dossier et vous contactera sous 5 à 7 jours ouvrés.
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.primary }]} />
          <Text style={[styles.successNote, { color: colors.muted }]}>
            Un e-mail de confirmation a été envoyé à{"\n"}
            <Text style={{ color: colors.foreground }}>{email}</Text>
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.foreground }]}
          >
            <Text style={[styles.backBtnText, { color: colors.background }]}>
              Retour à l'application
            </Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 60 }}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.headerBack, { backgroundColor: colors.surface }]}
            >
              <IconSymbol name="chevron.left" size={18} color={colors.foreground} />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={[styles.headerEyebrow, { color: colors.primary }]}>
                L'ÉCRIN VIRTUEL
              </Text>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                Devenir Partenaire
              </Text>
            </View>
            <View style={{ width: 36 }} />
          </View>

          {/* Hero */}
          <View style={[styles.hero, { backgroundColor: colors.surface }]}>
            <View style={[styles.heroBadge, { borderColor: colors.primary }]}>
              <Text style={[styles.heroBadgeText, { color: colors.primary }]}>
                PROGRAMME PARTENAIRES
              </Text>
            </View>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>
              Présentez vos créations{"\n"}à notre communauté
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.muted }]}>
              Rejoignez L'Écrin Virtuel et offrez à vos clients une expérience d'essayage unique grâce à la réalité augmentée.
            </Text>
          </View>

          {/* Benefits */}
          <View style={styles.benefitsRow}>
            {[
              { icon: "sparkles", label: "Essayage IA" },
              { icon: "person.2.fill", label: "Communauté" },
              { icon: "diamond.fill", label: "Visibilité" },
            ].map((b) => (
              <View key={b.label} style={[styles.benefitCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <IconSymbol name={b.icon as any} size={22} color={colors.primary} />
                <Text style={[styles.benefitLabel, { color: colors.muted }]}>{b.label}</Text>
              </View>
            ))}
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Section: Marque */}
            <Text style={[styles.sectionLabel, { color: colors.primary }]}>
              VOTRE MARQUE
            </Text>

            <View style={[styles.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>Nom de la marque *</Text>
              <TextInput
                value={brandName}
                onChangeText={setBrandName}
                placeholder="ex: Moniattitude"
                placeholderTextColor={colors.border}
                style={[styles.input, { color: colors.foreground }]}
              />
            </View>

            <View style={[styles.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>Site web</Text>
              <TextInput
                value={website}
                onChangeText={setWebsite}
                placeholder="https://votremarque.com"
                placeholderTextColor={colors.border}
                style={[styles.input, { color: colors.foreground }]}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            <View style={[styles.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>Instagram</Text>
              <TextInput
                value={instagram}
                onChangeText={setInstagram}
                placeholder="@votremarque"
                placeholderTextColor={colors.border}
                style={[styles.input, { color: colors.foreground }]}
                autoCapitalize="none"
              />
            </View>

            <View style={[styles.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border, minHeight: 100 }]}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>Description de la marque</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Décrivez votre univers, votre histoire, vos valeurs…"
                placeholderTextColor={colors.border}
                style={[styles.input, { color: colors.foreground, minHeight: 70, textAlignVertical: "top" }]}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Section: Types de bijoux */}
            <Text style={[styles.sectionLabel, { color: colors.primary, marginTop: 24 }]}>
              TYPES DE BIJOUX *
            </Text>
            <View style={styles.chipsGrid}>
              {JEWELRY_TYPES.map(type => {
                const isSelected = selectedTypes.includes(type);
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => toggleType(type)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? colors.foreground : colors.surface,
                        borderColor: isSelected ? colors.foreground : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: isSelected ? colors.background : colors.muted }]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Section: Gamme de prix */}
            <Text style={[styles.sectionLabel, { color: colors.primary, marginTop: 24 }]}>
              GAMME DE PRIX
            </Text>
            <View style={styles.chipsGrid}>
              {PRICE_RANGES.map(range => {
                const isSelected = selectedPriceRange === range;
                return (
                  <TouchableOpacity
                    key={range}
                    onPress={() => {
                      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedPriceRange(range);
                    }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? colors.foreground : colors.surface,
                        borderColor: isSelected ? colors.foreground : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: isSelected ? colors.background : colors.muted }]}>
                      {range}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Section: Contact */}
            <Text style={[styles.sectionLabel, { color: colors.primary, marginTop: 24 }]}>
              CONTACT
            </Text>

            <View style={[styles.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>Nom & Prénom *</Text>
              <TextInput
                value={contactName}
                onChangeText={setContactName}
                placeholder="Votre nom complet"
                placeholderTextColor={colors.border}
                style={[styles.input, { color: colors.foreground }]}
              />
            </View>

            <View style={[styles.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>E-mail *</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="contact@votremarque.com"
                placeholderTextColor={colors.border}
                style={[styles.input, { color: colors.foreground }]}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={[styles.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>Téléphone</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+33 6 00 00 00 00"
                placeholderTextColor={colors.border}
                style={[styles.input, { color: colors.foreground }]}
                keyboardType="phone-pad"
              />
            </View>

            {/* Submit */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[
                styles.submitBtn,
                {
                  backgroundColor: isSubmitting ? colors.border : colors.foreground,
                  opacity: isSubmitting ? 0.7 : 1,
                },
              ]}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator size="small" color={colors.background} />
                  <Text style={[styles.submitBtnText, { color: colors.background }]}>
                    Envoi en cours…
                  </Text>
                </>
              ) : (
                <>
                  <IconSymbol name="paperplane.fill" size={16} color={colors.background} />
                  <Text style={[styles.submitBtnText, { color: colors.background }]}>
                    Envoyer ma candidature
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={[styles.disclaimer, { color: colors.muted }]}>
              En soumettant ce formulaire, vous acceptez que vos données soient utilisées pour traiter votre candidature. Nous ne partageons jamais vos informations avec des tiers.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerEyebrow: {
    fontSize: 9,
    letterSpacing: 3,
    fontWeight: "600",
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  hero: {
    padding: 28,
    alignItems: "center",
    gap: 12,
  },
  heroBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  heroBadgeText: {
    fontSize: 9,
    letterSpacing: 3,
    fontWeight: "700",
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
    lineHeight: 32,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 300,
  },
  benefitsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginVertical: 20,
  },
  benefitCard: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 0.5,
  },
  benefitLabel: {
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "600",
  },
  form: {
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: "700",
    marginBottom: 12,
  },
  inputGroup: {
    borderRadius: 12,
    borderWidth: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    fontSize: 15,
    fontWeight: "400",
    padding: 0,
  },
  chipsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    borderRadius: 20,
    borderWidth: 0.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 14,
    marginTop: 32,
    marginBottom: 16,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  disclaimer: {
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginBottom: 20,
  },
  // Success screen
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 12,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
    maxWidth: 300,
  },
  divider: {
    width: 40,
    height: 1,
    marginBottom: 24,
  },
  successNote: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 40,
  },
  backBtn: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
});
