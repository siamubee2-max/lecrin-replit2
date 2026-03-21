/**
 * SnapshotEditor — Mode Snapshot pour la Communauté
 *
 * Permet d'appliquer un cadre stylisé, un effet photo subtil et un décor
 * sur une photo avant publication, sans altérer le look de la tenue.
 *
 * Architecture :
 * - Cadres : overlay SVG/View autour de l'image (Polaroid, Magazine, Luxe, Carte postale, Minimal)
 * - Effets : filtre CSS/style appliqué via opacity + tint layers (Original, Grain, Doré, N&B, Rosé)
 * - Décors : image de fond derrière la photo principale (Studio, Paris, Jardin, Intérieur, Plage)
 */

import React, { useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SnapshotFrame = "none" | "polaroid" | "magazine" | "luxe" | "postcard" | "minimal";
export type SnapshotEffect = "none" | "grain" | "golden" | "bw" | "rose";
export type SnapshotDecor = "none" | "studio" | "paris" | "garden" | "interior" | "beach";

export type SnapshotConfig = {
  frame: SnapshotFrame;
  effect: SnapshotEffect;
  decor: SnapshotDecor;
};

// ─── Données ──────────────────────────────────────────────────────────────────

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK";

const FRAMES: { key: SnapshotFrame; label: string; emoji: string }[] = [
  { key: "none",     label: "Aucun",      emoji: "○" },
  { key: "polaroid", label: "Polaroid",   emoji: "📷" },
  { key: "magazine", label: "Magazine",   emoji: "📰" },
  { key: "luxe",     label: "Luxe",       emoji: "✦" },
  { key: "postcard", label: "Carte",      emoji: "💌" },
  { key: "minimal",  label: "Minimal",    emoji: "▭" },
];

const EFFECTS: { key: SnapshotEffect; label: string; emoji: string }[] = [
  { key: "none",   label: "Original",  emoji: "○" },
  { key: "grain",  label: "Argentique",emoji: "🎞" },
  { key: "golden", label: "Doré",      emoji: "✨" },
  { key: "bw",     label: "N&B Chic",  emoji: "◑" },
  { key: "rose",   label: "Rosé",      emoji: "🌸" },
];

const DECORS: { key: SnapshotDecor; label: string; emoji: string; uri?: string }[] = [
  { key: "none",     label: "Aucun",     emoji: "○" },
  { key: "studio",   label: "Studio",    emoji: "🎬", uri: `${CDN}/mannequin_clothing_1-NMjfajcjDr3xKvyP6m8ScU.png` },
  { key: "paris",    label: "Paris",     emoji: "🗼", uri: `${CDN}/mannequin_clothing_2-ifFLrH5RK6PFETN24qS4uU.png` },
  { key: "garden",   label: "Jardin",    emoji: "🌿", uri: `${CDN}/mannequin_clothing_3-eksVcWTy4WsdKFxTB58UqB.png` },
  { key: "interior", label: "Intérieur", emoji: "🛋",  uri: `${CDN}/mannequin_clothing_5-42iLYadbUPkEQthn5qZ2KU.png` },
  { key: "beach",    label: "Plage",     emoji: "🌊", uri: `${CDN}/mannequin_neutral_1-PedjpBcTeBVGVwLQsDrrd9.png` },
];

// ─── Helpers effets ────────────────────────────────────────────────────────────

/** Retourne les propriétés de style pour l'overlay d'effet */
function getEffectOverlay(effect: SnapshotEffect): {
  color: string;
  opacity: number;
  blendMode?: string;
} | null {
  switch (effect) {
    case "golden":  return { color: "#C9A96E", opacity: 0.22 };
    case "rose":    return { color: "#F4A7B9", opacity: 0.20 };
    case "bw":      return { color: "#000000", opacity: 0.0  }; // handled via grayscale tint
    case "grain":   return { color: "#8B7355", opacity: 0.12 };
    default:        return null;
  }
}

/** Retourne le tint pour l'image (effet N&B simulé via tintColor) */
function getImageTint(effect: SnapshotEffect): string | undefined {
  if (effect === "bw") return "#888888";
  return undefined;
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface SnapshotEditorProps {
  imageUri: string;
  config: SnapshotConfig;
  onChange: (config: SnapshotConfig) => void;
  /** Taille du preview en px */
  previewSize?: number;
}

export function SnapshotEditor({
  imageUri,
  config,
  onChange,
  previewSize = 300,
}: SnapshotEditorProps) {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<"frames" | "effects" | "decors">("frames");

  const tap = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={{ gap: 12 }}>
      {/* ── Preview ── */}
      <SnapshotPreview
        imageUri={imageUri}
        config={config}
        size={previewSize}
        colors={colors}
      />

      {/* ── Onglets ── */}
      <View style={[styles.tabs, { borderColor: colors.border }]}>
        {(["frames", "effects", "decors"] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => { tap(); setActiveTab(tab); }}
            style={[
              styles.tabBtn,
              activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
          >
            <Text style={[styles.tabLabel, { color: activeTab === tab ? colors.foreground : colors.muted }]}>
              {tab === "frames" ? "CADRES" : tab === "effects" ? "EFFETS" : "DÉCORS"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Sélecteur ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
      >
        {activeTab === "frames" && FRAMES.map(f => (
          <TouchableOpacity
            key={f.key}
            onPress={() => { tap(); onChange({ ...config, frame: f.key }); }}
            style={[
              styles.chip,
              {
                backgroundColor: config.frame === f.key ? colors.foreground : colors.surface,
                borderColor: config.frame === f.key ? colors.foreground : colors.border,
              },
            ]}
          >
            <Text style={styles.chipEmoji}>{f.emoji}</Text>
            <Text style={[styles.chipLabel, { color: config.frame === f.key ? colors.background : colors.muted }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}

        {activeTab === "effects" && EFFECTS.map(e => (
          <TouchableOpacity
            key={e.key}
            onPress={() => { tap(); onChange({ ...config, effect: e.key }); }}
            style={[
              styles.chip,
              {
                backgroundColor: config.effect === e.key ? colors.foreground : colors.surface,
                borderColor: config.effect === e.key ? colors.foreground : colors.border,
              },
            ]}
          >
            <Text style={styles.chipEmoji}>{e.emoji}</Text>
            <Text style={[styles.chipLabel, { color: config.effect === e.key ? colors.background : colors.muted }]}>
              {e.label}
            </Text>
          </TouchableOpacity>
        ))}

        {activeTab === "decors" && DECORS.map(d => (
          <TouchableOpacity
            key={d.key}
            onPress={() => { tap(); onChange({ ...config, decor: d.key }); }}
            style={[
              styles.chip,
              {
                backgroundColor: config.decor === d.key ? colors.foreground : colors.surface,
                borderColor: config.decor === d.key ? colors.foreground : colors.border,
              },
            ]}
          >
            <Text style={styles.chipEmoji}>{d.emoji}</Text>
            <Text style={[styles.chipLabel, { color: config.decor === d.key ? colors.background : colors.muted }]}>
              {d.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Preview ──────────────────────────────────────────────────────────────────

interface SnapshotPreviewProps {
  imageUri: string;
  config: SnapshotConfig;
  size: number;
  colors: ReturnType<typeof useColors>;
}

export function SnapshotPreview({ imageUri, config, size, colors }: SnapshotPreviewProps) {
  const { frame, effect, decor } = config;
  const effectOverlay = getEffectOverlay(effect);
  const imageTint = getImageTint(effect);
  const decorData = DECORS.find(d => d.key === decor);

  // Dimensions selon le cadre
  const frameStyles = getFrameStyles(frame, size, colors);

  return (
    <View style={[styles.previewWrapper, { width: size, alignSelf: "center" }]}>
      {/* Conteneur du cadre */}
      <View style={[styles.frameContainer, frameStyles.container]}>

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

          {/* Overlay d'effet couleur */}
          {effectOverlay && (
            <View
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: effectOverlay.color, opacity: effectOverlay.opacity },
              ]}
              pointerEvents="none"
            />
          )}

          {/* Grain argentique : petits points aléatoires simulés via pattern */}
          {effect === "grain" && (
            <View
              style={[StyleSheet.absoluteFillObject, { opacity: 0.08 }]}
              pointerEvents="none"
            >
              {Array.from({ length: 40 }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    position: "absolute",
                    width: 2,
                    height: 2,
                    borderRadius: 1,
                    backgroundColor: "#fff",
                    top: `${(i * 7.3) % 100}%`,
                    left: `${(i * 13.7) % 100}%`,
                    opacity: 0.6 + (i % 3) * 0.1,
                  }}
                />
              ))}
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
            {/* Coins dorés */}
            {[
              { top: 8, left: 8 },
              { top: 8, right: 8 },
              { bottom: 8, left: 8 },
              { bottom: 8, right: 8 },
            ].map((pos, i) => (
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
      </View>
    </View>
  );
}

// ─── Styles de cadres ─────────────────────────────────────────────────────────

function getFrameStyles(frame: SnapshotFrame, size: number, colors: ReturnType<typeof useColors>) {
  const base = {
    container: {
      width: size,
      height: size,
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
          padding: 12,
          paddingBottom: 40,
          borderRadius: 2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.18,
          shadowRadius: 8,
          elevation: 6,
        },
        imageWrapper: {
          width: "100%",
          flex: 1,
          overflow: "hidden",
        },
        polaroidBottom: {
          position: "absolute" as const,
          bottom: 0,
          left: 0,
          right: 0,
          height: 40,
          alignItems: "center" as const,
          justifyContent: "center" as const,
          backgroundColor: "#fff",
        },
      };

    case "magazine":
      return {
        ...base,
        container: {
          ...base.container,
          borderRadius: 0,
          borderWidth: 3,
          borderColor: colors.foreground,
        },
      };

    case "luxe":
      return {
        ...base,
        container: {
          ...base.container,
          borderRadius: 0,
          borderWidth: 1,
          borderColor: "#C9A96E",
        },
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
        container: {
          ...base.container,
          borderRadius: 0,
          padding: 2,
          backgroundColor: colors.foreground,
        },
        imageWrapper: {
          width: "100%",
          flex: 1,
          overflow: "hidden",
        },
      };

    default:
      return base;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  previewWrapper: {
    alignItems: "center",
  },
  frameContainer: {
    overflow: "hidden",
  },
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
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
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
  chipEmoji: {
    fontSize: 14,
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  // Polaroid
  polaroidText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  // Magazine
  magazineTopBand: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  magazineTitle: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 3,
  },
  magazineBottomBand: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  magazineCaption: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
  },
  // Luxe
  luxeCorner: {
    position: "absolute",
    width: 16,
    height: 16,
    borderWidth: 2,
  },
  luxeBottomTag: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 5,
    alignItems: "center",
  },
  luxeTagText: {
    color: "#C9A96E",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
  },
  // Postcard
  postcardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderRadius: 2,
    margin: 4,
  },
  postcardStamp: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  postcardStampText: {
    fontSize: 12,
    fontWeight: "700",
  },
  // Minimal
  minimalBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    margin: 6,
  },
});
