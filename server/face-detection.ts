/**
 * Face Detection Service using LLM Vision
 * 
 * This service analyzes images to detect facial landmarks and body parts
 * for intelligent jewelry positioning.
 */

import { invokeLLM } from "./_core/llm";
import { supabaseStoragePut } from "./_core/supabaseStorage";

// Types for face detection results
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
  faceAngle: number; // Head tilt angle in degrees (-45 to 45)
  faceScale: number; // Relative face size (0.1 to 1.0)
  imageWidth: number;
  imageHeight: number;
  confidence: number; // 0 to 1
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
  x: number; // Percentage from left (0-100)
  y: number; // Percentage from top (0-100)
  scale: number; // Scale factor (0.5-2.0)
  rotation: number; // Rotation in degrees
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

/**
 * Upload base64 image to S3 and get public URL
 */
export async function uploadImageForAnalysis(
  base64Data: string,
  mimeType: string = "image/jpeg"
): Promise<string> {
  // Remove data URL prefix if present
  const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Content, "base64");
  
  // Generate unique filename
  const timestamp = Date.now();
  const extension = mimeType.split("/")[1] || "jpg";
  const filename = `face-analysis/${timestamp}.${extension}`;
  
  const result = await supabaseStoragePut(filename, buffer, mimeType);
  return result.url;
}

/**
 * Analyze image using LLM Vision to detect face landmarks
 */
export async function detectFaceLandmarks(imageUrl: string): Promise<FaceDetectionResult> {
  const systemPrompt = `You are a computer vision expert specialized in detecting facial landmarks and body parts in images.
Analyze the provided image and return a JSON object with the following structure:

{
  "detected": boolean, // true if a face or relevant body part is detected
  "imageWidth": number, // estimated image width in pixels (assume 1000 if unknown)
  "imageHeight": number, // estimated image height in pixels (assume 1000 if unknown)
  "faceAngle": number, // head tilt angle in degrees (-45 to 45, 0 = straight)
  "faceScale": number, // relative face size (0.1 = far, 1.0 = close-up)
  "confidence": number, // detection confidence (0 to 1)
  "bodyPartsVisible": {
    "face": boolean,
    "ears": boolean, // at least one ear visible
    "neck": boolean,
    "hands": boolean,
    "wrists": boolean,
    "ankles": boolean
  },
  "landmarks": {
    "leftEye": { "x": number, "y": number }, // coordinates as percentage (0-100)
    "rightEye": { "x": number, "y": number },
    "leftEar": { "x": number, "y": number }, // position for earring
    "rightEar": { "x": number, "y": number },
    "nose": { "x": number, "y": number },
    "mouth": { "x": number, "y": number },
    "chin": { "x": number, "y": number },
    "neckCenter": { "x": number, "y": number }, // center of neck for necklace
    "leftWrist": { "x": number, "y": number }, // if visible
    "rightWrist": { "x": number, "y": number }, // if visible
    "leftAnkle": { "x": number, "y": number }, // if visible
    "rightAnkle": { "x": number, "y": number } // if visible
  }
}

Important:
- All x/y coordinates should be percentages (0-100) relative to image dimensions
- x=0 is left edge, x=100 is right edge
- y=0 is top edge, y=100 is bottom edge
- If a body part is not visible, set its coordinates to { "x": -1, "y": -1 }
- For ears, position should be at the earlobe where an earring would hang
- For neck, position should be at the base of the neck where a necklace would rest
- Be precise with the faceAngle - positive values mean head tilted to the right`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: "Analyze this image and detect facial landmarks for jewelry positioning." },
          { type: "image_url", image_url: { url: imageUrl, detail: "high" } }
        ]
      }
    ],
    response_format: { type: "json_object" }
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("No response from LLM");
  }

  try {
    const result = JSON.parse(content) as FaceDetectionResult;
    return result;
  } catch (error) {
    console.error("Failed to parse LLM response:", content);
    throw new Error("Failed to parse face detection result");
  }
}

/**
 * Calculate optimal jewelry positions based on detected landmarks
 */
