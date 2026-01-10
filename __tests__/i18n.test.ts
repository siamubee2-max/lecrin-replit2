/**
 * Tests for Internationalization (i18n) System
 */

import { describe, it, expect } from "vitest";
import { fr, TranslationKeys } from "../lib/i18n/fr";
import { en } from "../lib/i18n/en";
import { es } from "../lib/i18n/es";
import {
  translations,
  languageNames,
  languageFlags,
  defaultLanguage,
  getTranslation,
  Language,
} from "../lib/i18n";

describe("Internationalization System", () => {
  describe("Translation Files", () => {
    it("should have French as the default language", () => {
      expect(defaultLanguage).toBe("fr");
    });

    it("should have all three languages available", () => {
      expect(Object.keys(translations)).toContain("fr");
      expect(Object.keys(translations)).toContain("en");
      expect(Object.keys(translations)).toContain("es");
    });

    it("should have language names for all languages", () => {
      expect(languageNames.fr).toBe("Français");
      expect(languageNames.en).toBe("English");
      expect(languageNames.es).toBe("Español");
    });

    it("should have flag emojis for all languages", () => {
      expect(languageFlags.fr).toBe("🇫🇷");
      expect(languageFlags.en).toBe("🇬🇧");
      expect(languageFlags.es).toBe("🇪🇸");
    });
  });

  describe("French Translations", () => {
    it("should have brand information", () => {
      expect(fr.brand.name).toBe("L'Écrin Virtuel");
      expect(fr.brand.slogan).toBe("Essayez l'inaccessible Virtuellement.");
      expect(fr.brand.tagline).toBeDefined();
    });

    it("should have common translations", () => {
      expect(fr.common.save).toBe("Enregistrer");
      expect(fr.common.cancel).toBe("Annuler");
      expect(fr.common.delete).toBe("Supprimer");
      expect(fr.common.edit).toBe("Modifier");
      expect(fr.common.share).toBe("Partager");
      expect(fr.common.loading).toBe("Chargement...");
    });

    it("should have home screen translations", () => {
      expect(fr.home.virtualTryOn).toBe("Essayage Virtuel");
      expect(fr.home.newTryOn).toBe("Nouvel Essayage");
      expect(fr.home.myCollection).toBe("Mon Écrin");
    });

    it("should have try-on screen translations", () => {
      expect(fr.tryOn.title).toBe("Essayage");
      expect(fr.tryOn.selectJewelry).toBeDefined();
      expect(fr.tryOn.takePhoto).toBe("Prendre une photo");
    });

    it("should have settings translations", () => {
      expect(fr.settings.title).toBe("Paramètres");
      expect(fr.settings.language).toBe("Langue");
      expect(fr.settings.theme).toBe("Thème");
    });

    it("should have boutique translations", () => {
      expect(fr.boutique.title).toBe("Boutique Style Sélectionné");
      expect(fr.boutique.featuredPartners).toBe("Partenaires Vedettes");
      expect(fr.boutique.visitBrand).toBe("Visiter la Marque");
    });

    it("should have AI stylist translations", () => {
      expect(fr.aiStylist.title).toBe("AI Stylist");
      expect(fr.aiStylist.generateLooks).toBe("Générer des looks");
      expect(fr.aiStylist.saveLook).toBeDefined();
    });
  });

  describe("English Translations", () => {
    it("should have brand information", () => {
      expect(en.brand.name).toBeDefined();
      expect(en.brand.slogan).toBeDefined();
      expect(en.brand.tagline).toBeDefined();
    });

    it("should have common translations", () => {
      expect(en.common.save).toBe("Save");
      expect(en.common.cancel).toBe("Cancel");
      expect(en.common.delete).toBe("Delete");
      expect(en.common.edit).toBe("Edit");
      expect(en.common.share).toBe("Share");
      expect(en.common.loading).toBe("Loading...");
    });

    it("should have home screen translations", () => {
      expect(en.home.virtualTryOn).toBe("Virtual Try-On");
      expect(en.home.newTryOn).toBe("New Try-On");
      expect(en.home.myCollection).toBeDefined();
    });

    it("should have try-on screen translations", () => {
      expect(en.tryOn.title).toBeDefined();
      expect(en.tryOn.selectJewelry).toBeDefined();
      expect(en.tryOn.takePhoto).toBe("Take a photo");
    });

    it("should have settings translations", () => {
      expect(en.settings.title).toBe("Settings");
      expect(en.settings.language).toBe("Language");
      expect(en.settings.theme).toBe("Theme");
    });

    it("should have boutique translations", () => {
      expect(en.boutique.title).toBeDefined();
      expect(en.boutique.featuredPartners).toBe("Featured Partners");
      expect(en.boutique.visitBrand).toBe("Visit Brand");
    });

    it("should have AI stylist translations", () => {
      expect(en.aiStylist.title).toBe("AI Stylist");
      expect(en.aiStylist.generateLooks).toBeDefined();
      expect(en.aiStylist.saveLook).toBeDefined();
    });
  });

  describe("Spanish Translations", () => {
    it("should have brand information", () => {
      expect(es.brand.name).toBe("Joyero Virtual");
      expect(es.brand.slogan).toBeDefined();
      expect(es.brand.tagline).toBeDefined();
    });

    it("should have common translations", () => {
      expect(es.common.save).toBe("Guardar");
      expect(es.common.cancel).toBe("Cancelar");
      expect(es.common.delete).toBe("Eliminar");
      expect(es.common.edit).toBe("Editar");
      expect(es.common.share).toBe("Compartir");
      expect(es.common.loading).toBe("Cargando...");
    });

    it("should have home screen translations", () => {
      expect(es.home.virtualTryOn).toBe("Prueba Virtual");
      expect(es.home.newTryOn).toBe("Nueva Prueba");
      expect(es.home.myCollection).toBeDefined();
    });

    it("should have try-on screen translations", () => {
      expect(es.tryOn.title).toBeDefined();
      expect(es.tryOn.selectJewelry).toBeDefined();
      expect(es.tryOn.takePhoto).toBe("Tomar una foto");
    });

    it("should have settings translations", () => {
      expect(es.settings.title).toBe("Ajustes");
      expect(es.settings.language).toBe("Idioma");
      expect(es.settings.theme).toBe("Tema");
    });

    it("should have boutique translations", () => {
      expect(es.boutique.title).toBeDefined();
      expect(es.boutique.featuredPartners).toBe("Socios Destacados");
      expect(es.boutique.visitBrand).toBe("Visitar Marca");
    });

    it("should have AI stylist translations", () => {
      expect(es.aiStylist.title).toBe("Estilista IA");
      expect(es.aiStylist.generateLooks).toBe("Generar looks");
      expect(es.aiStylist.saveLook).toBeDefined();
    });
  });

  describe("Translation Completeness", () => {
    const frKeys = getAllKeys(fr);
    
    it("should have all French keys in English", () => {
      const enKeys = getAllKeys(en);
      const missingKeys = frKeys.filter(key => !enKeys.includes(key));
      expect(missingKeys).toEqual([]);
    });

    it("should have all French keys in Spanish", () => {
      const esKeys = getAllKeys(es);
      const missingKeys = frKeys.filter(key => !esKeys.includes(key));
      expect(missingKeys).toEqual([]);
    });

    it("should not have empty translations in English", () => {
      const emptyKeys = findEmptyValues(en);
      expect(emptyKeys).toEqual([]);
    });

    it("should not have empty translations in Spanish", () => {
      const emptyKeys = findEmptyValues(es);
      expect(emptyKeys).toEqual([]);
    });
  });

  describe("getTranslation Helper", () => {
    it("should return French translations for 'fr'", () => {
      const result = getTranslation("fr");
      expect(result.brand.name).toBe("L'Écrin Virtuel");
    });

    it("should return English translations for 'en'", () => {
      const result = getTranslation("en");
      expect(result.brand.name).toBe("Virtual Jewelry Box");
    });

    it("should return Spanish translations for 'es'", () => {
      const result = getTranslation("es");
      expect(result.brand.name).toBe("Joyero Virtual");
    });

    it("should return default (French) for unknown language", () => {
      const result = getTranslation("unknown" as Language);
      expect(result.brand.name).toBe("L'Écrin Virtuel");
    });
  });

  describe("Jewelry Types Translations", () => {
    it("should have all jewelry types in French", () => {
      expect(fr.jewelryTypes.necklace).toBe("Collier");
      expect(fr.jewelryTypes.earrings).toBe("Boucles d'oreilles");
      expect(fr.jewelryTypes.ring).toBe("Bague");
      expect(fr.jewelryTypes.bracelet).toBe("Bracelet");
      expect(fr.jewelryTypes.anklet).toBe("Chevillière");
    });

    it("should have all jewelry types in English", () => {
      expect(en.jewelryTypes.necklace).toBe("Necklace");
      expect(en.jewelryTypes.earrings).toBe("Earrings");
      expect(en.jewelryTypes.ring).toBe("Ring");
      expect(en.jewelryTypes.bracelet).toBe("Bracelet");
      expect(en.jewelryTypes.anklet).toBe("Anklet");
    });

    it("should have all jewelry types in Spanish", () => {
      expect(es.jewelryTypes.necklace).toBe("Collar");
      expect(es.jewelryTypes.earrings).toBe("Pendientes");
      expect(es.jewelryTypes.ring).toBe("Anillo");
      expect(es.jewelryTypes.bracelet).toBe("Pulsera");
      expect(es.jewelryTypes.anklet).toBe("Tobillera");
    });
  });

  describe("Metal Styles Translations", () => {
    it("should have all metal styles in French", () => {
      expect(fr.jewelryStyles.gold).toBe("Or");
      expect(fr.jewelryStyles.silver).toBe("Argent");
      expect(fr.jewelryStyles.rosegold).toBe("Or Rose");
    });

    it("should have all metal styles in English", () => {
      expect(en.jewelryStyles.gold).toBe("Gold");
      expect(en.jewelryStyles.silver).toBe("Silver");
      expect(en.jewelryStyles.rosegold).toBe("Rose Gold");
    });

    it("should have all metal styles in Spanish", () => {
      expect(es.jewelryStyles.gold).toBe("Oro");
      expect(es.jewelryStyles.silver).toBe("Plata");
      expect(es.jewelryStyles.rosegold).toBe("Oro Rosa");
    });
  });

  describe("Photo Editor Translations", () => {
    it("should have photo editor section in French", () => {
      expect(fr.photoEditor).toBeDefined();
      expect(typeof fr.photoEditor).toBe("object");
    });

    it("should have photo editor section in English", () => {
      expect(en.photoEditor).toBeDefined();
      expect(typeof en.photoEditor).toBe("object");
    });

    it("should have photo editor section in Spanish", () => {
      expect(es.photoEditor).toBeDefined();
      expect(typeof es.photoEditor).toBe("object");
    });
  });
});

// Helper functions
function getAllKeys(obj: object, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null) {
      keys.push(...getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function findEmptyValues(obj: object, prefix = ""): string[] {
  const emptyKeys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null) {
      emptyKeys.push(...findEmptyValues(value, fullKey));
    } else if (value === "" || value === null || value === undefined) {
      emptyKeys.push(fullKey);
    }
  }
  return emptyKeys;
}
