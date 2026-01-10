import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
  Linking,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

// Types
type JewelryType = "necklace" | "earrings" | "ring" | "bracelet" | "anklet" | "brooch" | "set";
type MetalType = "gold" | "silver" | "rose_gold" | "platinum" | "brass" | "copper" | "resin" | "polymer" | "other";
type GemType = "diamond" | "ruby" | "sapphire" | "emerald" | "pearl" | "crystal" | "none" | "other";

interface PartnerBrand {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  isPremium: boolean | null;
  isFeatured: boolean | null;
  specialty: string | null;
  country: string | null;
}

interface PartnerJewelry {
  id: number;
  brandId: number;
  name: string;
  type: JewelryType;
  description: string | null;
  priceInCents: number | null;
  currency: string | null;
  imageUrl: string | null;
  productUrl: string | null;
  metalType: MetalType | null;
  gemType: GemType | null;
  collection: string | null;
  tags: string | null;
  isTryOnEnabled: boolean | null;
  tryOnImageUrl: string | null;
}

// Filter options
const JEWELRY_TYPES: { value: JewelryType | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "necklace", label: "Colliers" },
  { value: "earrings", label: "Boucles d'oreilles" },
  { value: "ring", label: "Bagues" },
  { value: "bracelet", label: "Bracelets" },
  { value: "anklet", label: "Chevillières" },
  { value: "brooch", label: "Broches" },
  { value: "set", label: "Parures" },
];

const METAL_TYPES: { value: MetalType | "all"; label: string }[] = [
  { value: "all", label: "Tous métaux" },
  { value: "gold", label: "Or" },
  { value: "silver", label: "Argent" },
  { value: "rose_gold", label: "Or rose" },
  { value: "platinum", label: "Platine" },
  { value: "resin", label: "Résine" },
  { value: "polymer", label: "Polymère" },
  { value: "other", label: "Autre" },
];

const GEM_TYPES: { value: GemType | "all"; label: string }[] = [
  { value: "all", label: "Toutes pierres" },
  { value: "diamond", label: "Diamant" },
  { value: "ruby", label: "Rubis" },
  { value: "sapphire", label: "Saphir" },
  { value: "emerald", label: "Émeraude" },
  { value: "pearl", label: "Perle" },
  { value: "crystal", label: "Cristal" },
  { value: "none", label: "Sans pierre" },
];

// Partenaire exclusif: Moni'attitude
const DEMO_BRAND: PartnerBrand = {
  id: 1,
  name: "Moni'attitude",
  slug: "moniattitude",
  description: "Bijoux artisanaux en résine, pièces uniques faites main avec amour.",
  logoUrl: null,
  websiteUrl: "https://moniattitude.com",
  isPremium: true,
  isFeatured: true,
  specialty: "Bijoux artisanaux - Pièces uniques",
  country: "France",
};

const DEMO_JEWELRY: PartnerJewelry[] = [
  {
    id: 1,
    brandId: 1,
    name: "Boucles d'oreilles en résine",
    type: "earrings",
    description: "Magnifiques boucles d'oreilles artisanales en résine avec motifs géométriques uniques.",
    priceInCents: null,
    currency: null,
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400",
    productUrl: "https://moniattitude.com",
    metalType: "resin",
    gemType: "none",
    collection: "Géométrique",
    tags: JSON.stringify(["artisanat", "résine", "géométrique"]),
    isTryOnEnabled: true,
    tryOnImageUrl: null,
  },
  {
    id: 2,
    brandId: 1,
    name: "Boucles d'oreilles camel & reflets",
    type: "earrings",
    description: "Boucles d'oreilles en polymère couleur camel avec reflets dorés.",
    priceInCents: null,
    currency: null,
    imageUrl: "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=400",
    productUrl: "https://moniattitude.com",
    metalType: "polymer",
    gemType: "none",
    collection: "Reflets",
    tags: JSON.stringify(["polymère", "camel", "or"]),
    isTryOnEnabled: true,
    tryOnImageUrl: null,
  },
  {
    id: 3,
    brandId: 1,
    name: "Boucles d'oreilles bleu géométrique",
    type: "earrings",
    description: "Élégantes boucles d'oreilles bleues avec design géométrique moderne.",
    priceInCents: null,
    currency: null,
    imageUrl: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400",
    productUrl: "https://moniattitude.com",
    metalType: "resin",
    gemType: "none",
    collection: "Géométrique",
    tags: JSON.stringify(["bleu", "résine", "moderne"]),
    isTryOnEnabled: true,
    tryOnImageUrl: null,
  },
  {
    id: 4,
    brandId: 1,
    name: "Boucles d'oreilles fleur dorée",
    type: "earrings",
    description: "Boucles d'oreilles en forme de fleur avec finition dorée naturelle.",
    priceInCents: null,
    currency: null,
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400",
    productUrl: "https://moniattitude.com",
    metalType: "polymer",
    gemType: "none",
    collection: "Nature",
    tags: JSON.stringify(["fleur", "doré", "nature"]),
    isTryOnEnabled: true,
    tryOnImageUrl: null,
  },
];

