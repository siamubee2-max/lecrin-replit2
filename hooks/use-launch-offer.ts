import { useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";
import {
  trackLaunchOfferCampaignSeen,
  trackLaunchOfferClaimed,
  trackLaunchOfferExhausted,
} from "@/lib/analytics";

const LAUNCH_CLIENT_ID_KEY = "launch_offer_client_id_v2";

// ─── Types des campagnes (doit correspondre exactement à server/monetization.ts)
export type LaunchOfferCampaignKey =
  | "yearly_50_first_100"    // −50% annuel  · 1 000 essayages
  | "yearly_30_next_100"     // −30% annuel  · 1 000 essayages
  | "yearly_20_next_100"     // −20% annuel  · 1 000 essayages
  | "yearly_10_next_100"     // −10% annuel+mensuel · 1 500 essayages
  | "monthly_10_next_100";   // −10% mensuel uniquement

function generateClientId(): string {
  return `lc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function useLaunchOffer(enabled: boolean, source: string = "paywall") {
  const [clientId, setClientId] = useState<string | null>(null);
  const lastSeenCampaignRef = useRef<LaunchOfferCampaignKey | null>(null);
  const exhaustedTrackedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    if (!enabled) return;

    (async () => {
      try {
        const existing = await AsyncStorage.getItem(LAUNCH_CLIENT_ID_KEY);
        if (existing) {
          if (mounted) setClientId(existing);
          return;
        }
        const created = generateClientId();
        await AsyncStorage.setItem(LAUNCH_CLIENT_ID_KEY, created);
        if (mounted) setClientId(created);
      } catch {
        if (mounted) setClientId(generateClientId());
      }
    })();

    return () => {
      mounted = false;
    };
  }, [enabled]);

  const statusQuery = trpc.monetization.getLaunchOfferStatus.useQuery(
    clientId ? { clientId } : undefined,
    { enabled: enabled && Boolean(clientId), staleTime: 20_000 },
  );

  const claimMutation = trpc.monetization.claimLaunchOffer.useMutation();

  const activeCampaign = useMemo<LaunchOfferCampaignKey | null>(() => {
    if (!statusQuery.data) return null;
    const claim = statusQuery.data.existingClaimCampaignKey;
    return (claim ?? statusQuery.data.activeCampaignKey) as LaunchOfferCampaignKey | null;
  }, [statusQuery.data]);

  // Infos enrichies de la campagne active (remaining spots, prices, etc.)
  // On utilise activeCampaignKey pour éviter les problèmes d'inférence TypeScript
  const activeCampaignInfo = useMemo(() => {
    const key = (statusQuery.data as any)?.activeCampaignKey as string | null;
    if (!key) return null;
    return (statusQuery.data as any)?.activeCampaign ?? null;
  }, [statusQuery.data]);

  const hasOffer = Boolean(activeCampaign);

  useEffect(() => {
    if (!enabled || !statusQuery.data) return;

    if (activeCampaign) {
      exhaustedTrackedRef.current = false;
      if (lastSeenCampaignRef.current !== activeCampaign) {
        const current = statusQuery.data.campaigns.find((c) => c.campaignKey === activeCampaign);
        trackLaunchOfferCampaignSeen({
          campaignKey: activeCampaign,
          remaining: current?.remaining,
          source,
        });
        lastSeenCampaignRef.current = activeCampaign;
      }
      return;
    }

    if (!exhaustedTrackedRef.current) {
      trackLaunchOfferExhausted({ source });
      exhaustedTrackedRef.current = true;
    }
  }, [activeCampaign, enabled, source, statusQuery.data]);

  const claimCurrentOffer = async (): Promise<LaunchOfferCampaignKey | null> => {
    if (!clientId) return activeCampaign;
    const result = await claimMutation.mutateAsync({ clientId });
    if (!result.success) return null;
    trackLaunchOfferClaimed({
      campaignKey: result.campaignKey as LaunchOfferCampaignKey,
      source,
    });
    await statusQuery.refetch();
    return result.campaignKey as LaunchOfferCampaignKey | null;
  };

  return {
    clientId,
    isLoading: statusQuery.isLoading || claimMutation.isPending || !clientId,
    campaigns: statusQuery.data?.campaigns ?? [],
    activeCampaign,
    activeCampaignInfo,
    hasOffer,
    claimCurrentOffer,
    remainingSpots: activeCampaignInfo?.remaining ?? null,
  };
}
