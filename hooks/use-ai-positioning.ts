/**
 * Hook for AI-powered jewelry positioning
 * 
 * This hook provides functions to analyze images and get intelligent
 * jewelry positioning based on face/body detection.
 */

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";

// Types matching server-side definitions
export interface FaceLandmarks {
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  leftEar: { x: number; y: number };
  rightEar: { x: number; y: number };
  nose: { x: number; y: number };
  mouth: { x: number; y: number };
  chin: { x: number; y: number };
  neckCenter: { x: number; y: number };
  leftWrist?: { x: number; y: number };
  rightWrist?: { x: number; y: number };
  leftAnkle?: { x: number; y: number };
  rightAnkle?: { x: number; y: number };
}

export interface FaceDetectionResult {
  detected: boolean;
  landmarks?: FaceLandmarks;
  faceAngle: number;
  faceScale: number;
  imageWidth: number;
  imageHeight: number;
  confidence: number;
  bodyPartsVisible: {
    face: boolean;
    ears: boolean;
    neck: boolean;
    hands: boolean;
    wrists: boolean;
    ankles: boolean;
  };
}

export interface JewelryPosition {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  visible: boolean;
}

export interface JewelryPositioning {
  earringsLeft?: JewelryPosition;
  earringsRight?: JewelryPosition;
  necklace?: JewelryPosition;
  ring?: JewelryPosition;
  braceletLeft?: JewelryPosition;
  braceletRight?: JewelryPosition;
  ankletLeft?: JewelryPosition;
  ankletRight?: JewelryPosition;
}

export type JewelryType = "necklace" | "earrings" | "ring" | "bracelet" | "anklet";

interface AIPositioningState {
  isAnalyzing: boolean;
  detection: FaceDetectionResult | null;
  positions: JewelryPositioning | null;
  error: string | null;
  imageUrl: string | null;
}

/**
 * Hook for AI-powered jewelry positioning
 */
export function useAIPositioning() {
  const [state, setState] = useState<AIPositioningState>({
    isAnalyzing: false,
    detection: null,
    positions: null,
    error: null,
    imageUrl: null,
  });

  const uploadAndAnalyzeMutation = trpc.ai.uploadAndAnalyze.useMutation();

  /**
   * Analyze an image and get jewelry positioning
   * @param base64Data Base64 encoded image data
   * @param jewelryType Type of jewelry to position
   * @param mimeType Optional MIME type (defaults to image/jpeg)
   */
  const analyzeImage = useCallback(async (
    base64Data: string,
    jewelryType: JewelryType,
    mimeType?: string
  ): Promise<{
    detection: FaceDetectionResult;
    positions: JewelryPositioning;
    imageUrl: string;
  } | null> => {
    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      error: null,
    }));

    try {
      const result = await uploadAndAnalyzeMutation.mutateAsync({
        base64Data,
        mimeType: mimeType || "image/jpeg",
        jewelryType,
      });

      setState({
        isAnalyzing: false,
        detection: result.detection,
        positions: result.positions,
        error: null,
        imageUrl: result.imageUrl,
      });

      return {
        detection: result.detection,
        positions: result.positions,
        imageUrl: result.imageUrl,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Analysis failed";
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage,
      }));
      return null;
    }
  }, [uploadAndAnalyzeMutation]);

  /**
   * Get the primary position for a jewelry type
   * Returns the most relevant position based on jewelry type
   */
  const getPrimaryPosition = useCallback((
    positions: JewelryPositioning | null,
    jewelryType: JewelryType
  ): JewelryPosition | null => {
    if (!positions) return null;

    switch (jewelryType) {
      case "earrings":
        // Return left ear position if available, otherwise right
        return positions.earringsLeft || positions.earringsRight || null;
      case "necklace":
        return positions.necklace || null;
      case "ring":
        return positions.ring || null;
      case "bracelet":
        return positions.braceletRight || positions.braceletLeft || null;
      case "anklet":
        return positions.ankletRight || positions.ankletLeft || null;
      default:
        return null;
    }
  }, []);

  /**
   * Calculate fallback position when AI detection fails
   * Uses default positions based on jewelry type
   */
  const getFallbackPosition = useCallback((jewelryType: JewelryType): JewelryPosition => {
    const defaults: Record<JewelryType, JewelryPosition> = {
      earrings: { x: 25, y: 25, scale: 1, rotation: 0, visible: true },
      necklace: { x: 50, y: 40, scale: 1, rotation: 0, visible: true },
      ring: { x: 75, y: 70, scale: 1, rotation: 0, visible: true },
      bracelet: { x: 80, y: 60, scale: 1, rotation: 0, visible: true },
      anklet: { x: 50, y: 90, scale: 1, rotation: 0, visible: true },
    };
    return defaults[jewelryType];
  }, []);

  /**
   * Reset the analysis state
   */
  const reset = useCallback(() => {
    setState({
      isAnalyzing: false,
      detection: null,
      positions: null,
      error: null,
      imageUrl: null,
    });
  }, []);

  return {
    ...state,
    analyzeImage,
    getPrimaryPosition,
    getFallbackPosition,
    reset,
  };
}

/**
 * Convert percentage position to pixel position
 */
export function percentToPixel(
  percent: number,
  dimension: number
): number {
  return (percent / 100) * dimension;
}

/**
 * Convert pixel position to percentage
 */
export function pixelToPercent(
  pixel: number,
  dimension: number
): number {
  return (pixel / dimension) * 100;
}
