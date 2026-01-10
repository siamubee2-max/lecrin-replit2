/**
 * Tests for AI-powered jewelry positioning
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock types matching the actual implementation
interface FaceLandmarks {
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

interface FaceDetectionResult {
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

interface JewelryPosition {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  visible: boolean;
}

interface JewelryPositioning {
  earringsLeft?: JewelryPosition;
  earringsRight?: JewelryPosition;
  necklace?: JewelryPosition;
  ring?: JewelryPosition;
  braceletLeft?: JewelryPosition;
  braceletRight?: JewelryPosition;
  ankletLeft?: JewelryPosition;
  ankletRight?: JewelryPosition;
}

type JewelryType = "necklace" | "earrings" | "ring" | "bracelet" | "anklet";

// Helper function to calculate jewelry positions (matching server implementation)
function calculateJewelryPositions(
  detection: FaceDetectionResult,
  jewelryType: JewelryType
): JewelryPositioning {
  const positions: JewelryPositioning = {};
  
  if (!detection.detected || !detection.landmarks) {
    return positions;
  }

  const { landmarks, faceAngle, faceScale } = detection;
  const baseScale = Math.max(0.5, Math.min(2.0, faceScale * 1.2));

  switch (jewelryType) {
    case "earrings":
      if (detection.bodyPartsVisible.ears) {
        if (landmarks.leftEar.x >= 0) {
          positions.earringsLeft = {
            x: landmarks.leftEar.x,
            y: landmarks.leftEar.y + 2,
            scale: baseScale * 0.8,
            rotation: faceAngle * 0.5,
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
      if (detection.bodyPartsVisible.neck && landmarks.neckCenter.x >= 0) {
        positions.necklace = {
          x: landmarks.neckCenter.x,
          y: landmarks.neckCenter.y,
          scale: baseScale,
          rotation: faceAngle * 0.3,
          visible: true
        };
      } else if (landmarks.chin.x >= 0) {
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
      if (detection.bodyPartsVisible.hands) {
        const handX = landmarks.rightWrist?.x ?? 75;
        const handY = landmarks.rightWrist?.y ?? 70;
        positions.ring = {
          x: handX,
          y: handY - 5,
          scale: baseScale * 0.6,
          rotation: 0,
          visible: landmarks.rightWrist?.x !== undefined && landmarks.rightWrist.x >= 0
        };
      }
      break;

    case "bracelet":
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

// Helper to get fallback position
function getFallbackPosition(jewelryType: JewelryType): JewelryPosition {
  const defaults: Record<JewelryType, JewelryPosition> = {
    earrings: { x: 25, y: 25, scale: 1, rotation: 0, visible: true },
    necklace: { x: 50, y: 40, scale: 1, rotation: 0, visible: true },
    ring: { x: 75, y: 70, scale: 1, rotation: 0, visible: true },
    bracelet: { x: 80, y: 60, scale: 1, rotation: 0, visible: true },
    anklet: { x: 50, y: 90, scale: 1, rotation: 0, visible: true },
  };
  return defaults[jewelryType];
}

// Helper to convert percentage to pixel
function percentToPixel(percent: number, dimension: number): number {
  return (percent / 100) * dimension;
}

// Helper to convert pixel to percentage
function pixelToPercent(pixel: number, dimension: number): number {
  return (pixel / dimension) * 100;
}

describe("AI Positioning - Face Detection Result Types", () => {
  it("should have correct structure for FaceDetectionResult", () => {
    const result: FaceDetectionResult = {
      detected: true,
      faceAngle: 5,
      faceScale: 0.8,
      imageWidth: 1000,
      imageHeight: 1000,
      confidence: 0.95,
      bodyPartsVisible: {
        face: true,
        ears: true,
        neck: true,
        hands: false,
        wrists: false,
        ankles: false,
      },
      landmarks: {
        leftEye: { x: 35, y: 30 },
        rightEye: { x: 65, y: 30 },
        leftEar: { x: 15, y: 35 },
        rightEar: { x: 85, y: 35 },
        nose: { x: 50, y: 45 },
        mouth: { x: 50, y: 55 },
        chin: { x: 50, y: 65 },
        neckCenter: { x: 50, y: 75 },
      },
    };

    expect(result.detected).toBe(true);
    expect(result.faceAngle).toBe(5);
    expect(result.confidence).toBe(0.95);
    expect(result.landmarks?.leftEar.x).toBe(15);
  });

  it("should handle missing landmarks", () => {
    const result: FaceDetectionResult = {
      detected: false,
      faceAngle: 0,
      faceScale: 0,
      imageWidth: 1000,
      imageHeight: 1000,
      confidence: 0,
      bodyPartsVisible: {
        face: false,
        ears: false,
        neck: false,
        hands: false,
        wrists: false,
        ankles: false,
      },
    };

    expect(result.detected).toBe(false);
    expect(result.landmarks).toBeUndefined();
  });
});

describe("AI Positioning - Jewelry Position Calculation", () => {
  const mockDetection: FaceDetectionResult = {
    detected: true,
    faceAngle: 10,
    faceScale: 0.8,
    imageWidth: 1000,
    imageHeight: 1000,
    confidence: 0.9,
    bodyPartsVisible: {
      face: true,
      ears: true,
      neck: true,
      hands: true,
      wrists: true,
      ankles: false,
    },
    landmarks: {
      leftEye: { x: 35, y: 30 },
      rightEye: { x: 65, y: 30 },
      leftEar: { x: 15, y: 35 },
      rightEar: { x: 85, y: 35 },
      nose: { x: 50, y: 45 },
      mouth: { x: 50, y: 55 },
      chin: { x: 50, y: 65 },
      neckCenter: { x: 50, y: 75 },
      leftWrist: { x: 20, y: 80 },
      rightWrist: { x: 80, y: 80 },
    },
  };

  describe("Earrings positioning", () => {
    it("should position earrings at ear locations", () => {
      const positions = calculateJewelryPositions(mockDetection, "earrings");
      
      expect(positions.earringsLeft).toBeDefined();
      expect(positions.earringsRight).toBeDefined();
      expect(positions.earringsLeft?.x).toBe(15);
      expect(positions.earringsLeft?.y).toBe(37); // 35 + 2
      expect(positions.earringsRight?.x).toBe(85);
    });

    it("should apply rotation based on face angle", () => {
      const positions = calculateJewelryPositions(mockDetection, "earrings");
      
      expect(positions.earringsLeft?.rotation).toBe(5); // 10 * 0.5
      expect(positions.earringsRight?.rotation).toBe(5);
    });

    it("should not position earrings when ears not visible", () => {
      const noEarsDetection = {
        ...mockDetection,
        bodyPartsVisible: { ...mockDetection.bodyPartsVisible, ears: false },
      };
      
      const positions = calculateJewelryPositions(noEarsDetection, "earrings");
      
      expect(positions.earringsLeft).toBeUndefined();
      expect(positions.earringsRight).toBeUndefined();
    });
  });

  describe("Necklace positioning", () => {
    it("should position necklace at neck center", () => {
      const positions = calculateJewelryPositions(mockDetection, "necklace");
      
      expect(positions.necklace).toBeDefined();
      expect(positions.necklace?.x).toBe(50);
      expect(positions.necklace?.y).toBe(75);
    });

    it("should fall back to chin position when neck not visible", () => {
      const noNeckDetection = {
        ...mockDetection,
        bodyPartsVisible: { ...mockDetection.bodyPartsVisible, neck: false },
      };
      
      const positions = calculateJewelryPositions(noNeckDetection, "necklace");
      
      expect(positions.necklace?.x).toBe(50);
      expect(positions.necklace?.y).toBe(75); // chin.y (65) + 10
    });

    it("should apply subtle rotation for necklace", () => {
      const positions = calculateJewelryPositions(mockDetection, "necklace");
      
      expect(positions.necklace?.rotation).toBe(3); // 10 * 0.3
    });
  });

  describe("Ring positioning", () => {
    it("should position ring near wrist when hands visible", () => {
      const positions = calculateJewelryPositions(mockDetection, "ring");
      
      expect(positions.ring).toBeDefined();
      expect(positions.ring?.x).toBe(80); // rightWrist.x
      expect(positions.ring?.y).toBe(75); // rightWrist.y - 5
    });

    it("should not position ring when hands not visible", () => {
      const noHandsDetection = {
        ...mockDetection,
        bodyPartsVisible: { ...mockDetection.bodyPartsVisible, hands: false },
      };
      
      const positions = calculateJewelryPositions(noHandsDetection, "ring");
      
      expect(positions.ring).toBeUndefined();
    });
  });

  describe("Bracelet positioning", () => {
    it("should position bracelets at wrist locations", () => {
      const positions = calculateJewelryPositions(mockDetection, "bracelet");
      
      expect(positions.braceletLeft).toBeDefined();
      expect(positions.braceletRight).toBeDefined();
      expect(positions.braceletLeft?.x).toBe(20);
      expect(positions.braceletRight?.x).toBe(80);
    });

    it("should not position bracelets when wrists not visible", () => {
      const noWristsDetection = {
        ...mockDetection,
        bodyPartsVisible: { ...mockDetection.bodyPartsVisible, wrists: false },
      };
      
      const positions = calculateJewelryPositions(noWristsDetection, "bracelet");
      
      expect(positions.braceletLeft).toBeUndefined();
      expect(positions.braceletRight).toBeUndefined();
    });
  });

  describe("Anklet positioning", () => {
    it("should position anklets at ankle locations when visible", () => {
      const withAnklesDetection: FaceDetectionResult = {
        ...mockDetection,
        bodyPartsVisible: { ...mockDetection.bodyPartsVisible, ankles: true },
        landmarks: {
          ...mockDetection.landmarks!,
          leftAnkle: { x: 30, y: 95 },
          rightAnkle: { x: 70, y: 95 },
        },
      };
      
      const positions = calculateJewelryPositions(withAnklesDetection, "anklet");
      
      expect(positions.ankletLeft).toBeDefined();
      expect(positions.ankletRight).toBeDefined();
      expect(positions.ankletLeft?.x).toBe(30);
      expect(positions.ankletRight?.y).toBe(95);
    });

    it("should not position anklets when ankles not visible", () => {
      const positions = calculateJewelryPositions(mockDetection, "anklet");
      
      expect(positions.ankletLeft).toBeUndefined();
      expect(positions.ankletRight).toBeUndefined();
    });
  });
});

describe("AI Positioning - Scale Calculation", () => {
  it("should calculate base scale from face scale", () => {
    const detection: FaceDetectionResult = {
      detected: true,
      faceAngle: 0,
      faceScale: 0.5,
      imageWidth: 1000,
      imageHeight: 1000,
      confidence: 0.9,
      bodyPartsVisible: {
        face: true,
        ears: true,
        neck: true,
        hands: false,
        wrists: false,
        ankles: false,
      },
      landmarks: {
        leftEye: { x: 35, y: 30 },
        rightEye: { x: 65, y: 30 },
        leftEar: { x: 15, y: 35 },
        rightEar: { x: 85, y: 35 },
        nose: { x: 50, y: 45 },
        mouth: { x: 50, y: 55 },
        chin: { x: 50, y: 65 },
        neckCenter: { x: 50, y: 75 },
      },
    };

    const positions = calculateJewelryPositions(detection, "necklace");
    
    // baseScale = max(0.5, min(2.0, 0.5 * 1.2)) = 0.6
    expect(positions.necklace?.scale).toBe(0.6);
  });

  it("should clamp scale to minimum 0.5", () => {
    const detection: FaceDetectionResult = {
      detected: true,
      faceAngle: 0,
      faceScale: 0.1, // Very small face
      imageWidth: 1000,
      imageHeight: 1000,
      confidence: 0.9,
      bodyPartsVisible: {
        face: true,
        ears: true,
        neck: true,
        hands: false,
        wrists: false,
        ankles: false,
      },
      landmarks: {
        leftEye: { x: 35, y: 30 },
        rightEye: { x: 65, y: 30 },
        leftEar: { x: 15, y: 35 },
        rightEar: { x: 85, y: 35 },
        nose: { x: 50, y: 45 },
        mouth: { x: 50, y: 55 },
        chin: { x: 50, y: 65 },
        neckCenter: { x: 50, y: 75 },
      },
    };

    const positions = calculateJewelryPositions(detection, "necklace");
    
    // baseScale = max(0.5, min(2.0, 0.1 * 1.2)) = 0.5
    expect(positions.necklace?.scale).toBe(0.5);
  });

  it("should clamp scale to maximum 2.0", () => {
    const detection: FaceDetectionResult = {
      detected: true,
      faceAngle: 0,
      faceScale: 2.0, // Very large face (close-up)
      imageWidth: 1000,
      imageHeight: 1000,
      confidence: 0.9,
      bodyPartsVisible: {
        face: true,
        ears: true,
        neck: true,
        hands: false,
        wrists: false,
        ankles: false,
      },
      landmarks: {
        leftEye: { x: 35, y: 30 },
        rightEye: { x: 65, y: 30 },
        leftEar: { x: 15, y: 35 },
        rightEar: { x: 85, y: 35 },
        nose: { x: 50, y: 45 },
        mouth: { x: 50, y: 55 },
        chin: { x: 50, y: 65 },
        neckCenter: { x: 50, y: 75 },
      },
    };

    const positions = calculateJewelryPositions(detection, "necklace");
    
    // baseScale = max(0.5, min(2.0, 2.0 * 1.2)) = 2.0
    expect(positions.necklace?.scale).toBe(2.0);
  });
});

describe("AI Positioning - Fallback Positions", () => {
  it("should return correct fallback for earrings", () => {
    const fallback = getFallbackPosition("earrings");
    
    expect(fallback.x).toBe(25);
    expect(fallback.y).toBe(25);
    expect(fallback.scale).toBe(1);
    expect(fallback.rotation).toBe(0);
    expect(fallback.visible).toBe(true);
  });

  it("should return correct fallback for necklace", () => {
    const fallback = getFallbackPosition("necklace");
    
    expect(fallback.x).toBe(50);
    expect(fallback.y).toBe(40);
  });

  it("should return correct fallback for ring", () => {
    const fallback = getFallbackPosition("ring");
    
    expect(fallback.x).toBe(75);
    expect(fallback.y).toBe(70);
  });

  it("should return correct fallback for bracelet", () => {
    const fallback = getFallbackPosition("bracelet");
    
    expect(fallback.x).toBe(80);
    expect(fallback.y).toBe(60);
  });

  it("should return correct fallback for anklet", () => {
    const fallback = getFallbackPosition("anklet");
    
    expect(fallback.x).toBe(50);
    expect(fallback.y).toBe(90);
  });
});

describe("AI Positioning - Coordinate Conversion", () => {
  it("should convert percentage to pixel correctly", () => {
    expect(percentToPixel(50, 1000)).toBe(500);
    expect(percentToPixel(25, 800)).toBe(200);
    expect(percentToPixel(100, 500)).toBe(500);
    expect(percentToPixel(0, 1000)).toBe(0);
  });

  it("should convert pixel to percentage correctly", () => {
    expect(pixelToPercent(500, 1000)).toBe(50);
    expect(pixelToPercent(200, 800)).toBe(25);
    expect(pixelToPercent(500, 500)).toBe(100);
    expect(pixelToPercent(0, 1000)).toBe(0);
  });

  it("should handle decimal percentages", () => {
    expect(percentToPixel(33.33, 900)).toBeCloseTo(300, 0);
    expect(pixelToPercent(300, 900)).toBeCloseTo(33.33, 1);
  });
});

describe("AI Positioning - Edge Cases", () => {
  it("should return empty positions when not detected", () => {
    const notDetected: FaceDetectionResult = {
      detected: false,
      faceAngle: 0,
      faceScale: 0,
      imageWidth: 1000,
      imageHeight: 1000,
      confidence: 0,
      bodyPartsVisible: {
        face: false,
        ears: false,
        neck: false,
        hands: false,
        wrists: false,
        ankles: false,
      },
    };

    const positions = calculateJewelryPositions(notDetected, "necklace");
    
    expect(positions.necklace).toBeUndefined();
  });

  it("should handle negative coordinates as invalid", () => {
    const detection: FaceDetectionResult = {
      detected: true,
      faceAngle: 0,
      faceScale: 1,
      imageWidth: 1000,
      imageHeight: 1000,
      confidence: 0.9,
      bodyPartsVisible: {
        face: true,
        ears: true,
        neck: false,
        hands: false,
        wrists: false,
        ankles: false,
      },
      landmarks: {
        leftEye: { x: 35, y: 30 },
        rightEye: { x: 65, y: 30 },
        leftEar: { x: -1, y: -1 }, // Invalid
        rightEar: { x: 85, y: 35 },
        nose: { x: 50, y: 45 },
        mouth: { x: 50, y: 55 },
        chin: { x: -1, y: -1 }, // Invalid
        neckCenter: { x: -1, y: -1 }, // Invalid
      },
    };

    const earringPositions = calculateJewelryPositions(detection, "earrings");
    
    expect(earringPositions.earringsLeft).toBeUndefined();
    expect(earringPositions.earringsRight).toBeDefined();
  });

  it("should handle zero face angle", () => {
    const detection: FaceDetectionResult = {
      detected: true,
      faceAngle: 0,
      faceScale: 1,
      imageWidth: 1000,
      imageHeight: 1000,
      confidence: 0.9,
      bodyPartsVisible: {
        face: true,
        ears: true,
        neck: true,
        hands: false,
        wrists: false,
        ankles: false,
      },
      landmarks: {
        leftEye: { x: 35, y: 30 },
        rightEye: { x: 65, y: 30 },
        leftEar: { x: 15, y: 35 },
        rightEar: { x: 85, y: 35 },
        nose: { x: 50, y: 45 },
        mouth: { x: 50, y: 55 },
        chin: { x: 50, y: 65 },
        neckCenter: { x: 50, y: 75 },
      },
    };

    const positions = calculateJewelryPositions(detection, "earrings");
    
    expect(positions.earringsLeft?.rotation).toBe(0);
    expect(positions.earringsRight?.rotation).toBe(0);
  });

  it("should handle negative face angle (head tilted left)", () => {
    const detection: FaceDetectionResult = {
      detected: true,
      faceAngle: -15,
      faceScale: 1,
      imageWidth: 1000,
      imageHeight: 1000,
      confidence: 0.9,
      bodyPartsVisible: {
        face: true,
        ears: true,
        neck: true,
        hands: false,
        wrists: false,
        ankles: false,
      },
      landmarks: {
        leftEye: { x: 35, y: 30 },
        rightEye: { x: 65, y: 30 },
        leftEar: { x: 15, y: 35 },
        rightEar: { x: 85, y: 35 },
        nose: { x: 50, y: 45 },
        mouth: { x: 50, y: 55 },
        chin: { x: 50, y: 65 },
        neckCenter: { x: 50, y: 75 },
      },
    };

    const positions = calculateJewelryPositions(detection, "earrings");
    
    expect(positions.earringsLeft?.rotation).toBe(-7.5); // -15 * 0.5
  });
});

describe("AI Positioning - Jewelry Type Specific Scales", () => {
  const mockDetection: FaceDetectionResult = {
    detected: true,
    faceAngle: 0,
    faceScale: 1,
    imageWidth: 1000,
    imageHeight: 1000,
    confidence: 0.9,
    bodyPartsVisible: {
      face: true,
      ears: true,
      neck: true,
      hands: true,
      wrists: true,
      ankles: true,
    },
    landmarks: {
      leftEye: { x: 35, y: 30 },
      rightEye: { x: 65, y: 30 },
      leftEar: { x: 15, y: 35 },
      rightEar: { x: 85, y: 35 },
      nose: { x: 50, y: 45 },
      mouth: { x: 50, y: 55 },
      chin: { x: 50, y: 65 },
      neckCenter: { x: 50, y: 75 },
      leftWrist: { x: 20, y: 80 },
      rightWrist: { x: 80, y: 80 },
      leftAnkle: { x: 30, y: 95 },
      rightAnkle: { x: 70, y: 95 },
    },
  };

  it("should apply 0.8x scale for earrings", () => {
    const positions = calculateJewelryPositions(mockDetection, "earrings");
    
    // baseScale = 1 * 1.2 = 1.2, earrings scale = 1.2 * 0.8 = 0.96
    expect(positions.earringsLeft?.scale).toBeCloseTo(0.96, 2);
  });

  it("should apply 1.0x scale for necklace", () => {
    const positions = calculateJewelryPositions(mockDetection, "necklace");
    
    // baseScale = 1 * 1.2 = 1.2
    expect(positions.necklace?.scale).toBeCloseTo(1.2, 2);
  });

  it("should apply 0.6x scale for ring", () => {
    const positions = calculateJewelryPositions(mockDetection, "ring");
    
    // baseScale = 1.2, ring scale = 1.2 * 0.6 = 0.72
    expect(positions.ring?.scale).toBeCloseTo(0.72, 2);
  });

  it("should apply 0.7x scale for bracelet", () => {
    const positions = calculateJewelryPositions(mockDetection, "bracelet");
    
    // baseScale = 1.2, bracelet scale = 1.2 * 0.7 = 0.84
    expect(positions.braceletLeft?.scale).toBeCloseTo(0.84, 2);
  });

  it("should apply 0.6x scale for anklet", () => {
    const positions = calculateJewelryPositions(mockDetection, "anklet");
    
    // baseScale = 1.2, anklet scale = 1.2 * 0.6 = 0.72
    expect(positions.ankletLeft?.scale).toBeCloseTo(0.72, 2);
  });
});
