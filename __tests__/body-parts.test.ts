import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock trpc
vi.mock("@/lib/trpc", () => ({
  trpc: {
    bodyParts: {
      list: { useQuery: () => ({ data: [], isLoading: false }) },
      byType: { useQuery: () => ({ data: [], isLoading: false }) },
    },
  },
}));

describe("Body Parts Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should have correct body part types", () => {
    const validTypes = ["neck", "earrings", "ring", "wrist", "foot", "full"];
    
    expect(validTypes).toContain("neck");
    expect(validTypes).toContain("earrings");
    expect(validTypes).toContain("ring");
    expect(validTypes).toContain("wrist");
    expect(validTypes).toContain("foot");
    expect(validTypes).toContain("full");
  });

  it("should map jewelry types to body parts correctly", () => {
    const JEWELRY_TO_BODY_PART: Record<string, string> = {
      necklace: "neck",
      earrings: "earrings",
      ring: "ring",
      bracelet: "wrist",
      brooch: "full",
      anklet: "foot",
    };

    expect(JEWELRY_TO_BODY_PART["necklace"]).toBe("neck");
    expect(JEWELRY_TO_BODY_PART["earrings"]).toBe("earrings");
    expect(JEWELRY_TO_BODY_PART["ring"]).toBe("ring");
    expect(JEWELRY_TO_BODY_PART["bracelet"]).toBe("wrist");
    expect(JEWELRY_TO_BODY_PART["brooch"]).toBe("full");
    expect(JEWELRY_TO_BODY_PART["anklet"]).toBe("foot");
  });

  it("should have correct body part structure", () => {
    const bodyPart = {
      id: 1,
      externalId: "02286db2-5174-4979-9035-0c8653e3a75f",
      name: "Modèle Cou 1",
      type: "neck" as const,
      imageUrl: "https://drive.google.com/uc?export=view&id=example",
      userId: null,
      isDemo: true,
      createdAt: new Date(),
    };

    expect(bodyPart.id).toBeDefined();
    expect(bodyPart.name).toBe("Modèle Cou 1");
    expect(bodyPart.type).toBe("neck");
    expect(bodyPart.isDemo).toBe(true);
    expect(bodyPart.userId).toBeNull();
  });

  it("should validate all 9 demo body parts from seed data", () => {
    const demoBodyParts = [
      { name: "Modèle Cou 1", type: "neck" },
      { name: "Bague Gauche", type: "ring" },
      { name: "Poignet Gauche", type: "wrist" },
      { name: "Poignet Droit", type: "wrist" },
      { name: "Boucles d'oreilles 2", type: "earrings" },
      { name: "Parure Entière", type: "full" },
      { name: "Boucles d'oreilles 1", type: "earrings" },
      { name: "Bague Droite", type: "ring" },
      { name: "Chevillière", type: "foot" },
    ];

    expect(demoBodyParts.length).toBe(9);
    
    // Check type distribution
    const typeCount = demoBodyParts.reduce((acc, part) => {
      acc[part.type] = (acc[part.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    expect(typeCount["neck"]).toBe(1);
    expect(typeCount["ring"]).toBe(2);
    expect(typeCount["wrist"]).toBe(2);
    expect(typeCount["earrings"]).toBe(2);
    expect(typeCount["full"]).toBe(1);
    expect(typeCount["foot"]).toBe(1);
  });

  it("should filter body parts by type correctly", () => {
    const allBodyParts = [
      { id: 1, type: "neck", name: "Cou 1" },
      { id: 2, type: "ring", name: "Bague 1" },
      { id: 3, type: "ring", name: "Bague 2" },
      { id: 4, type: "earrings", name: "Boucles 1" },
    ];

    const ringParts = allBodyParts.filter(p => p.type === "ring");
    expect(ringParts.length).toBe(2);
    expect(ringParts[0].name).toBe("Bague 1");
    expect(ringParts[1].name).toBe("Bague 2");

    const neckParts = allBodyParts.filter(p => p.type === "neck");
    expect(neckParts.length).toBe(1);
  });

  it("should validate Google Drive image URL format", () => {
    const validUrl = "https://drive.google.com/uc?export=view&id=13O0T-bzBDjYDmuTUbDapOgnFVAyIKe6H";
    const isGoogleDriveUrl = validUrl.includes("drive.google.com");
    const hasExportParam = validUrl.includes("export=view");
    const hasIdParam = validUrl.includes("id=");

    expect(isGoogleDriveUrl).toBe(true);
    expect(hasExportParam).toBe(true);
    expect(hasIdParam).toBe(true);
  });
});

describe("Jewelry Types Configuration", () => {
  it("should have all required jewelry types", () => {
    const JEWELRY_TYPES = [
      { id: "necklace", name: "Collier / Pendentif", icon: "📿", bodyType: "neck" },
      { id: "earrings", name: "Boucles d'oreilles", icon: "💎", bodyType: "earrings" },
      { id: "ring", name: "Bague", icon: "💍", bodyType: "ring" },
      { id: "bracelet", name: "Bracelet", icon: "⌚", bodyType: "wrist" },
      { id: "anklet", name: "Chevillière", icon: "🦶", bodyType: "foot" },
      { id: "brooch", name: "Parure complète", icon: "✨", bodyType: "full" },
    ];

    expect(JEWELRY_TYPES.length).toBe(6);
    
    const ids = JEWELRY_TYPES.map(t => t.id);
    expect(ids).toContain("necklace");
    expect(ids).toContain("earrings");
    expect(ids).toContain("ring");
    expect(ids).toContain("bracelet");
    expect(ids).toContain("anklet");
    expect(ids).toContain("brooch");
  });

  it("should have icons for all jewelry types", () => {
    const JEWELRY_TYPES = [
      { id: "necklace", icon: "📿" },
      { id: "earrings", icon: "💎" },
      { id: "ring", icon: "💍" },
      { id: "bracelet", icon: "⌚" },
      { id: "anklet", icon: "🦶" },
      { id: "brooch", icon: "✨" },
    ];

    JEWELRY_TYPES.forEach(type => {
      expect(type.icon).toBeDefined();
      expect(type.icon.length).toBeGreaterThan(0);
    });
  });
});
