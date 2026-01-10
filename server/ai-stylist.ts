import { invokeLLM } from "./_core/llm";

// Types
export interface WardrobeItemForStyling {
  id: number;
  name: string;
  category: string;
  brand?: string | null;
  color?: string | null;
  material?: string | null;
  imageUrl?: string | null;
  season?: string | null;
  occasion?: string | null;
}

export interface JewelryItemForStyling {
  id: number;
  name: string;
  type: string;
  metal?: string | null;
  gem?: string | null;
  brand?: string | null;
  imageUrl?: string | null;
}

export interface LookSuggestion {
  name: string;
  description: string;
  occasion: "casual" | "work" | "formal" | "sport" | "party" | "all";
  season: "spring" | "summer" | "fall" | "winter" | "all";
  wardrobeItemIds: number[];
  jewelryItemIds: number[];
  stylingTips: string;
  confidence: number;
}

export interface StylistRequest {
  wardrobeItems: WardrobeItemForStyling[];
  jewelryItems: JewelryItemForStyling[];
  occasion?: string;
  season?: string;
  style?: string;
  count?: number;
}

/**
 * Generate look suggestions using AI
 */
export async function generateLookSuggestions(
  request: StylistRequest
): Promise<LookSuggestion[]> {
  const { wardrobeItems, jewelryItems, occasion, season, style, count = 3 } = request;

  if (wardrobeItems.length === 0) {
    return [];
  }

  // Build the prompt
  const wardrobeDescription = wardrobeItems.map((item) => {
    const parts = [`- ${item.name} (${item.category})`];
    if (item.brand) parts.push(`marque: ${item.brand}`);
    if (item.color) parts.push(`couleur: ${item.color}`);
    if (item.material) parts.push(`matière: ${item.material}`);
    return parts.join(", ");
  }).join("\n");

  const jewelryDescription = jewelryItems.length > 0
    ? jewelryItems.map((item) => {
        const parts = [`- ${item.name} (${item.type})`];
        if (item.metal) parts.push(`métal: ${item.metal}`);
        if (item.gem) parts.push(`pierre: ${item.gem}`);
        if (item.brand) parts.push(`marque: ${item.brand}`);
        return parts.join(", ");
      }).join("\n")
    : "Aucun bijou disponible";

  const constraints: string[] = [];
  if (occasion) constraints.push(`Occasion: ${occasion}`);
  if (season) constraints.push(`Saison: ${season}`);
  if (style) constraints.push(`Style recherché: ${style}`);

  const prompt = `Tu es un styliste de mode professionnel. Analyse les vêtements et bijoux suivants et propose ${count} looks harmonieux.

GARDE-ROBE:
${wardrobeDescription}

BIJOUX:
${jewelryDescription}

${constraints.length > 0 ? `CONTRAINTES:\n${constraints.join("\n")}\n` : ""}

Pour chaque look, fournis:
1. Un nom accrocheur
2. Une description courte
3. L'occasion (casual, work, formal, sport, party)
4. La saison (spring, summer, fall, winter, all)
5. Les IDs des vêtements à utiliser (liste)
6. Les IDs des bijoux à utiliser (liste, peut être vide)
7. Des conseils de style personnalisés
8. Un score de confiance (0-100)

Réponds UNIQUEMENT en JSON valide avec ce format:
{
  "looks": [
    {
      "name": "string",
      "description": "string",
      "occasion": "casual|work|formal|sport|party|all",
      "season": "spring|summer|fall|winter|all",
      "wardrobeItemIds": [number],
      "jewelryItemIds": [number],
      "stylingTips": "string",
      "confidence": number
    }
  ]
}

IDs disponibles:
- Vêtements: ${wardrobeItems.map((i) => i.id).join(", ")}
- Bijoux: ${jewelryItems.map((i) => i.id).join(", ") || "aucun"}`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      maxTokens: 2000,
    });

    // Parse the response
    const message = response.choices[0]?.message;
    const content = typeof message?.content === "string" 
      ? message.content 
      : Array.isArray(message?.content) 
        ? message.content.map((c: any) => c.type === "text" ? c.text : "").join("")
        : "";
    
    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[AI Stylist] No JSON found in response:", content);
      return generateFallbackSuggestions(wardrobeItems, jewelryItems, count);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.looks || !Array.isArray(parsed.looks)) {
      console.error("[AI Stylist] Invalid response format:", parsed);
      return generateFallbackSuggestions(wardrobeItems, jewelryItems, count);
    }

    // Validate and clean the suggestions
    return parsed.looks.map((look: any): LookSuggestion => ({
      name: look.name || "Look sans nom",
      description: look.description || "",
      occasion: validateOccasion(look.occasion),
      season: validateSeason(look.season),
      wardrobeItemIds: validateIds(look.wardrobeItemIds, wardrobeItems.map((i) => i.id)),
      jewelryItemIds: validateIds(look.jewelryItemIds, jewelryItems.map((i) => i.id)),
      stylingTips: look.stylingTips || "",
      confidence: Math.min(100, Math.max(0, look.confidence || 70)),
    }));
  } catch (error) {
    console.error("[AI Stylist] Error generating suggestions:", error);
    return generateFallbackSuggestions(wardrobeItems, jewelryItems, count);
  }
}

