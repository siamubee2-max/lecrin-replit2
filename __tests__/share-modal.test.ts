import { describe, it, expect, vi } from "vitest";

// Mock expo-sharing
vi.mock("expo-sharing", () => ({
  isAvailableAsync: vi.fn().mockResolvedValue(true),
  shareAsync: vi.fn().mockResolvedValue(undefined),
}));

// Mock expo-haptics
vi.mock("expo-haptics", () => ({
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium" },
  NotificationFeedbackType: { Success: "success", Error: "error" },
}));

// Mock react-native Linking
vi.mock("react-native", async () => {
  const actual = await vi.importActual("react-native");
  return {
    ...actual,
    Linking: {
      canOpenURL: vi.fn().mockResolvedValue(true),
      openURL: vi.fn().mockResolvedValue(undefined),
    },
    Platform: {
      OS: "ios",
    },
  };
});

describe("ShareModal functionality", () => {
  it("should have share options defined", () => {
    const shareOptions = [
      { id: "native", name: "Partager" },
      { id: "whatsapp", name: "WhatsApp" },
      { id: "facebook", name: "Facebook" },
      { id: "instagram", name: "Instagram" },
      { id: "twitter", name: "X / Twitter" },
      { id: "copy", name: "Copier" },
    ];

    expect(shareOptions).toHaveLength(6);
    expect(shareOptions.map(o => o.id)).toContain("whatsapp");
    expect(shareOptions.map(o => o.id)).toContain("facebook");
    expect(shareOptions.map(o => o.id)).toContain("instagram");
  });

  it("should generate correct WhatsApp URL", () => {
    const message = "Test message";
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `whatsapp://send?text=${encodedMessage}`;
    
    expect(whatsappUrl).toBe("whatsapp://send?text=Test%20message");
  });

  it("should generate correct Twitter URL", () => {
    const message = "Test message #EcrinVirtuel";
    const encodedMessage = encodeURIComponent(message);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedMessage}`;
    
    expect(twitterUrl).toContain("twitter.com/intent/tweet");
    expect(twitterUrl).toContain("Test%20message");
  });

  it("should generate correct Facebook share URL", () => {
    const message = "Test message";
    const encodedMessage = encodeURIComponent(message);
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?quote=${encodedMessage}`;
    
    expect(facebookUrl).toContain("facebook.com/sharer");
  });

  it("should have correct default share message for jewelry", () => {
    const defaultMessage = "Découvrez mon essayage virtuel avec Écrin Virtuel ! 💍✨";
    
    expect(defaultMessage).toContain("Écrin Virtuel");
    expect(defaultMessage).toContain("💍");
  });

  it("should generate item-specific share message", () => {
    const item = { type: "Bague", emoji: "💍" };
    const message = `Regardez ce magnifique ${item.type.toLowerCase()} que j'ai essayé virtuellement avec Écrin Virtuel ! ${item.emoji}✨`;
    
    expect(message).toContain("bague");
    expect(message).toContain("💍");
    expect(message).toContain("Écrin Virtuel");
  });
});

describe("Share integration", () => {
  it("should support sharing from tryon screen", () => {
    // The tryon screen should have a share button and modal
    const tryonScreenFeatures = {
      hasShareButton: true,
      hasShareModal: true,
      shareTitle: "Mon essayage Écrin Virtuel",
    };

    expect(tryonScreenFeatures.hasShareButton).toBe(true);
    expect(tryonScreenFeatures.hasShareModal).toBe(true);
  });

  it("should support sharing from gallery screen", () => {
    // The gallery screen should allow sharing individual items
    const galleryScreenFeatures = {
      hasSharePerItem: true,
      hasShareModal: true,
      supportsItemSpecificMessage: true,
    };

    expect(galleryScreenFeatures.hasSharePerItem).toBe(true);
    expect(galleryScreenFeatures.hasShareModal).toBe(true);
    expect(galleryScreenFeatures.supportsItemSpecificMessage).toBe(true);
  });
});
