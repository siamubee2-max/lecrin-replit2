-- ═══════════════════════════════════════════════════════════════════════════
-- Table : launch_offer_claims
-- But   : Comptabiliser les souscriptions promo de lancement par cohorte
--         pour la stratégie d'early adopter d'Écrin Virtuel.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.launch_offer_claims (
  id          BIGSERIAL PRIMARY KEY,
  client_id   TEXT        NOT NULL,                        -- ID client unique (généré côté app)
  campaign_key TEXT       NOT NULL CHECK (campaign_key IN (
    'yearly_50_first_100',    -- Fondateur  : −50% annuel · 1 000 essayages/an
    'yearly_30_next_100',     -- Early Bird : −30% annuel · 1 000 essayages/an
    'yearly_20_next_100',     -- Lancement  : −20% annuel · 1 000 essayages/an
    'yearly_10_next_100',     -- Spécial    : −10% annuel + mensuel
    'monthly_10_next_100'     -- Mensuel    : −10% mensuel uniquement
  )),
  claimed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent  TEXT,                                        -- pour debug/analytics
  ip_hash     TEXT                                         -- hash IP pour détecter les abus (pas l'IP brute)
);

-- Index pour requêtes fréquentes
CREATE UNIQUE INDEX IF NOT EXISTS idx_launch_offer_claims_client_id
  ON public.launch_offer_claims (client_id);

CREATE INDEX IF NOT EXISTS idx_launch_offer_claims_campaign_key
  ON public.launch_offer_claims (campaign_key);

-- ─── Row Level Security ─────────────────────────────────────────────────────
-- On veut que la table soit accessible par le service role (backend) uniquement.
-- Le frontend ne doit jamais y accéder directement.

ALTER TABLE public.launch_offer_claims ENABLE ROW LEVEL SECURITY;

-- Seul le service role peut lire/écrire (backend only via SUPABASE_SERVICE_KEY)
CREATE POLICY "service_role_only" ON public.launch_offer_claims
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ─── Vue utilitaire : compteurs par campagne ────────────────────────────────
CREATE OR REPLACE VIEW public.launch_offer_stats AS
SELECT
  campaign_key,
  COUNT(*) AS claimed,
  CASE campaign_key
    WHEN 'yearly_50_first_100' THEN 100
    WHEN 'yearly_30_next_100'  THEN 100
    WHEN 'yearly_20_next_100'  THEN 100
    WHEN 'yearly_10_next_100'  THEN 100
    WHEN 'monthly_10_next_100' THEN 100
  END AS quota,
  CASE campaign_key
    WHEN 'yearly_50_first_100' THEN 100
    WHEN 'yearly_30_next_100'  THEN 100
    WHEN 'yearly_20_next_100'  THEN 100
    WHEN 'yearly_10_next_100'  THEN 100
    WHEN 'monthly_10_next_100' THEN 100
  END - COUNT(*) AS remaining
FROM public.launch_offer_claims
GROUP BY campaign_key;

-- ─── Commentaires ───────────────────────────────────────────────────────────
COMMENT ON TABLE public.launch_offer_claims IS
  'Suivi des claims d''offres de lancement Écrin Virtuel. '
  '500 places max au total réparties en 5 cohortes de 100.';

COMMENT ON COLUMN public.launch_offer_claims.client_id IS
  'ID unique généré côté app (préfixe lc_). Permet l''idempotence des claims.';

COMMENT ON COLUMN public.launch_offer_claims.campaign_key IS
  'Identifiant de la campagne : yearly_50_first_100 > yearly_30_next_100 > '
  'yearly_20_next_100 > yearly_10_next_100 > monthly_10_next_100';
