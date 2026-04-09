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

          <Section title="4. Stockage et Traitement des Données">
            <Text className="text-base text-foreground leading-relaxed">
              Vos photos et essayages sont stockés localement sur votre appareil.
              Nous ne transférons pas vos images vers nos serveurs sans votre consentement explicite.
              Les données d{"'"}abonnement sont gérées de manière sécurisée par Apple via StoreKit.{"\n\n"}
              La fonctionnalité AI Stylist analyse votre garde-robe (noms, catégories, couleurs) sur
              nos propres serveurs sécurisés pour générer des suggestions de looks. Ces données
              ne sont jamais partagées avec des fournisseurs d{"'"}intelligence artificielle tiers
              (OpenAI, Google, Anthropic, etc.). Tout le traitement s{"'"}effectue en interne.
            </Text>
          </Section>

          <Section title="5. Partage des Données">
            <Text className="text-base text-foreground leading-relaxed">
              Nous ne vendons, n{"'"}échangeons ni ne louons vos informations personnelles à des tiers.
              Nous ne partageons pas vos données vestimentaires avec des fournisseurs d{"'"}IA externes.
              Nous pouvons partager des données anonymisées et agrégées à des fins d{"'"}analyse
              et d{"'"}amélioration du service.
            </Text>
          </Section>

          <Section title="6. Intelligence Artificielle">
            <Text className="text-base text-foreground leading-relaxed">
              La fonctionnalité {"«"} AI Stylist {"»"} utilise un algorithme développé en interne
              pour analyser vos vêtements et générer des suggestions de looks. Cet algorithme
              fonctionne sur nos serveurs sécurisés et n{"'"}envoie aucune donnée personnelle
              à des fournisseurs d{"'"}intelligence artificielle tiers.{"\n\n"}
              Aucune image, description ou information de votre garde-robe n{"'"}est transmise à
              des services comme OpenAI, Google AI, Anthropic ou tout autre prestataire IA externe.
            </Text>
          </Section>

          <Section title="7. Sécurité">
            <Text className="text-base text-foreground leading-relaxed">
              Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données contre
              tout accès non autorisé, modification, divulgation ou destruction.
            </Text>
          </Section>

          <Section title="8. Vos Droits">
            <Text className="text-base text-foreground leading-relaxed mb-3">
              Conformément au RGPD, vous avez le droit de :
            </Text>
            <BulletPoint text="Accéder à vos données personnelles" />
            <BulletPoint text="Rectifier vos données" />
            <BulletPoint text="Supprimer vos données" />
            <BulletPoint text="Retirer votre consentement à tout moment" />
          </Section>

          <Section title="9. Cookies et Technologies Similaires">
            <Text className="text-base text-foreground leading-relaxed">
              Notre application n{"'"}utilise pas de cookies. Nous utilisons des technologies de stockage local
              standard pour sauvegarder vos préférences sur votre appareil.
            </Text>
          </Section>

          <Section title="10. Modifications">
            <Text className="text-base text-foreground leading-relaxed">
              Nous pouvons mettre à jour cette politique de confidentialité de temps à autre.
              Nous vous informerons de tout changement significatif via l{"'"}application.
            </Text>
          </Section>

          <Section title="11. Contact">
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