/**
 * Generate styling tips for a specific combination
 */
export async function generateStylingTips(
  wardrobeItems: WardrobeItemForStyling[],
  jewelryItems: JewelryItemForStyling[],
  occasion?: string
): Promise<string> {
  if (wardrobeItems.length === 0) {
    return "Ajoutez des vêtements à votre dressing pour recevoir des conseils personnalisés.";
  }

  const itemsDescription = [
    ...wardrobeItems.map((i) => `${i.name} (${i.category})`),
    ...jewelryItems.map((i) => `${i.name} (${i.type})`),
  ].join(", ");

  const prompt = `En tant que styliste, donne 2-3 conseils courts et pratiques pour porter ensemble: ${itemsDescription}.${occasion ? ` Pour une occasion: ${occasion}.` : ""} Réponds en français, de manière concise et encourageante.`;

  try {
    const response = await invokeLLM({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 300,
    });

    const message = response.choices[0]?.message;
    const content = typeof message?.content === "string" 
      ? message.content 
      : Array.isArray(message?.content) 
        ? message.content.map((c: any) => c.type === "text" ? c.text : "").join("")
        : "";
    return content.trim();
  } catch (error) {
    console.error("[AI Stylist] Error generating tips:", error);
    return "Combinez ces pièces pour un look élégant et harmonieux.";
  }
}

/**
 * Analyze color harmony between items
 */
export async function analyzeColorHarmony(
  colors: string[]
): Promise<{ score: number; feedback: string }> {
  if (colors.length < 2) {
    return { score: 100, feedback: "Ajoutez plus de pièces pour analyser l'harmonie des couleurs." };
  }

  const prompt = `En tant qu'expert en mode, analyse l'harmonie des couleurs suivantes: ${colors.join(", ")}.
Réponds en JSON: { "score": number (0-100), "feedback": "string court en français" }`;

  try {
    const response = await invokeLLM({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 200,
    });

    const message = response.choices[0]?.message;
    const content = typeof message?.content === "string" 
      ? message.content 
      : Array.isArray(message?.content) 
        ? message.content.map((c: any) => c.type === "text" ? c.text : "").join("")
        : "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.min(100, Math.max(0, parsed.score || 70)),
        feedback: parsed.feedback || "Combinaison intéressante.",
      };
    }
  } catch (error) {
    console.error("[AI Stylist] Error analyzing colors:", error);
  }

  return { score: 70, feedback: "Combinaison de couleurs acceptable." };
}

// Helper functions
function validateOccasion(value: string): LookSuggestion["occasion"] {
  const valid = ["casual", "work", "formal", "sport", "party", "all"];
  return valid.includes(value) ? (value as LookSuggestion["occasion"]) : "all";
}

function validateSeason(value: string): LookSuggestion["season"] {
  const valid = ["spring", "summer", "fall", "winter", "all"];
  return valid.includes(value) ? (value as LookSuggestion["season"]) : "all";
}

function validateIds(ids: any, validIds: number[]): number[] {
  if (!Array.isArray(ids)) return [];
  return ids.filter((id) => typeof id === "number" && validIds.includes(id));
}

function generateFallbackSuggestions(
  wardrobeItems: WardrobeItemForStyling[],
  jewelryItems: JewelryItemForStyling[],
  count: number
): LookSuggestion[] {
  const suggestions: LookSuggestion[] = [];
  
  // Group items by category
  const tops = wardrobeItems.filter((i) => i.category === "tops");
  const bottoms = wardrobeItems.filter((i) => i.category === "bottoms");
  const dresses = wardrobeItems.filter((i) => i.category === "dresses");
  
  // Generate simple combinations
  for (let i = 0; i < Math.min(count, 3); i++) {
    const wardrobeIds: number[] = [];
    const jewelryIds: number[] = [];
    
    if (dresses.length > i) {
      wardrobeIds.push(dresses[i].id);
    } else {
      if (tops.length > i) wardrobeIds.push(tops[i].id);
      if (bottoms.length > i) wardrobeIds.push(bottoms[i].id);
    }
    
    if (jewelryItems.length > i) {
      jewelryIds.push(jewelryItems[i].id);
    }
    
    if (wardrobeIds.length > 0) {
      suggestions.push({
        name: `Look ${i + 1}`,
        description: "Suggestion générée automatiquement",
        occasion: "all",
        season: "all",
        wardrobeItemIds: wardrobeIds,
        jewelryItemIds: jewelryIds,
        stylingTips: "Combinez ces pièces pour un look harmonieux.",
        confidence: 60,
      });
    }
  }
  
  return suggestions;
}
