/**
 * SnapshotEditor — Mode Snapshot pour la Communauté
 *
 * Cadres : Aucun, Polaroid, Magazine, Luxe, Carte postale, Minimal, Story 9:16
 * Effets : Original, Argentique, Doré, N&B Chic, Rosé
 * Décors : Aucun, Studio, Paris, Jardin, Intérieur, Plage
 * Texte  : Texte libre + 4 polices + 6 couleurs
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TextInput,
} from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SnapshotFrame =
  | "none"
  | "polaroid"
  | "magazine"
  | "luxe"
  | "postcard"
  | "minimal"
  | "story";

export type SnapshotEffect = "none" | "grain" | "golden" | "bw" | "rose";
export type SnapshotDecor  = "none" | "studio" | "paris" | "garden" | "interior" | "beach";
export type OverlayFont    = "sans" | "serif" | "italic" | "bold";

export type SnapshotConfig = {
  frame:  SnapshotFrame;
  effect: SnapshotEffect;
  decor:  SnapshotDecor;
};

export type SnapshotOverlay = {
  text:  string;
  font:  OverlayFont;
  color: string;
};

// ─── Données ──────────────────────────────────────────────────────────────────

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK";

const FRAMES: { key: SnapshotFrame; label: string; emoji: string }[] = [
  { key: "none",     label: "Aucun",    emoji: "○"  },
  { key: "polaroid", label: "Polaroid", emoji: "📷" },
  { key: "magazine", label: "Magazine", emoji: "📰" },
  { key: "luxe",     label: "Luxe",     emoji: "✦"  },
  { key: "postcard", label: "Carte",    emoji: "💌" },
  { key: "minimal",  label: "Minimal",  emoji: "▭"  },
  { key: "story",    label: "Story",    emoji: "📱" },
];

const EFFECTS: { key: SnapshotEffect; label: string; emoji: string }[] = [
  { key: "none",   label: "Original",   emoji: "○"  },
  { key: "grain",  label: "Argentique", emoji: "🎞" },
  { key: "golden", label: "Doré",       emoji: "✨" },
  { key: "bw",     label: "N&B Chic",   emoji: "◑"  },
  { key: "rose",   label: "Rosé",       emoji: "🌸" },
];

const DECORS: { key: SnapshotDecor; label: string; emoji: string; uri?: string }[] = [
  { key: "none",     label: "Aucun",     emoji: "○"  },
  { key: "studio",   label: "Studio",    emoji: "🎬", uri: `${CDN}/mannequin_clothing_1-NMjfajcjDr3xKvyP6m8ScU.png` },
  { key: "paris",    label: "Paris",     emoji: "🗼", uri: `${CDN}/mannequin_clothing_2-ifFLrH5RK6PFETN24qS4uU.png` },
  { key: "garden",   label: "Jardin",    emoji: "🌿", uri: `${CDN}/mannequin_clothing_3-eksVcWTy4WsdKFxTB58UqB.png` },
  { key: "interior", label: "Intérieur", emoji: "🛋",  uri: `${CDN}/mannequin_clothing_5-42iLYadbUPkEQthn5qZ2KU.png` },
  { key: "beach",    label: "Plage",     emoji: "🌊", uri: `${CDN}/mannequin_neutral_1-PedjpBcTeBVGVwLQsDrrd9.png` },
];

const FONTS: { key: OverlayFont; label: string; style: object }[] = [
  { key: "sans",   label: "Sans",   style: { fontWeight: "400" as const } },
  { key: "bold",   label: "Bold",   style: { fontWeight: "700" as const } },
  { key: "serif",  label: "Serif",  style: { fontFamily: Platform.OS === "ios" ? "Georgia" : "serif" } },
  { key: "italic", label: "Italic", style: { fontStyle: "italic" as const } },
];

const OVERLAY_COLORS = ["#ffffff", "#000000", "#C9A96E", "#F4A7B9", "#4A90D9", "#22C55E"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEffectOverlay(effect: SnapshotEffect): { color: string; opacity: number } | null {
  switch (effect) {
    case "golden": return { color: "#C9A96E", opacity: 0.22 };
    case "rose":   return { color: "#F4A7B9", opacity: 0.20 };
    case "grain":  return { color: "#8B7355", opacity: 0.12 };
    default:       return null;
  }
}

function getImageTint(effect: SnapshotEffect): string | undefined {
  return effect === "bw" ? "#888888" : undefined;
}

function getFontStyle(font: OverlayFont): object {
  return FONTS.find(f => f.key === font)?.style ?? {};
}

// ─── Composant principal ──────────────────────────────────────────────────────

export type SnapshotEditorTab = "frames" | "effects" | "decors" | "text";

interface SnapshotEditorProps {
  imageUri:    string;
  config:      SnapshotConfig;
  overlay:     SnapshotOverlay;
  onChange:    (config: SnapshotConfig) => void;
  onOverlay:   (overlay: SnapshotOverlay) => void;
  previewSize?: number;
}

export function SnapshotEditor({
  imageUri,
  config,
  overlay,
  onChange,
  onOverlay,
  previewSize = 300,
}: SnapshotEditorProps) {
  const colors  = useColors();
  const [tab, setTab] = useState<SnapshotEditorTab>("frames");

  const tap = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Pour le cadre Story, le preview est en 9:16
  const isStory   = config.frame === "story";
  const previewW  = isStory ? Math.round(previewSize * (9 / 16)) : previewSize;
  const previewH  = isStory ? previewSize : previewSize;

  return (
    <View style={{ gap: 12 }}>
      {/* ── Preview ── */}
      <SnapshotPreview
        imageUri={imageUri}
        config={config}
        overlay={overlay}
        width={previewW}
        height={previewH}
        colors={colors}
      />

      {/* ── Onglets ── */}
      <View style={[styles.tabs, { borderColor: colors.border }]}>
        {(["frames", "effects", "decors", "text"] as const).map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => { tap(); setTab(t); }}
            style={[
              styles.tabBtn,
              tab === t && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
          >
            <Text style={[styles.tabLabel, { color: tab === t ? colors.foreground : colors.muted }]}>
              {t === "frames" ? "CADRES" : t === "effects" ? "EFFETS" : t === "decors" ? "DÉCORS" : "TEXTE"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Sélecteurs ── */}
      {tab !== "text" ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
        >
          {tab === "frames" && FRAMES.map(f => (
            <TouchableOpacity
              key={f.key}
              onPress={() => { tap(); onChange({ ...config, frame: f.key }); }}
              style={[styles.chip, {
                backgroundColor: config.frame === f.key ? colors.foreground : colors.surface,
                borderColor:     config.frame === f.key ? colors.foreground : colors.border,
              }]}
            >
              <Text style={styles.chipEmoji}>{f.emoji}</Text>
              <Text style={[styles.chipLabel, { color: config.frame === f.key ? colors.background : colors.muted }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}

          {tab === "effects" && EFFECTS.map(e => (
            <TouchableOpacity
              key={e.key}
              onPress={() => { tap(); onChange({ ...config, effect: e.key }); }}
              style={[styles.chip, {
                backgroundColor: config.effect === e.key ? colors.foreground : colors.surface,
                borderColor:     config.effect === e.key ? colors.foreground : colors.border,
              }]}
            >
              <Text style={styles.chipEmoji}>{e.emoji}</Text>
              <Text style={[styles.chipLabel, { color: config.effect === e.key ? colors.background : colors.muted }]}>
                {e.label}
              </Text>
            </TouchableOpacity>
          ))}

          {tab === "decors" && DECORS.map(d => (
            <TouchableOpacity
              key={d.key}
              onPress={() => { tap(); onChange({ ...config, decor: d.key }); }}
              style={[styles.chip, {
                backgroundColor: config.decor === d.key ? colors.foreground : colors.surface,
                borderColor:     config.decor === d.key ? colors.foreground : colors.border,
              }]}
            >
              <Text style={styles.chipEmoji}>{d.emoji}</Text>
              <Text style={[styles.chipLabel, { color: config.decor === d.key ? colors.background : colors.muted }]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        /* ── Onglet Texte ── */
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {/* Champ texte */}
          <TextInput
            value={overlay.text}
            onChangeText={t => onOverlay({ ...overlay, text: t })}
            placeholder="Nom du bijou, hashtag, citation…"
            placeholderTextColor={colors.muted}
            style={[
              styles.textInput,
              { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground },
            ]}
            maxLength={60}
            returnKeyType="done"
          />

          {/* Polices */}
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>POLICE</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {FONTS.map(f => (
              <TouchableOpacity
                key={f.key}
                onPress={() => { tap(); onOverlay({ ...overlay, font: f.key }); }}
                style={[
                  styles.fontChip,
                  {
                    backgroundColor: overlay.font === f.key ? colors.foreground : colors.surface,
                    borderColor:     overlay.font === f.key ? colors.foreground : colors.border,
                  },
                ]}
              >
                <Text style={[styles.fontChipText, f.style, { color: overlay.font === f.key ? colors.background : colors.foreground }]}>
                  Aa
                </Text>
                <Text style={[styles.fontChipLabel, { color: overlay.font === f.key ? colors.background : colors.muted }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Couleurs */}
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>COULEUR</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {OVERLAY_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => { tap(); onOverlay({ ...overlay, color: c }); }}
                style={[
                  styles.colorDot,
                  { backgroundColor: c, borderColor: overlay.color === c ? colors.primary : colors.border },
                  overlay.color === c && { transform: [{ scale: 1.2 }] },
                ]}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Preview ──────────────────────────────────────────────────────────────────

interface SnapshotPreviewProps {
  imageUri: string;
  config:   SnapshotConfig;
  overlay:  SnapshotOverlay;
  width:    number;
  height:   number;
  colors:   ReturnType<typeof useColors>;
}

export function SnapshotPreview({ imageUri, config, overlay, width, height, colors }: SnapshotPreviewProps) {
  const { frame, effect, decor } = config;
  const effectOverlay = getEffectOverlay(effect);
  const imageTint     = getImageTint(effect);
  const decorData     = DECORS.find(d => d.key === decor);
  const frameStyles   = getFrameStyles(frame, width, height, colors);
  const hasOverlay    = overlay.text.trim().length > 0;

  return (
    <View style={{ alignSelf: "center" }}>
      <View style={frameStyles.container}>

        {/* Décor en fond */}
        {decor !== "none" && decorData?.uri && (
          <Image
            source={{ uri: decorData.uri }}
            style={[StyleSheet.absoluteFillObject, { opacity: 0.35 }]}
            contentFit="cover"
          />
        )}

        {/* Image principale */}
        <View style={frameStyles.imageWrapper}>
          <Image
            source={{ uri: imageUri }}
            style={[{ width: "100%", height: "100%" }, imageTint ? { tintColor: imageTint } : {}]}
            contentFit="cover"
          />

          {/* Overlay couleur effet */}
          {effectOverlay && (
            <View
              style={[StyleSheet.absoluteFillObject, { backgroundColor: effectOverlay.color, opacity: effectOverlay.opacity }]}
              pointerEvents="none"
            />
          )}

          {/* Grain argentique */}
          {effect === "grain" && (
            <View style={[StyleSheet.absoluteFillObject, { opacity: 0.08 }]} pointerEvents="none">
              {Array.from({ length: 40 }).map((_, i) => (
                <View key={i} style={{
                  position: "absolute", width: 2, height: 2, borderRadius: 1,
                  backgroundColor: "#fff",
                  top:  `${(i * 7.3)  % 100}%`,
                  left: `${(i * 13.7) % 100}%`,
                  opacity: 0.6 + (i % 3) * 0.1,
                }} />
              ))}
            </View>
          )}

          {/* Texte overlay */}
          {hasOverlay && (
            <View style={styles.overlayTextContainer} pointerEvents="none">
              <Text
                style={[
                  styles.overlayText,
                  getFontStyle(overlay.font),
                  { color: overlay.color },
                ]}
                numberOfLines={2}
              >
                {overlay.text}
              </Text>
            </View>
          )}
        </View>

        {/* Éléments décoratifs du cadre */}
        {frame === "polaroid" && (
          <View style={frameStyles.polaroidBottom}>
            <Text style={[styles.polaroidText, { color: colors.muted }]}>✦ À DU STYLE ✦</Text>
          </View>
        )}

        {frame === "magazine" && (
          <>
            <View style={[styles.magazineTopBand, { backgroundColor: colors.foreground }]}>
              <Text style={[styles.magazineTitle, { color: colors.background }]}>ÉCRIN VIRTUEL</Text>
            </View>
            <View style={[styles.magazineBottomBand, { backgroundColor: "rgba(0,0,0,0.55)" }]}>
              <Text style={[styles.magazineCaption, { color: "#fff" }]}>LOOK DU JOUR</Text>
            </View>
          </>
        )}

        {frame === "luxe" && (
          <>
            {[{ top: 8, left: 8 }, { top: 8, right: 8 }, { bottom: 8, left: 8 }, { bottom: 8, right: 8 }].map((pos, i) => (
              <View key={i} style={[styles.luxeCorner, pos as any, { borderColor: "#C9A96E" }]} />
            ))}
            <View style={[styles.luxeBottomTag, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
              <Text style={styles.luxeTagText}>✦ ÉCRIN VIRTUEL ✦</Text>
            </View>
          </>
        )}

        {frame === "postcard" && (
          <View style={[styles.postcardBorder, { borderColor: "#fff" }]}>
            <View style={[styles.postcardStamp, { backgroundColor: colors.primary }]}>
              <Text style={[styles.postcardStampText, { color: "#fff" }]}>✦</Text>
            </View>
          </View>
        )}

        {frame === "minimal" && (
          <View style={[styles.minimalBorder, { borderColor: colors.foreground }]} />
        )}

        {/* Story : bandeau bas avec logo Écrin Virtuel */}
        {frame === "story" && (
          <View style={[styles.storyFooter, { backgroundColor: "rgba(0,0,0,0.72)" }]}>
            <Text style={styles.storyLogo}>✦ ÉCRIN VIRTUEL</Text>
            <Text style={styles.storyTagline}>À DU STYLE</Text>
          </View>
        )}
      </View>

      {/* Badge "Story" sous le preview */}
      {frame === "story" && (
        <View style={[styles.storyBadge, { backgroundColor: colors.primary }]}>
          <Text style={[styles.storyBadgeText, { color: colors.background }]}>FORMAT STORY 9:16</Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles de cadres ─────────────────────────────────────────────────────────

function getFrameStyles(
  frame: SnapshotFrame,
  width: number,
  height: number,
  colors: ReturnType<typeof useColors>,
) {
  const base = {
    container: {
      width,
      height,
      borderRadius: 4,
      overflow: "hidden" as const,
      backgroundColor: colors.surface,
    } as any,
    imageWrapper: {
      width: "100%" as const,
      height: "100%" as const,
      overflow: "hidden" as const,
    } as any,
    polaroidBottom: null as any,
  };

  switch (frame) {
    case "polaroid":
      return {
        ...base,
        container: {
          ...base.container,
          backgroundColor: "#fff",
          padding: 10,
          paddingBottom: 36,
          borderRadius: 2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.18,
          shadowRadius: 8,
          elevation: 6,
        },
        imageWrapper: { width: "100%", flex: 1, overflow: "hidden" },
        polaroidBottom: {
          position: "absolute" as const,
          bottom: 0, left: 0, right: 0,
          height: 36,
          alignItems: "center" as const,
          justifyContent: "center" as const,
          backgroundColor: "#fff",
        },
      };

    case "magazine":
      return {
        ...base,
        container: { ...base.container, borderRadius: 0, borderWidth: 3, borderColor: colors.foreground },
      };

    case "luxe":
      return {
        ...base,
        container: { ...base.container, borderRadius: 0, borderWidth: 1, borderColor: "#C9A96E" },
      };

    case "postcard":
      return {
        ...base,
        container: {
          ...base.container,
          borderRadius: 8,
          borderWidth: 6,
          borderColor: "#fff",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 6,
          elevation: 4,
        },
      };

    case "minimal":
      return {
        ...base,
        container: { ...base.container, borderRadius: 0, padding: 2, backgroundColor: colors.foreground },
        imageWrapper: { width: "100%", flex: 1, overflow: "hidden" },
      };

    case "story":
      return {
        ...base,
        container: {
          ...base.container,
          width,
          height,
          borderRadius: 12,
          overflow: "hidden" as const,
          backgroundColor: "#000",
        },
      };

    default:
      return base;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginHorizontal: 16,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipEmoji:  { fontSize: 14 },
  chipLabel:  { fontSize: 11, fontWeight: "600", letterSpacing: 0.5 },
  sectionLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  fontChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 2,
  },
  fontChipText:  { fontSize: 16 },
  fontChipLabel: { fontSize: 9, letterSpacing: 0.5 },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
  // Overlay texte
  overlayTextContainer: {
    position: "absolute",
    bottom: 16,
    left: 12,
    right: 12,
    alignItems: "center",
  },
  overlayText: {
    fontSize: 14,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  // Polaroid
  polaroidText: { fontSize: 9, fontWeight: "700", letterSpacing: 2, fontFamily: Platform.OS === "ios" ? "Georgia" : "serif" },
  // Magazine
  magazineTopBand:   { position: "absolute", top: 0, left: 0, right: 0, paddingVertical: 5, paddingHorizontal: 10, alignItems: "center" },
  magazineTitle:     { fontSize: 10, fontWeight: "900", letterSpacing: 3 },
  magazineBottomBand:{ position: "absolute", bottom: 0, left: 0, right: 0, paddingVertical: 6, paddingHorizontal: 10 },
  magazineCaption:   { fontSize: 11, fontWeight: "700", letterSpacing: 2 },
  // Luxe
  luxeCorner:    { position: "absolute", width: 16, height: 16, borderWidth: 2 },
  luxeBottomTag: { position: "absolute", bottom: 0, left: 0, right: 0, paddingVertical: 5, alignItems: "center" },
  luxeTagText:   { color: "#C9A96E", fontSize: 9, fontWeight: "700", letterSpacing: 2 },
  // Postcard
  postcardBorder:    { ...StyleSheet.absoluteFillObject, borderWidth: 2, borderRadius: 2, margin: 4 },
  postcardStamp:     { position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: 2, alignItems: "center", justifyContent: "center" },
  postcardStampText: { fontSize: 12, fontWeight: "700" },
  // Minimal
  minimalBorder: { ...StyleSheet.absoluteFillObject, borderWidth: 1, margin: 6 },
  // Story
  storyFooter: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 2,
  },
  storyLogo:    { color: "#C9A96E", fontSize: 13, fontWeight: "700", letterSpacing: 3 },
  storyTagline: { color: "rgba(255,255,255,0.7)", fontSize: 9, letterSpacing: 2 },
  storyBadge: {
    alignSelf: "center",
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  storyBadgeText: { fontSize: 9, fontWeight: "700", letterSpacing: 1.5 },
});
