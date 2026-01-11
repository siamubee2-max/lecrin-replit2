import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function TermsScreen() {
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
          Conditions d{"'"}Utilisation
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="py-6">
          <Text className="text-sm text-muted mb-6">
            Dernière mise à jour : Janvier 2025
          </Text>

          <Section title="1. Acceptation des Conditions">
            <Text className="text-base text-foreground leading-relaxed">
              En téléchargeant, installant ou utilisant L{"'"}Écrin Virtuel, vous acceptez d{"'"}être lié par ces
              conditions d{"'"}utilisation. Si vous n{"'"}acceptez pas ces conditions, veuillez ne pas utiliser l{"'"}application.
            </Text>
          </Section>

          <Section title="2. Description du Service">
            <Text className="text-base text-foreground leading-relaxed">
              L{"'"}Écrin Virtuel est une application d{"'"}essayage virtuel de bijoux qui permet aux utilisateurs
              de visualiser des bijoux sur des photos. Le service comprend des fonctionnalités gratuites
              et des fonctionnalités premium accessibles via abonnement.
            </Text>
          </Section>

          <Section title="3. Compte Utilisateur">
            <Text className="text-base text-foreground leading-relaxed">
              L{"'"}utilisation de base de l{"'"}application ne nécessite pas de compte. Pour accéder aux
              fonctionnalités premium, vous devrez souscrire à un abonnement via l{"'"}App Store d{"'"}Apple.
            </Text>
          </Section>

          <Section title="4. Abonnements et Paiements">
            <Text className="text-base text-foreground leading-relaxed mb-3">
              Les abonnements sont gérés via l{"'"}App Store d{"'"}Apple :
            </Text>
            <BulletPoint text="Essentiel : 9,99€/mois - 10 essayages mensuels" />
            <BulletPoint text="Premium : 12,99€/mois - Essayages illimités + garde-robe" />
            <BulletPoint text="Annuel : 100€/an - Toutes les fonctionnalités" />
            <Text className="text-base text-foreground leading-relaxed mt-3">
              Les abonnements se renouvellent automatiquement sauf annulation au moins 24 heures avant
              la fin de la période en cours. Vous pouvez gérer vos abonnements dans les paramètres de votre compte Apple.
            </Text>
          </Section>

          <Section title="5. Propriété Intellectuelle">
            <Text className="text-base text-foreground leading-relaxed">
              L{"'"}application, son contenu, ses fonctionnalités et son design sont la propriété exclusive
              de L{"'"}Écrin Virtuel et sont protégés par les lois sur la propriété intellectuelle.
            </Text>
          </Section>

          <Section title="6. Contenu Utilisateur">
            <Text className="text-base text-foreground leading-relaxed">
              Vous conservez tous les droits sur les photos que vous importez dans l{"'"}application.
              En utilisant notre service, vous nous accordez une licence limitée pour traiter ces images
              uniquement dans le but de fournir les fonctionnalités d{"'"}essayage virtuel.
            </Text>
          </Section>

          <Section title="7. Utilisation Acceptable">
            <Text className="text-base text-foreground leading-relaxed mb-3">
              Vous vous engagez à ne pas :
            </Text>
            <BulletPoint text="Utiliser l'application à des fins illégales" />
            <BulletPoint text="Tenter de contourner les mesures de sécurité" />
            <BulletPoint text="Copier ou redistribuer le contenu de l'application" />
            <BulletPoint text="Utiliser l'application pour harceler ou nuire à autrui" />
          </Section>

          <Section title="8. Limitation de Responsabilité">
            <Text className="text-base text-foreground leading-relaxed">
              L{"'"}application est fournie {'"'}en l{"'"}état{'"'}. Nous ne garantissons pas que le service sera
              ininterrompu ou exempt d{"'"}erreurs. Notre responsabilité est limitée au montant que vous
              avez payé pour l{"'"}utilisation du service au cours des 12 derniers mois.
            </Text>
          </Section>

          <Section title="9. Modifications du Service">
            <Text className="text-base text-foreground leading-relaxed">
              Nous nous réservons le droit de modifier, suspendre ou interrompre tout ou partie du
              service à tout moment, avec ou sans préavis.
            </Text>
          </Section>

          <Section title="10. Résiliation">
            <Text className="text-base text-foreground leading-relaxed">
              Nous pouvons résilier ou suspendre votre accès au service immédiatement, sans préavis,
              si vous violez ces conditions d{"'"}utilisation.
            </Text>
          </Section>

          <Section title="11. Droit Applicable">
            <Text className="text-base text-foreground leading-relaxed">
              Ces conditions sont régies par le droit belge. Tout litige sera soumis à la compétence
              exclusive des tribunaux de Belgique.
            </Text>
          </Section>

          <Section title="12. Contact">
            <Text className="text-base text-foreground leading-relaxed">
              Pour toute question concernant ces conditions, contactez-nous à :{"\n\n"}
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
