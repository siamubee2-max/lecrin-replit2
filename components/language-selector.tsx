/**
 * Language Selector Component
 * Allows users to switch between available languages
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from "react-native";
import { useI18n } from "@/lib/i18n-context";
import { Language } from "@/lib/i18n";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

interface LanguageSelectorProps {
  /** Style variant */
  variant?: "button" | "dropdown" | "list";
  /** Show flag emoji */
  showFlag?: boolean;
  /** Show language name */
  showName?: boolean;
  /** Custom button style */
  buttonClassName?: string;
}

export function LanguageSelector({
  variant = "button",
  showFlag = true,
  showName = true,
  buttonClassName,
}: LanguageSelectorProps) {
  const { language, setLanguage, languages, flags, t } = useI18n();
  const colors = useColors();
  const [modalVisible, setModalVisible] = useState(false);

  const languageList: { code: Language; name: string; flag: string }[] = [
    { code: "fr", name: languages.fr, flag: flags.fr },
    { code: "en", name: languages.en, flag: flags.en },
    { code: "es", name: languages.es, flag: flags.es },
    { code: "de", name: languages.de, flag: flags.de },
    { code: "it", name: languages.it, flag: flags.it },
    { code: "pt", name: languages.pt, flag: flags.pt },
  ];

  const currentLanguage = languageList.find((l) => l.code === language);

  const handleSelectLanguage = async (lang: Language) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await setLanguage(lang);
    setModalVisible(false);
  };

  const openModal = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setModalVisible(true);
  };

  // Button variant - shows current language and opens modal
  if (variant === "button") {
    return (
      <>
        <TouchableOpacity
          onPress={openModal}
          style={[
            styles.button,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          activeOpacity={0.7}
        >
          {showFlag && <Text style={styles.flag}>{currentLanguage?.flag}</Text>}
          {showName && (
            <Text style={[styles.buttonText, { color: colors.foreground }]}>
              {currentLanguage?.name}
            </Text>
          )}
          <IconSymbol name="chevron.right" size={16} color={colors.muted} />
        </TouchableOpacity>

        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.background },
              ]}
            >
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {t.settings.language}
              </Text>
              <FlatList
                data={languageList}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleSelectLanguage(item.code)}
                    style={[
                      styles.languageItem,
                      { borderBottomColor: colors.border },
                      item.code === language && {
                        backgroundColor: colors.surface,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.flag}>{item.flag}</Text>
                    <Text
                      style={[
                        styles.languageName,
                        { color: colors.foreground },
                      ]}
                    >
                      {item.name}
                    </Text>
                    {item.code === language && (
                      <IconSymbol
                        name="checkmark"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </>
    );
  }

  // List variant - shows all languages inline
  if (variant === "list") {
    return (
      <View style={styles.listContainer}>
        {languageList.map((item) => (
          <TouchableOpacity
            key={item.code}
            onPress={() => handleSelectLanguage(item.code)}
            style={[
              styles.listItem,
              { borderColor: colors.border },
              item.code === language && {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
            ]}
            activeOpacity={0.7}
          >
            {showFlag && <Text style={styles.listFlag}>{item.flag}</Text>}
            {showName && (
              <Text
                style={[
                  styles.listText,
                  {
                    color:
                      item.code === language
                        ? colors.background
                        : colors.foreground,
                  },
                ]}
              >
                {item.name}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // Dropdown variant - compact dropdown
  return (
    <TouchableOpacity
      onPress={openModal}
      style={[
        styles.dropdown,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      activeOpacity={0.7}
    >
      <Text style={styles.dropdownFlag}>{currentLanguage?.flag}</Text>
      <IconSymbol name="chevron.right" size={12} color={colors.muted} />

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={[
              styles.dropdownMenu,
              { backgroundColor: colors.background },
            ]}
          >
            {languageList.map((item) => (
              <TouchableOpacity
                key={item.code}
                onPress={() => handleSelectLanguage(item.code)}
                style={[
                  styles.dropdownItem,
                  { borderBottomColor: colors.border },
                  item.code === language && {
                    backgroundColor: colors.surface,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <Text
                  style={[styles.dropdownText, { color: colors.foreground }]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Button variant
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  flag: {
    fontSize: 20,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: 4,
    gap: 12,
  },
  languageName: {
    fontSize: 16,
    flex: 1,
  },

  // List variant
  listContainer: {
    flexDirection: "row",
    gap: 8,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  listFlag: {
    fontSize: 16,
  },
  listText: {
    fontSize: 14,
    fontWeight: "500",
  },

  // Dropdown variant
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  dropdownFlag: {
    fontSize: 18,
  },
  dropdownMenu: {
    position: "absolute",
    top: 60,
    right: 20,
    borderRadius: 12,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 160,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 10,
  },
  dropdownText: {
    fontSize: 14,
  },
});
