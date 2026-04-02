import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

// ─── Définition des campagnes de lancement ────────────────────────────────────
// Chaque campagne est épuisée quand son quota de souscripteurs premium est atteint.
// Les campagnes sont évaluées dans l'ordre (la première disponible gagne).

export type CampaignKey =
  | "yearly_50_first_100"   // 1–100  : −50% sur annuel  → 99,99 €/an  — 1 000 essayages
  | "yearly_30_next_100"    // 101–200: −30% sur annuel  → 139,99 €/an — 1 000 essayages
  | "yearly_20_next_100"    // 201–300: −20% sur annuel  → 159,99 €/an — 1 000 essayages
  | "yearly_10_next_100"    // 301–400: −10% sur annuel ou mensuel → 179,99 €/an
  | "monthly_10_next_100";  // 401–500: −10% mensuel uniquement → 22,49 €/mois

type CampaignConfig = {
  key: CampaignKey;
  quota: number;           // nombre de places disponibles
  discountPct: number;     // réduction en %
  yearlyPrice: string;     // prix affiché annuel (ou null si mensuel seulement)
  monthlyPrice: string;    // prix affiché mensuel
  forYearly: boolean;      // offre valable sur l'annuel
  forMonthly: boolean;     // offre valable sur le mensuel
  tryOnsPerYear: number;   // essayages inclus/an
  label: string;           // libellé marketing court
  founderNote: string;     // note détaillée pour le paywall
};

export const CAMPAIGNS: CampaignConfig[] = [
  {
    key: "yearly_50_first_100",
    quota: 100,
    discountPct: 50,
    yearlyPrice: "99,99 €",
    monthlyPrice: "24,99 €",
    forYearly: true,
    forMonthly: false,
    tryOnsPerYear: 1000,
    label: "🏅 Offre Fondateur — −50% annuel (100 places)",
    founderNote: "1 000 essayages/an · Prix garanti à vie · Accès prioritaire aux nouvelles fonctionnalités",
  },
  {
    key: "yearly_30_next_100",
    quota: 100,
    discountPct: 30,
    yearlyPrice: "139,99 €",
    monthlyPrice: "24,99 €",
    forYearly: true,
    forMonthly: false,
    tryOnsPerYear: 1000,
    label: "✨ Lancement Early Bird — −30% annuel (100 places)",
    founderNote: "1 000 essayages/an · Prix tarif lancement garanti pendant 12 mois",
  },
  {
    key: "yearly_20_next_100",
    quota: 100,
    discountPct: 20,
    yearlyPrice: "159,99 €",
    monthlyPrice: "24,99 €",
    forYearly: true,
    forMonthly: false,
    tryOnsPerYear: 1000,
    label: "🎁 Lancement — −20% annuel (100 places)",
    founderNote: "1 000 essayages/an · Offre de lancement limitée",
  },
  {
    key: "yearly_10_next_100",
    quota: 100,
    discountPct: 10,
    yearlyPrice: "179,99 €",
    monthlyPrice: "22,49 €",
    forYearly: true,
    forMonthly: true,
    tryOnsPerYear: 1500,
    label: "💫 Offre Spéciale — −10% annuel ou mensuel (100 places)",
    founderNote: "1 500 essayages/an · Disponible sur l'annuel et le mensuel",
  },
  {
    key: "monthly_10_next_100",
    quota: 100,
    discountPct: 10,
    yearlyPrice: "199,99 €",
    monthlyPrice: "22,49 €",
    forYearly: false,
    forMonthly: true,
    tryOnsPerYear: 1500,
    label: "🌟 Offre Mensuel — −10% mensuel uniquement (100 places)",
    founderNote: "Tarif préférentiel sur le mensuel uniquement",
  },
];

// ─── Clé Supabase pour le compteur global (table launch_offers) ───────────────
const LAUNCH_OFFER_CLAIM_TABLE = "launch_offer_claims";

async function getSupabase() {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key) throw new Error("[Monetization] Supabase env vars not set");
  return createClient(url, key);
}

// Récupère le nombre de claims par campagne depuis Supabase
async function getCampaignCounts(): Promise<Record<CampaignKey, number>> {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from(LAUNCH_OFFER_CLAIM_TABLE)
      .select("campaign_key");

    if (error) {
      console.warn("[Monetization] Error fetching claims:", error.message);
      return Object.fromEntries(CAMPAIGNS.map((c) => [c.key, 0])) as Record<CampaignKey, number>;
    }

    const counts = Object.fromEntries(CAMPAIGNS.map((c) => [c.key, 0])) as Record<CampaignKey, number>;
    for (const row of (data ?? [])) {
      const k = row.campaign_key as CampaignKey;
      if (counts[k] !== undefined) counts[k]++;
    }
    return counts;
  } catch (err) {
    console.warn("[Monetization] getCampaignCounts failed:", err);
    return Object.fromEntries(CAMPAIGNS.map((c) => [c.key, 0])) as Record<CampaignKey, number>;
  }
}

// Détermine la campagne active (la première avec des places disponibles)
function getActiveCampaign(counts: Record<CampaignKey, number>): CampaignConfig | null {
  for (const campaign of CAMPAIGNS) {
    if (counts[campaign.key] < campaign.quota) {
      return campaign;
    }
  }
  return null; // toutes les offres épuisées
}

