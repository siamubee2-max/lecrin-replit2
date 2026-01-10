/**
 * Tests for Internationalization (i18n) System
 */

import { describe, it, expect } from "vitest";
import { fr, TranslationKeys } from "../lib/i18n/fr";
import { en } from "../lib/i18n/en";
import { es } from "../lib/i18n/es";
import { de } from "../lib/i18n/de";
import { it as itLang } from "../lib/i18n/it";
import { pt } from "../lib/i18n/pt";
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

    it("should have all six languages available", () => {
      expect(Object.keys(translations)).toContain("fr");
      expect(Object.keys(translations)).toContain("en");
      expect(Object.keys(translations)).toContain("es");
      expect(Object.keys(translations)).toContain("de");
      expect(Object.keys(translations)).toContain("it");
      expect(Object.keys(translations)).toContain("pt");
    });

    it("should have language names for all languages", () => {
      expect(languageNames.fr).toBe("Français");
      expect(languageNames.en).toBe("English");
      expect(languageNames.es).toBe("Español");
      expect(languageNames.de).toBe("Deutsch");
      expect(languageNames.it).toBe("Italiano");
      expect(languageNames.pt).toBe("Português");
    });

    it("should have flag emojis for all languages", () => {
      expect(languageFlags.fr).toBe("🇫🇷");
      expect(languageFlags.en).toBe("🇬🇧");
      expect(languageFlags.es).toBe("🇪🇸");
      expect(languageFlags.de).toBe("🇩🇪");
      expect(languageFlags.it).toBe("🇮🇹");
      expect(languageFlags.pt).toBe("🇵🇹");
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

  describe("German Translations", () => {
    it("should have brand information", () => {
      expect(de.brand.name).toBe("L'Écrin Virtuel");
      expect(de.brand.slogan).toBeDefined();
      expect(de.brand.tagline).toBe("Virtuelles Schmuck-Anprobieren");
    });

    it("should have common translations", () => {
      expect(de.common.save).toBe("Speichern");
      expect(de.common.cancel).toBe("Abbrechen");
      expect(de.common.delete).toBe("Löschen");
      expect(de.common.edit).toBe("Bearbeiten");
      expect(de.common.share).toBe("Teilen");
      expect(de.common.loading).toBe("Laden...");
    });

    it("should have home screen translations", () => {
      expect(de.home.virtualTryOn).toBe("Virtuelles Anprobieren");
      expect(de.home.newTryOn).toBe("Neue Anprobe");
      expect(de.home.myCollection).toBe("Meine Schatulle");
    });

    it("should have try-on screen translations", () => {
      expect(de.tryOn.title).toBe("Anprobe");
      expect(de.tryOn.selectJewelry).toBeDefined();
      expect(de.tryOn.takePhoto).toBe("Foto aufnehmen");
    });

    it("should have settings translations", () => {
      expect(de.settings.title).toBe("Einstellungen");
      expect(de.settings.language).toBe("Sprache");
      expect(de.settings.theme).toBe("Design");
    });

    it("should have boutique translations", () => {
      expect(de.boutique.title).toBeDefined();
      expect(de.boutique.featuredPartners).toBe("Partner im Fokus");
      expect(de.boutique.visitBrand).toBe("Marke besuchen");
    });

    it("should have AI stylist translations", () => {
      expect(de.aiStylist.title).toBe("KI Stylist");
      expect(de.aiStylist.generateLooks).toBe("Looks generieren");
      expect(de.aiStylist.saveLook).toBeDefined();
    });
  });

  describe("Italian Translations", () => {
    it("should have brand information", () => {
      expect(itLang.brand.name).toBe("L'Écrin Virtuel");
      expect(itLang.brand.slogan).toBeDefined();
      expect(itLang.brand.tagline).toBe("Prova virtuale di gioielli");
    });

    it("should have common translations", () => {
      expect(itLang.common.save).toBe("Salva");
      expect(itLang.common.cancel).toBe("Annulla");
      expect(itLang.common.delete).toBe("Elimina");
      expect(itLang.common.edit).toBe("Modifica");
      expect(itLang.common.share).toBe("Condividi");
      expect(itLang.common.loading).toBe("Caricamento...");
    });

    it("should have home screen translations", () => {
      expect(itLang.home.virtualTryOn).toBe("Prova Virtuale");
      expect(itLang.home.newTryOn).toBe("Nuova Prova");
      expect(itLang.home.myCollection).toBe("Il Mio Scrigno");
    });

    it("should have try-on screen translations", () => {
      expect(itLang.tryOn.title).toBe("Prova");
      expect(itLang.tryOn.selectJewelry).toBeDefined();
      expect(itLang.tryOn.takePhoto).toBe("Scatta una foto");
    });

    it("should have settings translations", () => {
      expect(itLang.settings.title).toBe("Impostazioni");
      expect(itLang.settings.language).toBe("Lingua");
      expect(itLang.settings.theme).toBe("Tema");
    });

    it("should have boutique translations", () => {
      expect(itLang.boutique.title).toBeDefined();
      expect(itLang.boutique.featuredPartners).toBe("Partner in Evidenza");
      expect(itLang.boutique.visitBrand).toBe("Visita il Marchio");
    });

    it("should have AI stylist translations", () => {
      expect(itLang.aiStylist.title).toBe("Stilista IA");
      expect(itLang.aiStylist.generateLooks).toBe("Genera look");
      expect(itLang.aiStylist.saveLook).toBeDefined();
    });
  });

  describe("Portuguese Translations", () => {
    it("should have brand information", () => {
      expect(pt.brand.name).toBe("L'Écrin Virtuel");
      expect(pt.brand.slogan).toBeDefined();
      expect(pt.brand.tagline).toBe("Prova virtual de joias");
    });

    it("should have common translations", () => {
      expect(pt.common.save).toBe("Salvar");
      expect(pt.common.cancel).toBe("Cancelar");
      expect(pt.common.delete).toBe("Excluir");
      expect(pt.common.edit).toBe("Editar");
      expect(pt.common.share).toBe("Compartilhar");
      expect(pt.common.loading).toBe("Carregando...");
    });

    it("should have home screen translations", () => {
      expect(pt.home.virtualTryOn).toBe("Prova Virtual");
      expect(pt.home.newTryOn).toBe("Nova Prova");
      expect(pt.home.myCollection).toBe("Meu Estojo");
    });

    it("should have try-on screen translations", () => {
      expect(pt.tryOn.title).toBe("Prova");
      expect(pt.tryOn.selectJewelry).toBeDefined();
      expect(pt.tryOn.takePhoto).toBe("Tirar uma foto");
    });

    it("should have settings translations", () => {
      expect(pt.settings.title).toBe("Configurações");
      expect(pt.settings.language).toBe("Idioma");
      expect(pt.settings.theme).toBe("Tema");
    });

    it("should have boutique translations", () => {
      expect(pt.boutique.title).toBeDefined();
      expect(pt.boutique.featuredPartners).toBe("Parceiros em Destaque");
      expect(pt.boutique.visitBrand).toBe("Visitar a Marca");
    });

    it("should have AI stylist translations", () => {
      expect(pt.aiStylist.title).toBe("Estilista IA");
      expect(pt.aiStylist.generateLooks).toBe("Gerar looks");
      expect(pt.aiStylist.saveLook).toBeDefined();
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

    it("should have all French keys in German", () => {
      const deKeys = getAllKeys(de);
      const missingKeys = frKeys.filter(key => !deKeys.includes(key));
      expect(missingKeys).toEqual([]);
    });

    it("should have all French keys in Italian", () => {
      const itKeys = getAllKeys(itLang);
      const missingKeys = frKeys.filter(key => !itKeys.includes(key));
      expect(missingKeys).toEqual([]);
    });

    it("should have all French keys in Portuguese", () => {
      const ptKeys = getAllKeys(pt);
      const missingKeys = frKeys.filter(key => !ptKeys.includes(key));
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

    it("should not have empty translations in German", () => {
      const emptyKeys = findEmptyValues(de);
      expect(emptyKeys).toEqual([]);
    });

    it("should not have empty translations in Italian", () => {
      const emptyKeys = findEmptyValues(itLang);
      expect(emptyKeys).toEqual([]);
    });

    it("should not have empty translations in Portuguese", () => {
      const emptyKeys = findEmptyValues(pt);
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

    it("should return German translations for 'de'", () => {
      const result = getTranslation("de");
      expect(result.brand.name).toBe("L'Écrin Virtuel");
    });

    it("should return Italian translations for 'it'", () => {
      const result = getTranslation("it");
      expect(result.brand.name).toBe("L'Écrin Virtuel");
    });

    it("should return Portuguese translations for 'pt'", () => {
      const result = getTranslation("pt");
      expect(result.brand.name).toBe("L'Écrin Virtuel");
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

    it("should have all jewelry types in German", () => {
      expect(de.jewelryTypes.necklace).toBe("Halskette");
      expect(de.jewelryTypes.earrings).toBe("Ohrringe");
      expect(de.jewelryTypes.ring).toBe("Ring");
      expect(de.jewelryTypes.bracelet).toBe("Armband");
      expect(de.jewelryTypes.anklet).toBe("Fußkettchen");
    });

    it("should have all jewelry types in Italian", () => {
      expect(itLang.jewelryTypes.necklace).toBe("Collana");
      expect(itLang.jewelryTypes.earrings).toBe("Orecchini");
      expect(itLang.jewelryTypes.ring).toBe("Anello");
      expect(itLang.jewelryTypes.bracelet).toBe("Bracciale");
      expect(itLang.jewelryTypes.anklet).toBe("Cavigliera");
    });

    it("should have all jewelry types in Portuguese", () => {
      expect(pt.jewelryTypes.necklace).toBe("Colar");
      expect(pt.jewelryTypes.earrings).toBe("Brincos");
      expect(pt.jewelryTypes.ring).toBe("Anel");
      expect(pt.jewelryTypes.bracelet).toBe("Pulseira");
      expect(pt.jewelryTypes.anklet).toBe("Tornozeleira");
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

    it("should have all metal styles in German", () => {
      expect(de.jewelryStyles.gold).toBe("Gold");
      expect(de.jewelryStyles.silver).toBe("Silber");
      expect(de.jewelryStyles.rosegold).toBe("Roségold");
    });

    it("should have all metal styles in Italian", () => {
      expect(itLang.jewelryStyles.gold).toBe("Oro");
      expect(itLang.jewelryStyles.silver).toBe("Argento");
      expect(itLang.jewelryStyles.rosegold).toBe("Oro Rosa");
    });

    it("should have all metal styles in Portuguese", () => {
      expect(pt.jewelryStyles.gold).toBe("Ouro");
      expect(pt.jewelryStyles.silver).toBe("Prata");
      expect(pt.jewelryStyles.rosegold).toBe("Ouro Rosé");
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

    it("should have photo editor section in German", () => {
      expect(de.photoEditor).toBeDefined();
      expect(typeof de.photoEditor).toBe("object");
    });

    it("should have photo editor section in Italian", () => {
      expect(itLang.photoEditor).toBeDefined();
      expect(typeof itLang.photoEditor).toBe("object");
    });

    it("should have photo editor section in Portuguese", () => {
      expect(pt.photoEditor).toBeDefined();
      expect(typeof pt.photoEditor).toBe("object");
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