// Format price
function formatPrice(priceInCents: number | null, currency: string | null): string {
  // Prix non affichés - redirection vers moniattitude.com
  return "Voir sur moniattitude.com";
}

// Parse tags
function parseTags(tags: string | null): string[] {
  if (!tags) return [];
  try {
    return JSON.parse(tags);
  } catch {
    return [];
  }
}

// Brand Card Component
function BrandCard({ brand, onPress }: { brand: PartnerBrand; onPress: () => void }) {
  const colors = useColors();
  
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-surface rounded-2xl p-4 mr-4"
      style={{ width: 200 }}
      activeOpacity={0.7}
    >
      <View className="items-center mb-3">
        {brand.logoUrl ? (
          <Image
            source={{ uri: brand.logoUrl }}
            style={{ width: 80, height: 80, borderRadius: 40 }}
            contentFit="cover"
          />
        ) : (
          <View 
            className="items-center justify-center rounded-full"
            style={{ width: 80, height: 80, backgroundColor: colors.border }}
          >
            <Text className="text-2xl font-bold text-muted">
              {brand.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
          {brand.name}
        </Text>
        {brand.isPremium && (
          <View className="bg-primary/20 px-2 py-0.5 rounded">
            <Text className="text-xs text-primary font-medium">premium</Text>
          </View>
        )}
      </View>
      
      <Text className="text-xs text-muted mb-3" numberOfLines={2}>
        {brand.specialty || brand.description}
      </Text>
      
      <TouchableOpacity
        onPress={() => {
          if (brand.websiteUrl) {
            Linking.openURL(brand.websiteUrl);
          }
        }}
        className="flex-row items-center justify-center py-2 border border-border rounded-lg"
        activeOpacity={0.7}
      >
        <Text className="text-sm text-foreground mr-1">Visiter la Marque</Text>
        <IconSymbol name="arrow.up.right" size={14} color={colors.foreground} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// Jewelry Card Component
function JewelryCard({ 
  jewelry, 
  brand,
  isFavorite,
  onPress, 
  onFavoriteToggle,
  onTryOn,
}: { 
  jewelry: PartnerJewelry; 
  brand: PartnerBrand | undefined;
  isFavorite: boolean;
  onPress: () => void;
  onFavoriteToggle: () => void;
  onTryOn: () => void;
}) {
  const colors = useColors();
  const tags = parseTags(jewelry.tags);
  
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-surface rounded-2xl overflow-hidden mb-4"
      activeOpacity={0.7}
    >
      {/* Image */}
      <View className="relative">
        {jewelry.imageUrl ? (
          <Image
            source={{ uri: jewelry.imageUrl }}
            style={{ width: "100%", height: 180 }}
            contentFit="cover"
          />
        ) : (
          <View 
            className="items-center justify-center"
            style={{ width: "100%", height: 180, backgroundColor: colors.border }}
          >
            <IconSymbol name="diamond.fill" size={48} color={colors.muted} />
          </View>
        )}
        
        {/* Favorite button */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onFavoriteToggle();
          }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
          activeOpacity={0.7}
        >
          <IconSymbol 
            name={isFavorite ? "heart.fill" : "heart"} 
            size={20} 
            color={isFavorite ? "#EF4444" : colors.muted} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Content */}
      <View className="p-3">
        <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
          {jewelry.name}
        </Text>
        
        <Text className="text-xs text-primary font-medium uppercase mt-0.5">
          {brand?.name || "Marque"}
        </Text>
        
        {/* Tags */}
        {tags.length > 0 && (
          <View className="flex-row flex-wrap mt-2 gap-1">
            {tags.slice(0, 3).map((tag, index) => (
              <View key={index} className="bg-background px-2 py-0.5 rounded">
                <Text className="text-xs text-muted">{tag}</Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Price and Try-on */}
        <View className="flex-row items-center justify-between mt-3">
          <Text className="text-lg font-bold text-foreground">
            {formatPrice(jewelry.priceInCents, jewelry.currency)}
          </Text>
          
          {jewelry.isTryOnEnabled && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onTryOn();
              }}
              className="bg-primary px-3 py-1.5 rounded-lg flex-row items-center"
              activeOpacity={0.7}
            >
              <IconSymbol name="camera.fill" size={14} color="#fff" />
              <Text className="text-xs text-white font-medium ml-1">Essayer</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Filter Dropdown Component
function FilterDropdown({ 
  label, 
  value, 
  options, 
  onChange 
}: { 
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const colors = useColors();
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);
  
  return (
    <View className="relative">
      <TouchableOpacity
        onPress={() => setIsOpen(!isOpen)}
        className="flex-row items-center bg-surface px-3 py-2 rounded-lg border border-border mr-2"
        activeOpacity={0.7}
      >
        <Text className="text-sm text-foreground mr-1" numberOfLines={1}>
          {selectedOption?.label || label}
        </Text>
        <IconSymbol name="chevron.down" size={16} color={colors.muted} />
      </TouchableOpacity>
      
      {isOpen && (
        <Modal
          visible={isOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsOpen(false)}
        >
          <Pressable 
            className="flex-1 bg-black/50 justify-center items-center"
            onPress={() => setIsOpen(false)}
          >
            <View className="bg-background rounded-2xl p-4 w-64 max-h-80">
              <Text className="text-lg font-semibold text-foreground mb-3">{label}</Text>
              <ScrollView>
                {options.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`py-3 px-3 rounded-lg mb-1 ${value === option.value ? 'bg-primary/10' : ''}`}
                    activeOpacity={0.7}
                  >
                    <Text className={`text-base ${value === option.value ? 'text-primary font-medium' : 'text-foreground'}`}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

// Main Screen
export default function BoutiqueScreen() {
  const colors = useColors();
  const router = useRouter();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<JewelryType | "all">("all");
  const [selectedMetal, setSelectedMetal] = useState<MetalType | "all">("all");
  const [selectedGem, setSelectedGem] = useState<GemType | "all">("all");
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedJewelry, setSelectedJewelry] = useState<PartnerJewelry | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  
  // API queries (using demo data for now)
  const brands = [DEMO_BRAND];
  const jewelry = DEMO_JEWELRY;
  const isLoading = false;
  
  // Filter jewelry
  const filteredJewelry = useMemo(() => {
    let filtered = jewelry;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(j => 
        j.name.toLowerCase().includes(query) ||
        j.description?.toLowerCase().includes(query) ||
        parseTags(j.tags).some(t => t.toLowerCase().includes(query))
      );
    }
    
    if (selectedType !== "all") {
      filtered = filtered.filter(j => j.type === selectedType);
    }
    
    if (selectedMetal !== "all") {
      filtered = filtered.filter(j => j.metalType === selectedMetal);
    }
    
    if (selectedGem !== "all") {
      filtered = filtered.filter(j => j.gemType === selectedGem);
    }
    
    if (selectedBrandId) {
      filtered = filtered.filter(j => j.brandId === selectedBrandId);
    }
    
    return filtered;
  }, [jewelry, searchQuery, selectedType, selectedMetal, selectedGem, selectedBrandId]);
  
  // Get brand by ID
  const getBrand = useCallback((brandId: number) => {
    return brands.find(b => b.id === brandId);
  }, [brands]);
  
  // Toggle favorite
  const toggleFavorite = useCallback((jewelryId: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(jewelryId)) {
        next.delete(jewelryId);
      } else {
        next.add(jewelryId);
      }
      return next;
    });
  }, []);
  
  // Handle try-on
  const handleTryOn = useCallback((jewelry: PartnerJewelry) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // Navigate to try-on screen with jewelry info
    router.push({
      pathname: "/(tabs)/tryon",
      params: {
        partnerJewelryId: jewelry.id,
        partnerJewelryName: jewelry.name,
        partnerJewelryType: jewelry.type,
        partnerJewelryImage: jewelry.imageUrl || "",
      },
    });
  }, [router]);
  
  // Handle visit brand
  const handleVisitBrand = useCallback((brand: PartnerBrand) => {
    if (brand.websiteUrl) {
      Linking.openURL(brand.websiteUrl);
    }
  }, []);
  
  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Header */}
        <View className="bg-foreground mx-4 mt-4 rounded-2xl p-6">
          <View className="flex-row items-center mb-2">
            <IconSymbol name="crown.fill" size={16} color={colors.primary} />
            <Text className="text-xs text-primary font-medium ml-1">
              Marques & Créateurs Partenaires
            </Text>
          </View>
          
          <Text className="text-2xl font-bold text-background mb-2">
            Boutique Style Sélectionné
          </Text>
          
          <Text className="text-sm text-background/70 mb-4">
            Découvrez des collections exclusives de marques de luxe et de stylistes experts.
            Achetez le look en un clic.
          </Text>
          
          <TouchableOpacity
            onPress={() => {}}
            className="bg-background self-start px-4 py-2 rounded-lg flex-row items-center"
            activeOpacity={0.7}
          >
            <IconSymbol name="sparkles" size={16} color={colors.foreground} />
            <Text className="text-sm text-foreground font-medium ml-2">
              Explorer les Collections
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Featured Brands */}
        <View className="mt-6 px-4">
          <View className="flex-row items-center mb-4">
            <IconSymbol name="crown.fill" size={18} color={colors.primary} />
            <Text className="text-lg font-bold text-foreground ml-2">
              Partenaires Vedettes
            </Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {brands.filter(b => b.isFeatured).map(brand => (
              <BrandCard 
                key={brand.id} 
                brand={brand} 
                onPress={() => handleVisitBrand(brand)}
              />
            ))}
          </ScrollView>
        </View>
        
        {/* Search and Filters */}
        <View className="mt-6 px-4">
          {/* Search Bar */}
          <View className="flex-row items-center bg-surface rounded-xl px-4 py-3 mb-4">
            <IconSymbol name="magnifyingglass" size={20} color={colors.muted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Rechercher par nom, tags, description..."
              placeholderTextColor={colors.muted}
              className="flex-1 ml-3 text-base text-foreground"
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <IconSymbol name="xmark" size={18} color={colors.muted} />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Type Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            {JEWELRY_TYPES.map(type => (
              <TouchableOpacity
                key={type.value}
                onPress={() => setSelectedType(type.value)}
                className={`px-4 py-2 rounded-full mr-2 ${
                  selectedType === type.value ? 'bg-foreground' : 'bg-surface border border-border'
                }`}
                activeOpacity={0.7}
              >
                <Text className={`text-sm font-medium ${
                  selectedType === type.value ? 'text-background' : 'text-foreground'
                }`}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Dropdown Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <FilterDropdown
              label="Métaux"
              value={selectedMetal}
              options={METAL_TYPES}
              onChange={(v) => setSelectedMetal(v as MetalType | "all")}
            />
            <FilterDropdown
              label="Pierres"
              value={selectedGem}
              options={GEM_TYPES}
              onChange={(v) => setSelectedGem(v as GemType | "all")}
            />
          </ScrollView>
        </View>
        
        {/* Jewelry Grid */}
        <View className="mt-6 px-4 pb-8">
          {isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : filteredJewelry.length === 0 ? (
            <View className="items-center py-12 bg-surface rounded-2xl">
              <IconSymbol name="magnifyingglass" size={48} color={colors.muted} />
              <Text className="text-lg font-medium text-foreground mt-4">
                Aucun bijou trouvé
              </Text>
              <Text className="text-sm text-muted mt-1 text-center">
                Essayez de modifier vos filtres ou votre recherche
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {filteredJewelry.map(item => (
                <View key={item.id} style={{ width: "48%" }}>
                  <JewelryCard
                    jewelry={item}
                    brand={getBrand(item.brandId)}
                    isFavorite={favorites.has(item.id)}
                    onPress={() => setSelectedJewelry(item)}
                    onFavoriteToggle={() => toggleFavorite(item.id)}
                    onTryOn={() => handleTryOn(item)}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Jewelry Detail Modal */}
      <Modal
        visible={selectedJewelry !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedJewelry(null)}
      >
        {selectedJewelry && (
          <View className="flex-1 bg-background">
            <ScrollView className="flex-1">
              {/* Header */}
              <View className="flex-row items-center justify-between p-4 border-b border-border">
                <TouchableOpacity onPress={() => setSelectedJewelry(null)}>
                  <IconSymbol name="xmark" size={24} color={colors.foreground} />
                </TouchableOpacity>
                <Text className="text-lg font-semibold text-foreground">Détails</Text>
                <TouchableOpacity onPress={() => toggleFavorite(selectedJewelry.id)}>
                  <IconSymbol 
                    name={favorites.has(selectedJewelry.id) ? "heart.fill" : "heart"} 
                    size={24} 
                    color={favorites.has(selectedJewelry.id) ? "#EF4444" : colors.foreground} 
                  />
                </TouchableOpacity>
              </View>
              
              {/* Image */}
              {selectedJewelry.imageUrl && (
                <Image
                  source={{ uri: selectedJewelry.imageUrl }}
                  style={{ width: "100%", height: 300 }}
                  contentFit="cover"
                />
              )}
              
              {/* Content */}
              <View className="p-4">
                <Text className="text-xs text-primary font-medium uppercase">
                  {getBrand(selectedJewelry.brandId)?.name || "Marque"}
                </Text>
                
                <Text className="text-2xl font-bold text-foreground mt-1">
                  {selectedJewelry.name}
                </Text>
                
                <Text className="text-2xl font-bold text-primary mt-2">
                  {formatPrice(selectedJewelry.priceInCents, selectedJewelry.currency)}
                </Text>
                
                {selectedJewelry.description && (
                  <Text className="text-base text-muted mt-4 leading-6">
                    {selectedJewelry.description}
                  </Text>
                )}
                
                {/* Tags */}
                {parseTags(selectedJewelry.tags).length > 0 && (
                  <View className="flex-row flex-wrap mt-4 gap-2">
                    {parseTags(selectedJewelry.tags).map((tag, index) => (
                      <View key={index} className="bg-surface px-3 py-1.5 rounded-full">
                        <Text className="text-sm text-foreground">{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
                
                {/* Details */}
                <View className="mt-6 bg-surface rounded-xl p-4">
                  <Text className="text-base font-semibold text-foreground mb-3">
                    Caractéristiques
                  </Text>
                  
                  {selectedJewelry.metalType && (
                    <View className="flex-row justify-between py-2 border-b border-border">
                      <Text className="text-sm text-muted">Matériau</Text>
                      <Text className="text-sm text-foreground font-medium">
                        {METAL_TYPES.find(m => m.value === selectedJewelry.metalType)?.label || selectedJewelry.metalType}
                      </Text>
                    </View>
                  )}
                  
                  {selectedJewelry.gemType && selectedJewelry.gemType !== "none" && (
                    <View className="flex-row justify-between py-2 border-b border-border">
                      <Text className="text-sm text-muted">Pierre</Text>
                      <Text className="text-sm text-foreground font-medium">
                        {GEM_TYPES.find(g => g.value === selectedJewelry.gemType)?.label || selectedJewelry.gemType}
                      </Text>
                    </View>
                  )}
                  
                  {selectedJewelry.collection && (
                    <View className="flex-row justify-between py-2">
                      <Text className="text-sm text-muted">Collection</Text>
                      <Text className="text-sm text-foreground font-medium">
                        {selectedJewelry.collection}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
            
            {/* Bottom Actions */}
            <View className="p-4 border-t border-border bg-background">
              <View className="flex-row gap-3">
                {selectedJewelry.isTryOnEnabled && (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedJewelry(null);
                      handleTryOn(selectedJewelry);
                    }}
                    className="flex-1 bg-surface py-4 rounded-xl flex-row items-center justify-center"
                    activeOpacity={0.7}
                  >
                    <IconSymbol name="camera.fill" size={20} color={colors.foreground} />
                    <Text className="text-base font-semibold text-foreground ml-2">
                      Essayer
                    </Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  onPress={() => {
                    const brand = getBrand(selectedJewelry.brandId);
                    if (selectedJewelry.productUrl) {
                      Linking.openURL(selectedJewelry.productUrl);
                    } else if (brand?.websiteUrl) {
                      Linking.openURL(brand.websiteUrl);
                    }
                  }}
                  className="flex-1 bg-primary py-4 rounded-xl flex-row items-center justify-center"
                  activeOpacity={0.7}
                >
                  <IconSymbol name="arrow.up.right" size={20} color="#fff" />
                  <Text className="text-base font-semibold text-white ml-2">
                    Voir sur le site
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </ScreenContainer>
  );
}