// ─── Router tRPC monetization ────────────────────────────────────────────────

export const monetizationRouter = router({
  /**
   * Retourne l'état actuel des offres de lancement.
   * Utilisé par le paywall pour afficher la bonne offre et le décompte de places.
   */
  getLaunchOfferStatus: publicProcedure
    .input(
      z
        .object({ clientId: z.string().optional() })
        .optional()
    )
    .query(async ({ input }) => {
      const counts = await getCampaignCounts();
      const active = getActiveCampaign(counts);

      // Vérifie si ce clientId a déjà un claim
      let existingClaimCampaignKey: string | null = null;
      if (input?.clientId) {
        try {
          const supabase = await getSupabase();
          const { data } = await supabase
            .from(LAUNCH_OFFER_CLAIM_TABLE)
            .select("campaign_key")
            .eq("client_id", input.clientId)
            .maybeSingle();
          existingClaimCampaignKey = data?.campaign_key ?? null;
        } catch {
          // ignore
        }
      }

      return {
        activeCampaignKey: active?.key ?? null,
        activeCampaign: active
          ? {
              key: active.key,
              discountPct: active.discountPct,
              yearlyPrice: active.yearlyPrice,
              monthlyPrice: active.monthlyPrice,
              forYearly: active.forYearly,
              forMonthly: active.forMonthly,
              tryOnsPerYear: active.tryOnsPerYear,
              label: active.label,
              founderNote: active.founderNote,
              remaining: active.quota - counts[active.key],
              quota: active.quota,
            }
          : null,
        existingClaimCampaignKey,
        campaigns: CAMPAIGNS.map((c) => ({
          campaignKey: c.key,
          quota: c.quota,
          claimed: counts[c.key],
          remaining: Math.max(0, c.quota - counts[c.key]),
          label: c.label,
          discountPct: c.discountPct,
          forYearly: c.forYearly,
          forMonthly: c.forMonthly,
          tryOnsPerYear: c.tryOnsPerYear,
        })),
        totalClaimed: Object.values(counts).reduce((a, b) => a + b, 0),
        allExhausted: !active,
      };
    }),

  /**
   * Enregistre un claim de l'offre active pour un clientId donné.
   * Idempotent : si le clientId a déjà un claim, retourne ce claim.
   * Thread-safe via upsert Supabase.
   */
  claimLaunchOffer: publicProcedure
    .input(z.object({ clientId: z.string().min(1).max(128) }))
    .mutation(async ({ input }) => {
      try {
        const supabase = await getSupabase();

        // 1. Vérification d'un claim existant pour ce clientId
        const { data: existing } = await supabase
          .from(LAUNCH_OFFER_CLAIM_TABLE)
          .select("campaign_key")
          .eq("client_id", input.clientId)
          .maybeSingle();

        if (existing?.campaign_key) {
          return {
            success: true,
            campaignKey: existing.campaign_key,
            alreadyClaimed: true,
          };
        }

        // 2. Déterminer la campagne active
        const counts = await getCampaignCounts();
        const active = getActiveCampaign(counts);

        if (!active) {
          return { success: false, campaignKey: null, reason: "all_exhausted", alreadyClaimed: false };
        }

        // 3. Vérifier qu'il reste des places (double-check pour éviter les races)
        if (counts[active.key] >= active.quota) {
          return { success: false, campaignKey: null, reason: "quota_reached", alreadyClaimed: false };
        }

        // 4. Insérer le claim
        const { error } = await supabase
          .from(LAUNCH_OFFER_CLAIM_TABLE)
          .insert({
            client_id: input.clientId,
            campaign_key: active.key,
            claimed_at: new Date().toISOString(),
          });

        if (error) {
          // Possible race condition : duplicate client_id — récupérer le claim existant
          if (error.code === "23505") {
            const { data: retry } = await supabase
              .from(LAUNCH_OFFER_CLAIM_TABLE)
              .select("campaign_key")
              .eq("client_id", input.clientId)
              .maybeSingle();
            return {
              success: true,
              campaignKey: retry?.campaign_key ?? active.key,
              alreadyClaimed: true,
            };
          }
          console.warn("[Monetization] Insert claim error:", error.message);
          return { success: false, campaignKey: null, reason: "db_error", alreadyClaimed: false };
        }

        console.log(`[Monetization] ✅ Claim enregistré — clientId=${input.clientId} campaign=${active.key}`);
        return {
          success: true,
          campaignKey: active.key,
          alreadyClaimed: false,
        };
      } catch (err) {
        console.error("[Monetization] claimLaunchOffer exception:", err);
        return { success: false, campaignKey: null, reason: "exception", alreadyClaimed: false };
      }
    }),

  /**
   * Retourne la config complète d'une campagne spécifique.
   * Utilisé pour afficher les détails d'une offre dans le paywall.
   */
  getCampaignConfig: publicProcedure
    .input(z.object({ campaignKey: z.string() }))
    .query(({ input }) => {
      const campaign = CAMPAIGNS.find((c) => c.key === input.campaignKey);
      return campaign ?? null;
    }),
});
