import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform, Linking } from "react-native";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
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
  title?: string;
  message?: string;
}

export function ShareModal({ visible, onClose, imageUri, title = "Mon essayage Écrin Virtuel", message }: ShareModalProps) {
  const colors = useColors();

  const handleHaptic = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const shareToNative = async () => {
    handleHaptic();
    try {
      if (imageUri && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(imageUri, {
          mimeType: "image/png",
          dialogTitle: title,
        });
      }
      onClose();
    } catch (error) {
      console.error("Erreur de partage:", error);
    }
  };

  const shareToWhatsApp = async () => {
    handleHaptic();
    const text = encodeURIComponent(message || `Découvrez mon essayage virtuel avec Écrin Virtuel ! 💍✨`);
    const url = `whatsapp://send?text=${text}`;
    
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback to web WhatsApp
        await Linking.openURL(`https://wa.me/?text=${text}`);
      }
      onClose();
    } catch (error) {
      console.error("Erreur WhatsApp:", error);
    }
  };

  const shareToFacebook = async () => {
    handleHaptic();
    const text = encodeURIComponent(message || `Découvrez mon essayage virtuel avec Écrin Virtuel ! 💍✨`);
    
    try {
      // Open Facebook app or web
      await Linking.openURL(`https://www.facebook.com/sharer/sharer.php?quote=${text}`);
      onClose();
    } catch (error) {
      console.error("Erreur Facebook:", error);
    }
  };

  const shareToInstagram = async () => {
    handleHaptic();
    try {
      // Instagram doesn't support direct sharing via URL, open the app
      const canOpen = await Linking.canOpenURL("instagram://");
      if (canOpen) {
        await Linking.openURL("instagram://");
      } else {
        await Linking.openURL("https://www.instagram.com/");
      }
      onClose();
    } catch (error) {
      console.error("Erreur Instagram:", error);
    }
  };

  const shareToTwitter = async () => {
    handleHaptic();
    const text = encodeURIComponent(message || `Découvrez mon essayage virtuel avec Écrin Virtuel ! 💍✨ #EcrinVirtuel #Bijoux`);
    
    try {
      const canOpen = await Linking.canOpenURL("twitter://");
      if (canOpen) {
        await Linking.openURL(`twitter://post?message=${text}`);
      } else {
        await Linking.openURL(`https://twitter.com/intent/tweet?text=${text}`);
      }
      onClose();
    } catch (error) {
      console.error("Erreur Twitter:", error);
    }
  };

  const copyToClipboard = async () => {
    handleHaptic();
    // Note: In a real app, you'd use expo-clipboard here
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onClose();
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
      id: "whatsapp",
      name: "WhatsApp",
      icon: "💬",
      color: "#25D366",
      action: shareToWhatsApp,
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: "📘",
      color: "#1877F2",
      action: shareToFacebook,
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: "📷",
      color: "#E4405F",
      action: shareToInstagram,
    },
    {
      id: "twitter",
      name: "X / Twitter",
      icon: "🐦",
      color: "#1DA1F2",
      action: shareToTwitter,
    },
    {
      id: "copy",
      name: "Copier",
      icon: "📋",
      color: colors.muted,
      action: copyToClipboard,
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
              Partager l'essayage
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol name="xmark" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {/* Preview */}
          <View style={[styles.preview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.previewEmoji}>💍</Text>
            <View style={styles.previewText}>
              <Text style={[styles.previewTitle, { color: colors.foreground }]}>
                {title}
              </Text>
              <Text style={[styles.previewSubtitle, { color: colors.muted }]}>
                Partagez votre essayage virtuel
              </Text>
            </View>
          </View>

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
                <Text style={[styles.optionName, { color: colors.foreground }]}>
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
    marginBottom: 20,
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
    marginBottom: 24,
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
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  optionButton: {
    width: "30%",
    alignItems: "center",
    marginBottom: 20,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  optionEmoji: {
    fontSize: 28,
  },
  optionName: {
    fontSize: 12,
    fontWeight: "500",
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
