import { useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform, Linking, Alert } from "react-native";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface ShareOption {
  id: string;
  name: string;
  icon: string;
  color: string;
  action: () => void;
}

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  imageUri?: string;
  imageUrl?: string; // URL publique de l'image pour Pinterest
  title?: string;
  message?: string;
  url?: string; // URL à partager
}

export function ShareModal({ 
  visible, 
  onClose, 
  imageUri, 
  imageUrl,
  title = "L'Écrin Virtuel", 
  message,
  url
}: ShareModalProps) {
  const colors = useColors();
  const [copied, setCopied] = useState(false);

  // URL par défaut si non fournie
  const shareUrl = url || "https://ecrinvirtuel.app";
  const shareText = message || `Découvrez mon essayage virtuel avec L'Écrin Virtuel ! 💍✨`;

  const handleHaptic = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSuccessHaptic = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  // Partage natif iOS/Android
  const shareToNative = async () => {
    handleHaptic();
    try {
      if (imageUri && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(imageUri, {
          mimeType: "image/png",
          dialogTitle: title,
        });
      } else if (Platform.OS !== "web" && await Sharing.isAvailableAsync()) {
        // Partage texte si pas d'image
        Alert.alert(
          "Partager",
          shareText + "\n\n" + shareUrl,
          [
            { text: "Copier", onPress: () => copyToClipboard() },
            { text: "Annuler", style: "cancel" }
          ]
        );
      }
      onClose();
    } catch (error) {
      console.error("Erreur de partage:", error);
    }
  };

  // Copier le lien avec feedback visuel
  const copyToClipboard = async () => {
    handleHaptic();
    try {
      await Clipboard.setStringAsync(shareUrl);
      setCopied(true);
      handleSuccessHaptic();
      
      // Reset après 2 secondes
      setTimeout(() => setCopied(false), 2000);
      
      // Fermer après un délai pour montrer le feedback
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error("Erreur copie:", error);
    }
  };

  // Twitter/X
  const shareToTwitter = async () => {
    handleHaptic();
    const encodedText = encodeURIComponent(shareText + " #EcrinVirtuel #Bijoux");
    const encodedUrl = encodeURIComponent(shareUrl);
    
    try {
      // Essayer d'ouvrir l'app Twitter d'abord
      const twitterAppUrl = `twitter://post?message=${encodedText}`;
      const canOpenApp = await Linking.canOpenURL(twitterAppUrl);
      
      if (canOpenApp) {
        await Linking.openURL(twitterAppUrl);
      } else {
        // Fallback vers le web
        await Linking.openURL(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`);
      }
      onClose();
    } catch (error) {
      console.error("Erreur Twitter:", error);
    }
  };

  // Facebook
  const shareToFacebook = async () => {
    handleHaptic();
    const encodedUrl = encodeURIComponent(shareUrl);
    
    try {
      await Linking.openURL(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`);
      onClose();
    } catch (error) {
      console.error("Erreur Facebook:", error);
    }
  };

  // Pinterest (nouveau)
  const shareToPinterest = async () => {
    handleHaptic();
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);
    const encodedImage = imageUrl ? encodeURIComponent(imageUrl) : "";
    
    try {
      let pinterestUrl = `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}`;
      
      if (encodedImage) {
        pinterestUrl += `&media=${encodedImage}`;
      }
      
      await Linking.openURL(pinterestUrl);
      onClose();
    } catch (error) {
      console.error("Erreur Pinterest:", error);
    }
  };

  // Instagram (avec copie du texte)
  const shareToInstagram = async () => {
    handleHaptic();
    
    try {
      // Copier le texte dans le presse-papiers
      await Clipboard.setStringAsync(`${shareText} ${shareUrl}`);
      
      // Essayer d'ouvrir l'app Instagram
      const canOpenApp = await Linking.canOpenURL("instagram://");
      
      if (canOpenApp) {
        await Linking.openURL("instagram://");
      } else {
        await Linking.openURL("https://www.instagram.com/");
      }
      
      // Afficher un message
      Alert.alert(
        "Instagram",
        "Le texte a été copié ! Collez-le dans votre publication ou story Instagram.",
        [{ text: "OK" }]
      );
      
      onClose();
    } catch (error) {
      console.error("Erreur Instagram:", error);
    }
  };

  // WhatsApp
  const shareToWhatsApp = async () => {
    handleHaptic();
    const encodedText = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
    
    try {
      const whatsappUrl = `whatsapp://send?text=${encodedText}`;
      const canOpenApp = await Linking.canOpenURL(whatsappUrl);
      
      if (canOpenApp) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Fallback vers WhatsApp Web
        await Linking.openURL(`https://wa.me/?text=${encodedText}`);
      }
      onClose();
    } catch (error) {
      console.error("Erreur WhatsApp:", error);
    }
  };

  // Email
  const shareToEmail = async () => {
    handleHaptic();
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
    
    try {
      await Linking.openURL(`mailto:?subject=${subject}&body=${body}`);
      onClose();
    } catch (error) {
      console.error("Erreur Email:", error);
    }
  };

  const shareOptions: ShareOption[] = [
    {
      id: "native",
      name: "Partager",
      icon: "📤",
      color: colors.primary,
      action: shareToNative,
    },
    {
      id: "copy",
      name: copied ? "Copié !" : "Copier le lien",
      icon: copied ? "✅" : "🔗",
      color: copied ? "#22C55E" : colors.muted,
      action: copyToClipboard,
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: "💬",
      color: "#25D366",
      action: shareToWhatsApp,
    },
    {
      id: "twitter",
      name: "X / Twitter",
      icon: "🐦",
      color: "#000000",
      action: shareToTwitter,
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: "📘",
      color: "#1877F2",
      action: shareToFacebook,
    },
    {
      id: "pinterest",
      name: "Pinterest",
      icon: "📌",
      color: "#E60023",
      action: shareToPinterest,
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: "📷",
      color: "#E4405F",
      action: shareToInstagram,
    },
    {
      id: "email",
      name: "Email",
      icon: "✉️",
      color: "#6366F1",
      action: shareToEmail,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Partager
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol name="xmark" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {/* Preview */}
          <View style={[styles.preview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.previewEmoji}>💍</Text>
            <View style={styles.previewText}>
              <Text style={[styles.previewTitle, { color: colors.foreground }]} numberOfLines={1}>
                {title}
              </Text>
              <Text style={[styles.previewSubtitle, { color: colors.muted }]} numberOfLines={2}>
                {shareText}
              </Text>
            </View>
          </View>

          {/* URL Preview */}
          <TouchableOpacity 
            style={[styles.urlPreview, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={copyToClipboard}
            activeOpacity={0.7}
          >
            <IconSymbol name="link" size={16} color={colors.muted} />
            <Text style={[styles.urlText, { color: colors.muted }]} numberOfLines={1}>
              {shareUrl}
            </Text>
            <IconSymbol 
              name={copied ? "checkmark" : "doc.on.doc"} 
              size={16} 
              color={copied ? "#22C55E" : colors.primary} 
            />
          </TouchableOpacity>

          {/* Share Options Grid */}
          <View style={styles.optionsGrid}>
            {shareOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionButton}
                onPress={option.action}
                activeOpacity={0.7}
              >
                <View style={[styles.optionIcon, { backgroundColor: option.color + "20" }]}>
                  <Text style={styles.optionEmoji}>{option.icon}</Text>
                </View>
                <Text style={[styles.optionName, { color: colors.foreground }]} numberOfLines={1}>
                  {option.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelText, { color: colors.foreground }]}>
              Annuler
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    padding: 8,
  },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  previewEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  previewText: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  previewSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  urlPreview: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    gap: 8,
  },
  urlText: {
    flex: 1,
    fontSize: 13,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginBottom: 20,
  },
  optionButton: {
    width: "25%",
    alignItems: "center",
    marginBottom: 16,
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  optionEmoji: {
    fontSize: 26,
  },
  optionName: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
