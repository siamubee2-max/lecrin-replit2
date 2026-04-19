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
            Dernière mise à jour : Avril 2026
          </Text>

          <Section title="1. Acceptation des Conditions">
            <Text className="text-base text-foreground leading-relaxed">
              En téléchargeant, installant ou utilisant L{"'"}Écrin Virtuel, vous acceptez
              d{"'"}être lié par ces conditions d{"'"}utilisation (EULA). Si vous n{"'"}acceptez
              pas ces conditions, veuillez ne pas utiliser l{"'"}application et la désinstaller
              de votre appareil.
            </Text>
          </Section>

          <Section title="2. Description du Service">
            <Text className="text-base text-foreground leading-relaxed">
              L{"'"}Écrin Virtuel est une application d{"'"}essayage virtuel par intelligence
              artificielle permettant de visualiser des bijoux, vêtements, chaussures et
              accessoires sur des photos. Le service inclut un espace communautaire permettant
              aux utilisateurs de partager leurs essayages, des fonctionnalités gratuites et des
              fonctionnalités premium accessibles via abonnement ou achat de crédits.
            </Text>
          </Section>

          <Section title="3. Compte Utilisateur et Suppression">
            <Text className="text-base text-foreground leading-relaxed">
              L{"'"}utilisation de base peut se faire sans compte. Pour accéder aux fonctionnalités
              premium, à la synchronisation et à la communauté, un compte est nécessaire
              (Sign in with Apple ou email). Vous pouvez supprimer votre compte et toutes les
              données associées à tout moment depuis Réglages → Supprimer mon compte.
              Cette suppression est définitive et irréversible.
            </Text>
          </Section>

          <Section title="4. Abonnements et Paiements">
            <Text className="text-base text-foreground leading-relaxed mb-3">
              Tous les paiements sont gérés via l{"'"}App Store d{"'"}Apple, conformément aux
              tarifs publiés dans App Store Connect. Aucun paiement n{"'"}est traité en dehors
              du système IAP d{"'"}Apple.
            </Text>

            <Text className="text-base font-semibold text-foreground mb-2 mt-2">
              Tarifs standard — Abonnements auto-renouvelables :
            </Text>
            <BulletPoint text="Bijoux (mensuel) : 14,99 €/mois — 100 essayages/mois" />
            <BulletPoint text="Premium (mensuel) : 24,99 €/mois — 150 essayages + styliste IA" />
            <BulletPoint text="Premium (annuel) : 199,99 €/an — mêmes avantages, ~33 % d'économie" />

            <Text className="text-base font-semibold text-foreground mb-2 mt-4">
              Tarifs standard — Packs de crédits (achats uniques, non-renouvelables) :
            </Text>
            <BulletPoint text="Pack 50 crédits : 4,99 €" />
            <BulletPoint text="Pack 100 crédits : 9,99 €" />
            <BulletPoint text="Pack 250 crédits : 19,99 €" />
            <BulletPoint text="Pack 500 crédits : 35,99 €" />

            <Text className="text-base font-semibold text-foreground mb-2 mt-4">
              Offre Fondateur — Réservée aux 500 premiers utilisateurs :
            </Text>
            <Text className="text-base text-foreground leading-relaxed mb-3">
              Pour remercier nos premiers membres, l{"'"}abonnement Premium est proposé à un
              tarif réduit en quantité limitée. Les paliers sont attribués dans l{"'"}ordre
              d{"'"}inscription jusqu{"'"}à épuisement de chaque palier. Une fois les 500 places
              attribuées, seuls les tarifs standard ci-dessus restent disponibles.
            </Text>
            <BulletPoint text="Premium annuel — Fondateur −50 % : 99,99 €/an" />
            <BulletPoint text="Premium annuel — Early Bird −30 % : 139,99 €/an" />
            <BulletPoint text="Premium annuel — Lancement −20 % : 159,99 €/an" />
            <BulletPoint text="Premium annuel — Lancement −10 % : 179,99 €/an" />
            <BulletPoint text="Premium mensuel — Lancement −10 % : 22,99 €/mois" />
            <Text className="text-base text-foreground leading-relaxed mt-3">
              Le tarif Fondateur est verrouillé au moment de l{"'"}achat et reste appliqué tant
              que vous ne résiliez pas votre abonnement. En cas de résiliation puis de
              réabonnement après l{"'"}épuisement des places, le tarif standard s{"'"}appliquera.
              Les paliers Fondateur ne sont pas cumulables avec d{"'"}autres promotions.
            </Text>

            <Text className="text-base font-semibold text-foreground mb-2 mt-4">
              Conditions de renouvellement et de gestion :
            </Text>
            <Text className="text-base text-foreground leading-relaxed">
              Les abonnements se renouvellent automatiquement à chaque période, au tarif en
              vigueur lors de votre souscription, sauf annulation au moins 24 heures avant la
              fin de la période en cours. Le paiement est prélevé sur votre compte Apple à la
              confirmation de l{"'"}achat. Vous pouvez gérer vos abonnements et les annuler à
              tout moment dans Réglages → [Votre nom] → Abonnements. La restauration des
              achats est disponible depuis Paramètres → Restaurer mes achats. Tout solde
              gratuit non utilisé d{"'"}une période d{"'"}essai est perdu lors de la souscription
              à un abonnement payant.
            </Text>
          </Section>

          <Section title="5. Propriété Intellectuelle">
            <Text className="text-base text-foreground leading-relaxed">
              L{"'"}application, son contenu, ses fonctionnalités, son design et ses algorithmes IA
              sont la propriété exclusive d{"'"}Inference Vision et sont protégés par les lois sur la
              propriété intellectuelle. Toute reproduction, modification ou rétro-ingénierie est
              interdite.
            </Text>
          </Section>

          <Section title="6. Contenu Utilisateur (photos importées)">
            <Text className="text-base text-foreground leading-relaxed">
              Vous conservez tous les droits sur les photos que vous importez. En utilisant notre
              service, vous nous accordez une licence limitée, non-exclusive et révocable pour
              traiter ces images exclusivement dans le but de générer des essayages virtuels.
              Vos photos personnelles ne sont jamais partagées publiquement sans votre action
              explicite.
            </Text>
          </Section>

          <Section title="7. Communauté et Contenu Publié (UGC)">
            <Text className="text-base text-foreground leading-relaxed mb-3">
              L{"'"}onglet Communauté permet de publier photos et textes visibles par d{"'"}autres
              utilisateurs. En publiant, vous garantissez détenir les droits sur le contenu partagé
              et acceptez les règles suivantes :
            </Text>
            <Text className="text-base font-semibold text-foreground mb-2 mt-2">
              Tolérance zéro — Contenu strictement interdit :
            </Text>
            <BulletPoint text="Contenu illégal, obscène, pornographique ou à caractère sexuel" />
            <BulletPoint text="Contenu violent, sanguinaire ou incitant à la violence" />
            <BulletPoint text="Discours haineux, racisme, sexisme, homophobie ou discrimination" />
            <BulletPoint text="Harcèlement, menaces, intimidation, cyberbullying" />
            <BulletPoint text="Contenu mettant en scène des mineurs de manière inappropriée" />
            <BulletPoint text="Contenu violant la propriété intellectuelle d'autrui" />
            <BulletPoint text="Spam, publicité non autorisée, liens frauduleux, arnaques" />
            <BulletPoint text="Désinformation sur la santé, la sécurité ou la politique" />
            <BulletPoint text="Usurpation d'identité d'une personne ou d'une marque" />

            <Text className="text-base font-semibold text-foreground mb-2 mt-4">
              Mécanismes de modération (conformité Apple Guideline 1.2 et 5.1.1) :
            </Text>
            <BulletPoint text="Filtrage automatique : chaque publication est analysée avant mise en ligne." />
            <BulletPoint text="Signalement : tout utilisateur peut signaler un post via le menu ⋯ → Signaler." />
            <BulletPoint text="Blocage : tout utilisateur peut bloquer un autre utilisateur — ses publications ne seront plus visibles." />
            <BulletPoint text="Masquage automatique dès 3 signalements en attente de revue humaine." />
            <BulletPoint text="Revue humaine sous 24 heures de tous les signalements reçus." />
            <BulletPoint text="Retrait définitif des contenus violant ces règles et suspension du compte responsable." />

            <Text className="text-base text-foreground leading-relaxed mt-3">
              Nous nous réservons le droit de retirer tout contenu et de suspendre, sans préavis,
              tout compte ne respectant pas ces règles. Les signalements répétés entraînent le
              bannissement permanent.
            </Text>
          </Section>

          <Section title="8. Utilisation Acceptable">
            <Text className="text-base text-foreground leading-relaxed mb-3">
              Vous vous engagez à ne pas :
            </Text>
            <BulletPoint text="Utiliser l'application à des fins illégales ou non autorisées" />
            <BulletPoint text="Tenter de contourner les mesures de sécurité ou les limites techniques" />
            <BulletPoint text="Utiliser un robot, scraper ou tout système automatisé pour accéder au service" />
            <BulletPoint text="Copier, redistribuer ou revendre le contenu de l'application" />
            <BulletPoint text="Utiliser l'application pour harceler, menacer ou nuire à autrui" />
            <BulletPoint text="Créer de faux comptes ou usurper l'identité d'une autre personne" />
            <BulletPoint text="Téléverser des images de personnes sans leur consentement" />
          </Section>

          <Section title="9. Protection des Mineurs">
            <Text className="text-base text-foreground leading-relaxed">
              L{"'"}application est destinée aux utilisateurs de 13 ans et plus. Les mineurs doivent
              utiliser l{"'"}application sous la supervision d{"'"}un parent ou tuteur légal. Toute
              publication, interaction ou signalement impliquant des mineurs de façon inappropriée
              est immédiatement retirée et peut être transmise aux autorités compétentes.
            </Text>
          </Section>

          <Section title="10. Limitation de Responsabilité">
            <Text className="text-base text-foreground leading-relaxed">
              L{"'"}application est fournie {'"'}en l{"'"}état{'"'}. Nous ne garantissons pas que le
              service sera ininterrompu ou exempt d{"'"}erreurs. Les essayages virtuels sont générés
              par intelligence artificielle et peuvent contenir des approximations. Notre
              responsabilité est limitée au montant que vous avez payé pour l{"'"}utilisation du
              service au cours des 12 derniers mois.
            </Text>
          </Section>

          <Section title="11. Modifications du Service et des Conditions">
            <Text className="text-base text-foreground leading-relaxed">
              Nous nous réservons le droit de modifier, suspendre ou interrompre tout ou partie du
              service à tout moment. Les modifications substantielles de ces conditions vous
              seront notifiées dans l{"'"}application avant leur entrée en vigueur.
            </Text>
          </Section>

          <Section title="12. Résiliation">
            <Text className="text-base text-foreground leading-relaxed">
              Nous pouvons résilier ou suspendre votre accès au service immédiatement, sans
              préavis, si vous violez ces conditions d{"'"}utilisation, et notamment les règles de
              publication communautaire.
            </Text>
          </Section>

          <Section title="13. Droit Applicable">
            <Text className="text-base text-foreground leading-relaxed">
              Ces conditions sont régies par le droit belge. Tout litige sera soumis à la
              compétence exclusive des tribunaux de Belgique.
            </Text>
          </Section>

          <Section title="14. Contact">
            <Text className="text-base text-foreground leading-relaxed">
              Pour toute question, signalement urgent ou demande de retrait de contenu,
              contactez-nous à :{"\n\n"}
              Email : inferencevision@inferencevision.store{"\n"}
              Support : https://lecrinvirtuel.com/support{"\n"}
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
