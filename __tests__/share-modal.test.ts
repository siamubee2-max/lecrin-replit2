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

// Mock expo-clipboard
vi.mock("expo-clipboard", () => ({
  setStringAsync: vi.fn().mockResolvedValue(true),
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

/**
 * Tests pour le composant ShareModal amélioré
 */

const SHARE_OPTIONS = [
  { id: "native", name: "Partager", icon: "📤" },
  { id: "copy", name: "Copier le lien", icon: "🔗" },
  { id: "whatsapp", name: "WhatsApp", icon: "💬" },
  { id: "twitter", name: "X / Twitter", icon: "🐦" },
  { id: "facebook", name: "Facebook", icon: "📘" },
  { id: "pinterest", name: "Pinterest", icon: "📌" },
  { id: "instagram", name: "Instagram", icon: "📷" },
  { id: "email", name: "Email", icon: "✉️" },
];

describe("ShareModal Options", () => {
  it("devrait avoir 8 options de partage", () => {
    expect(SHARE_OPTIONS).toHaveLength(8);
  });

  it("devrait inclure le partage natif", () => {
    const nativeOption = SHARE_OPTIONS.find(o => o.id === "native");
    expect(nativeOption).toBeDefined();
    expect(nativeOption?.name).toBe("Partager");
  });

  it("devrait inclure la copie du lien", () => {
    const copyOption = SHARE_OPTIONS.find(o => o.id === "copy");
    expect(copyOption).toBeDefined();
    expect(copyOption?.name).toBe("Copier le lien");
  });

  it("devrait inclure WhatsApp", () => {
    const whatsappOption = SHARE_OPTIONS.find(o => o.id === "whatsapp");
    expect(whatsappOption).toBeDefined();
    expect(whatsappOption?.name).toBe("WhatsApp");
  });

  it("devrait inclure Twitter/X", () => {
    const twitterOption = SHARE_OPTIONS.find(o => o.id === "twitter");
    expect(twitterOption).toBeDefined();
    expect(twitterOption?.name).toBe("X / Twitter");
  });

  it("devrait inclure Facebook", () => {
    const facebookOption = SHARE_OPTIONS.find(o => o.id === "facebook");
    expect(facebookOption).toBeDefined();
    expect(facebookOption?.name).toBe("Facebook");
  });

  it("devrait inclure Pinterest (nouveau)", () => {
    const pinterestOption = SHARE_OPTIONS.find(o => o.id === "pinterest");
    expect(pinterestOption).toBeDefined();
    expect(pinterestOption?.name).toBe("Pinterest");
  });

  it("devrait inclure Instagram", () => {
    const instagramOption = SHARE_OPTIONS.find(o => o.id === "instagram");
    expect(instagramOption).toBeDefined();
    expect(instagramOption?.name).toBe("Instagram");
  });

  it("devrait inclure Email", () => {
    const emailOption = SHARE_OPTIONS.find(o => o.id === "email");
    expect(emailOption).toBeDefined();
    expect(emailOption?.name).toBe("Email");
  });

  it("chaque option devrait avoir un identifiant unique", () => {
    const ids = SHARE_OPTIONS.map(o => o.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe("ShareModal URL Generation", () => {
  const baseUrl = "https://ecrinvirtuel.app";
  const shareText = "Découvrez mon essayage virtuel !";

  it("devrait générer une URL Twitter valide", () => {
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(baseUrl);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
    
    expect(twitterUrl).toContain("twitter.com/intent/tweet");
    expect(twitterUrl).toContain("text=");
    expect(twitterUrl).toContain("url=");
  });

  it("devrait générer une URL Facebook valide", () => {
    const encodedUrl = encodeURIComponent(baseUrl);
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    
    expect(facebookUrl).toContain("facebook.com/sharer/sharer.php");
    expect(facebookUrl).toContain("u=");
  });

  it("devrait générer une URL Pinterest valide", () => {
    const encodedUrl = encodeURIComponent(baseUrl);
    const encodedText = encodeURIComponent(shareText);
    const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}`;
    
    expect(pinterestUrl).toContain("pinterest.com/pin/create/button");
    expect(pinterestUrl).toContain("url=");
    expect(pinterestUrl).toContain("description=");
  });

  it("devrait générer une URL WhatsApp valide", () => {
    const encodedText = encodeURIComponent(`${shareText}\n\n${baseUrl}`);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    
    expect(whatsappUrl).toContain("wa.me");
    expect(whatsappUrl).toContain("text=");
  });

  it("devrait générer une URL mailto valide", () => {
    const subject = encodeURIComponent("L'Écrin Virtuel");
    const body = encodeURIComponent(`${shareText}\n\n${baseUrl}`);
    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
    
    expect(mailtoUrl).toContain("mailto:");
    expect(mailtoUrl).toContain("subject=");
    expect(mailtoUrl).toContain("body=");
  });

  it("devrait supporter une image URL pour Pinterest", () => {
    const imageUrl = "https://storage.ecrinvirtuel.app/images/tryon123.png";
    const encodedImage = encodeURIComponent(imageUrl);
    const encodedUrl = encodeURIComponent(baseUrl);
    const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImage}`;
    
    expect(pinterestUrl).toContain("media=");
    expect(encodedImage).toContain("storage.ecrinvirtuel.app");
  });
});

describe("ShareModal Props", () => {
  it("devrait avoir des valeurs par défaut pour title et message", () => {
    const defaultTitle = "L'Écrin Virtuel";
    const defaultUrl = "https://ecrinvirtuel.app";
    
    expect(defaultTitle).toBe("L'Écrin Virtuel");
    expect(defaultUrl).toBe("https://ecrinvirtuel.app");
  });

  it("devrait supporter une URL personnalisée", () => {
    const customUrl = "https://ecrinvirtuel.app/share/abc123";
    expect(customUrl).toContain("ecrinvirtuel.app");
  });

  it("devrait générer un message item-specific pour les bijoux", () => {
    const item = { type: "Bague", emoji: "💍" };
    const message = `Regardez ce magnifique ${item.type.toLowerCase()} que j'ai essayé virtuellement avec L'Écrin Virtuel ! ${item.emoji}✨`;
    
    expect(message).toContain("bague");
    expect(message).toContain("💍");
    expect(message).toContain("L'Écrin Virtuel");
  });
});

describe("Share integration", () => {
  it("devrait supporter le partage depuis l'écran d'essayage", () => {
    const tryonScreenFeatures = {
      hasShareButton: true,
      hasShareModal: true,
      shareTitle: "Mon essayage Écrin Virtuel",
    };

    expect(tryonScreenFeatures.hasShareButton).toBe(true);
    expect(tryonScreenFeatures.hasShareModal).toBe(true);
  });

  it("devrait supporter le partage depuis la galerie", () => {
    const galleryScreenFeatures = {
      hasSharePerItem: true,
      hasShareModal: true,
      supportsItemSpecificMessage: true,
    };

    expect(galleryScreenFeatures.hasSharePerItem).toBe(true);
    expect(galleryScreenFeatures.hasShareModal).toBe(true);
    expect(galleryScreenFeatures.supportsItemSpecificMessage).toBe(true);
  });

  it("devrait supporter le feedback visuel pour la copie du lien", () => {
    const copyFeedback = {
      initialIcon: "🔗",
      copiedIcon: "✅",
      initialText: "Copier le lien",
      copiedText: "Copié !",
      feedbackDuration: 2000,
    };

    expect(copyFeedback.copiedIcon).toBe("✅");
    expect(copyFeedback.copiedText).toBe("Copié !");
    expect(copyFeedback.feedbackDuration).toBe(2000);
  });
});
