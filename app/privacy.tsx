import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function PrivacyScreen() {
  const router = useRouter();
  const colors = useColors();

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} className="bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground ml-2">
          Politique de Confidentialité
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="py-6">
          <Text className="text-sm text-muted mb-6">
            Dernière mise à jour : Avril 2026
          </Text>

          <Section title="1. Introduction">
            <Text className="text-base text-foreground leading-relaxed">
              L{"'"}Écrin Virtuel ({'"'}nous{'"'}, {'"'}notre{'"'}, {'"'}nos{'"'}) s{"'"}engage à protéger la confidentialité de ses utilisateurs.
              Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations
              personnelles lorsque vous utilisez notre application mobile.
            </Text>
          </Section>

          <Section title="2. Données Collectées">
            <Text className="text-base text-foreground leading-relaxed mb-3">
              Nous collectons les types de données suivants :
            </Text>
            <BulletPoint text="Photos que vous importez pour les essayages virtuels (stockées localement sur votre appareil)" />
            <BulletPoint text="Préférences d'application (langue, notifications)" />
            <BulletPoint text="Informations d'achat pour les abonnements (gérées par Apple)" />
            <BulletPoint text="Données d'utilisation anonymisées pour améliorer l'application" />
            <BulletPoint text="Données de transcription vocale envoyées à un service de traitement audio tiers" />
          </Section>

          <Section title="3. Utilisation des Données">
            <Text className="text-base text-foreground leading-relaxed mb-3">
              Vos données sont utilisées pour :
            </Text>
            <BulletPoint text="Fournir les fonctionnalités d'essayage virtuel" />
            <BulletPoint text="Sauvegarder vos préférences" />
            <BulletPoint text="Gérer votre abonnement" />
            <BulletPoint text="Améliorer nos services" />
          </Section>

          <Section title="4. Stockage des Données">
            <Text className="text-base text-foreground leading-relaxed">
              Vos photos et essayages sont stockés localement sur votre appareil.
              Nous ne transférons pas vos images vers nos serveurs sans votre consentement explicite.
              Les données d{"'"}abonnement sont gérées de manière sécurisée par Apple via StoreKit.
            </Text>
          </Section>

          <Section title="5. Partage des Données et Services Tiers">
            <Text className="text-base text-foreground leading-relaxed mb-3">
              Nous ne vendons, n{"'"}échangeons ni ne louons vos informations personnelles à des tiers.
              Toutefois, nous faisons appel aux services tiers suivants pour fournir les fonctionnalités
              de l{"'"}application :
            </Text>
          </Section>

          <Section title="5.1 Intelligence Artificielle et Traitement d'Images">
            <Text className="text-base text-foreground leading-relaxed mb-3">
              Pour fournir les fonctionnalités d{"'"}essayage virtuel et de conseil en style, nous utilisons
              des services d{"'"}intelligence artificielle fournis par des tiers. Les images que vous soumettez
              pour l{"'"}essayage virtuel peuvent être transmises à ces services pour traitement.
            </Text>
            <BulletPoint text="Traitement d'images et génération de visuels d'essayage via des fournisseurs d'IA" />
            <BulletPoint text="Transcription vocale via un service de reconnaissance audio tiers" />
            <BulletPoint text="Analyse et conseil en style via des modèles de langage" />
            <Text className="text-base text-foreground leading-relaxed mt-3">
              Ces fournisseurs sont soumis à des accords de confidentialité et de protection des données.
              Les images transmises sont utilisées uniquement pour générer votre résultat d{"'"}essayage
              et ne sont pas conservées par les fournisseurs tiers au-delà du traitement nécessaire.
            </Text>
          </Section>

          <Section title="5.2 Analyse et Statistiques">
            <Text className="text-base text-foreground leading-relaxed mb-3">
              Nous utilisons des services d{"'"}analyse pour comprendre comment l{"'"}application est utilisée
              et améliorer votre expérience :
            </Text>
            <BulletPoint text="PostHog : collecte de données d'utilisation anonymisées (événements, navigation)" />
            <BulletPoint text="Mixpanel : analyse des parcours utilisateurs et statistiques d'engagement" />
            <BulletPoint text="Sentry : collecte de rapports d'erreurs pour améliorer la stabilité" />
            <Text className="text-base text-foreground leading-relaxed mt-3">
              Ces services ne collectent pas d{"'"}informations personnelles identifiables. Les données
              sont traitées sur des serveurs sécurisés situés dans l{"'"}Union Européenne.
            </Text>
          </Section>

          <Section title="6. Sécurité">
            <Text className="text-base text-foreground leading-relaxed">
              Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données contre
              tout accès non autorisé, modification, divulgation ou destruction.
            </Text>
          </Section>

          <Section title="7. Vos Droits">
            <Text className="text-base text-foreground leading-relaxed mb-3">
              Conformément au RGPD, vous avez le droit de :
            </Text>
            <BulletPoint text="Accéder à vos données personnelles" />
            <BulletPoint text="Rectifier vos données" />
            <BulletPoint text="Supprimer vos données" />
            <BulletPoint text="Retirer votre consentement à tout moment" />
          </Section>

          <Section title="8. Cookies et Technologies Similaires">
            <Text className="text-base text-foreground leading-relaxed">
              Notre application n{"'"}utilise pas de cookies. Nous utilisons des technologies de stockage local
              standard pour sauvegarder vos préférences sur votre appareil.
            </Text>
          </Section>

          <Section title="9. Modifications">
            <Text className="text-base text-foreground leading-relaxed">
              Nous pouvons mettre à jour cette politique de confidentialité de temps à autre.
              Nous vous informerons de tout changement significatif via l{"'"}application.
            </Text>
          </Section>

          <Section title="10. Contact">
            <Text className="text-base text-foreground leading-relaxed">
              Pour toute question concernant cette politique de confidentialité, contactez-nous à :{"\n\n"}
              Email : inferencevision@inferencevision.store{"\n"}
              Adresse : Rue des corvées 7, 7040 Genly, Belgium
            </Text>
          </Section>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <Text className="text-lg font-bold text-foreground mb-3">{title}</Text>
      {children}
    </View>
  );
}

function BulletPoint({ text }: { text: string }) {
  const colors = useColors();
  return (
    <View className="flex-row mb-2">
      <Text className="text-base mr-2" style={{ color: colors.primary }}>•</Text>
      <Text className="text-base text-foreground flex-1 leading-relaxed">{text}</Text>
    </View>
  );
}