export function calculateJewelryPositions(
  detection: FaceDetectionResult,
  jewelryType: "necklace" | "earrings" | "ring" | "bracelet" | "anklet"
): JewelryPositioning {
  const positions: JewelryPositioning = {};
  
  if (!detection.detected || !detection.landmarks) {
    return positions;
  }

  const { landmarks, faceAngle, faceScale } = detection;
  const baseScale = Math.max(0.5, Math.min(2.0, faceScale * 1.2));

  switch (jewelryType) {
    case "earrings":
      // Position earrings at ear locations
      if (detection.bodyPartsVisible.ears) {
        if (landmarks.leftEar.x >= 0) {
          positions.earringsLeft = {
            x: landmarks.leftEar.x,
            y: landmarks.leftEar.y + 2, // Slightly below ear
            scale: baseScale * 0.8,
            rotation: faceAngle * 0.5, // Half the head tilt
            visible: true
          };
        }
        if (landmarks.rightEar.x >= 0) {
          positions.earringsRight = {
            x: landmarks.rightEar.x,
            y: landmarks.rightEar.y + 2,
            scale: baseScale * 0.8,
            rotation: faceAngle * 0.5,
            visible: true
          };
        }
      }
      break;

    case "necklace":
      // Position necklace at neck center
      if (detection.bodyPartsVisible.neck && landmarks.neckCenter.x >= 0) {
        positions.necklace = {
          x: landmarks.neckCenter.x,
          y: landmarks.neckCenter.y,
          scale: baseScale,
          rotation: faceAngle * 0.3, // Subtle rotation
          visible: true
        };
      } else if (landmarks.chin.x >= 0) {
        // Fallback: position below chin
        positions.necklace = {
          x: landmarks.chin.x,
          y: Math.min(100, landmarks.chin.y + 10),
          scale: baseScale,
          rotation: faceAngle * 0.3,
          visible: true
        };
      }
      break;

    case "ring":
      // Position ring on hand if visible
      if (detection.bodyPartsVisible.hands) {
        // Default to right hand
        const handX = landmarks.rightWrist?.x ?? 75;
        const handY = landmarks.rightWrist?.y ?? 70;
        positions.ring = {
          x: handX,
          y: handY - 5, // Above wrist
          scale: baseScale * 0.6,
          rotation: 0,
          visible: landmarks.rightWrist?.x !== undefined && landmarks.rightWrist.x >= 0
        };
      }
      break;

    case "bracelet":
      // Position bracelets at wrists
      if (detection.bodyPartsVisible.wrists) {
        if (landmarks.leftWrist && landmarks.leftWrist.x >= 0) {
          positions.braceletLeft = {
            x: landmarks.leftWrist.x,
            y: landmarks.leftWrist.y,
            scale: baseScale * 0.7,
            rotation: 0,
            visible: true
          };
        }
        if (landmarks.rightWrist && landmarks.rightWrist.x >= 0) {
          positions.braceletRight = {
            x: landmarks.rightWrist.x,
            y: landmarks.rightWrist.y,
            scale: baseScale * 0.7,
            rotation: 0,
            visible: true
          };
        }
      }
      break;

    case "anklet":
      // Position anklets at ankles
      if (detection.bodyPartsVisible.ankles) {
        if (landmarks.leftAnkle && landmarks.leftAnkle.x >= 0) {
          positions.ankletLeft = {
            x: landmarks.leftAnkle.x,
            y: landmarks.leftAnkle.y,
            scale: baseScale * 0.6,
            rotation: 0,
            visible: true
          };
        }
        if (landmarks.rightAnkle && landmarks.rightAnkle.x >= 0) {
          positions.ankletRight = {
            x: landmarks.rightAnkle.x,
            y: landmarks.rightAnkle.y,
            scale: baseScale * 0.6,
            rotation: 0,
            visible: true
          };
        }
      }
      break;
  }

  return positions;
}

/**
 * Full analysis: detect landmarks and calculate positions for a jewelry type
 */
export async function analyzeImageForJewelry(
  imageUrl: string,
  jewelryType: "necklace" | "earrings" | "ring" | "bracelet" | "anklet"
): Promise<{
  detection: FaceDetectionResult;
  positions: JewelryPositioning;
}> {
  const detection = await detectFaceLandmarks(imageUrl);
  const positions = calculateJewelryPositions(detection, jewelryType);
  
  return { detection, positions };
}
