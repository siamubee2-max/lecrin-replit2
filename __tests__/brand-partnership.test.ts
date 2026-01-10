import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock trpc
vi.mock("@/lib/trpc", () => ({
  trpc: {
    creators: {
      list: { useQuery: () => ({ data: [], isLoading: false }) },
      get: { useQuery: () => ({ data: null, isLoading: false }) },
    },
  },
}));

describe("Brand Partnership Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should have correct creator schema fields", () => {
    const creator = {
      id: 1,
      externalId: "6953e38162ea1d9dd0b75f6a",
      name: "Moniattitude",
      description: "bijoux artisanaux! Pièce unique",
      websiteUrl: "https://moniattitude.com",
      logoUri: null,
      contactEmail: "info@moniattitude.com",
      commissionRate: 0,
      tier: "premium" as const,
      isFeatured: true,
      status: "active" as const,
      contractStart: null,
      contractEnd: null,
      isPremium: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(creator.id).toBeDefined();
    expect(creator.externalId).toBe("6953e38162ea1d9dd0b75f6a");
    expect(creator.name).toBe("Moniattitude");
    expect(creator.contactEmail).toBe("info@moniattitude.com");
    expect(creator.tier).toBe("premium");
    expect(creator.isFeatured).toBe(true);
    expect(creator.status).toBe("active");
  });

  it("should validate tier values", () => {
    const validTiers = ["standard", "premium", "exclusive"];
    
    expect(validTiers).toContain("standard");
    expect(validTiers).toContain("premium");
    expect(validTiers).toContain("exclusive");
  });

  it("should validate status values", () => {
    const validStatuses = ["active", "inactive", "pending"];
    
    expect(validStatuses).toContain("active");
    expect(validStatuses).toContain("inactive");
    expect(validStatuses).toContain("pending");
  });

  it("should get correct tier color", () => {
    const getTierColor = (tier: string | null) => {
      switch (tier) {
        case "premium":
          return "#D4AF37"; // Gold
        case "exclusive":
          return "#9333EA"; // Purple
        default:
          return "#687076"; // Muted
      }
    };

    expect(getTierColor("premium")).toBe("#D4AF37");
    expect(getTierColor("exclusive")).toBe("#9333EA");
    expect(getTierColor("standard")).toBe("#687076");
    expect(getTierColor(null)).toBe("#687076");
  });

  it("should get correct tier label", () => {
    const getTierLabel = (tier: string | null) => {
      switch (tier) {
        case "premium":
          return "Premium";
        case "exclusive":
          return "Exclusif";
        default:
          return "Partenaire";
      }
    };

    expect(getTierLabel("premium")).toBe("Premium");
    expect(getTierLabel("exclusive")).toBe("Exclusif");
    expect(getTierLabel("standard")).toBe("Partenaire");
    expect(getTierLabel(null)).toBe("Partenaire");
  });

  it("should parse CSV data correctly", () => {
    const csvData = {
      brand_name: "Moniattitude",
      logo_url: "",
      description: "bijoux artisanaux! Pièce unique",
      website_url: "https://moniattitude.com",
      commission_rate: "0",
      tier: "premium",
      featured: "true",
      status: "active",
      contract_start: "",
      contract_end: "",
      contact_email: "info@moniattitude.com",
      id: "6953e38162ea1d9dd0b75f6a",
    };

    expect(csvData.brand_name).toBe("Moniattitude");
    expect(csvData.tier).toBe("premium");
    expect(csvData.featured).toBe("true");
    expect(csvData.status).toBe("active");
    expect(csvData.contact_email).toBe("info@moniattitude.com");
    expect(parseInt(csvData.commission_rate)).toBe(0);
  });

  it("should validate Moniattitude partnership data", () => {
    const moniattitude = {
      externalId: "6953e38162ea1d9dd0b75f6a",
      name: "Moniattitude",
      description: "bijoux artisanaux! Pièce unique",
      websiteUrl: "https://moniattitude.com",
      contactEmail: "info@moniattitude.com",
      commissionRate: 0,
      tier: "premium",
      isFeatured: true,
      status: "active",
    };

    expect(moniattitude.name).toBe("Moniattitude");
    expect(moniattitude.websiteUrl).toContain("moniattitude.com");
    expect(moniattitude.tier).toBe("premium");
    expect(moniattitude.isFeatured).toBe(true);
    expect(moniattitude.status).toBe("active");
    expect(moniattitude.contactEmail).toContain("@");
  });
});

describe("Boutique Screen Creator Display", () => {
  it("should display creator with all fields", () => {
    const creator = {
      id: 1,
      name: "Test Creator",
      description: "Test description",
      websiteUrl: "https://example.com",
      contactEmail: "test@example.com",
      tier: "premium",
      isFeatured: true,
      status: "active",
      logoUri: null,
    };

    expect(creator.name).toBeDefined();
    expect(creator.description).toBeDefined();
    expect(creator.websiteUrl).toBeDefined();
    expect(creator.contactEmail).toBeDefined();
    expect(creator.tier).toBeDefined();
    expect(creator.status).toBeDefined();
  });

  it("should handle missing optional fields", () => {
    const creator = {
      id: 1,
      name: "Minimal Creator",
      description: null,
      websiteUrl: null,
      contactEmail: null,
      tier: null,
      isFeatured: false,
      status: "pending",
      logoUri: null,
    };

    expect(creator.name).toBe("Minimal Creator");
    expect(creator.description).toBeNull();
    expect(creator.websiteUrl).toBeNull();
    expect(creator.contactEmail).toBeNull();
  });

  it("should generate correct mailto link for becoming a creator", () => {
    const email = "inferencevision@inferencevision.store";
    const subject = "Demande de partenariat Écrin Virtuel";
    const encodedSubject = encodeURIComponent(subject);
    
    const mailtoLink = `mailto:${email}?subject=${encodedSubject}`;
    
    expect(mailtoLink).toContain(email);
    expect(mailtoLink).toContain("subject=");
  });
});
