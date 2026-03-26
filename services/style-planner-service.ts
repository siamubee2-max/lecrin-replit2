import type { DailyGenderLook, GenderLookAdvice } from "./daily-gender-look-service";

export type WeeklyEventType = "bureau" | "soiree" | "weekend";
export type OccasionType = "mariage" | "entretien" | "date" | "voyage";

export type WeeklyEventPlanItem = {
  isoDate: string;
  dayLabel: string;
  event: WeeklyEventType;
};

export type OccasionLookPlan = {
  occasion: OccasionType;
  title: string;
  subtitle: string;
  femme: GenderLookAdvice;
  homme: GenderLookAdvice;
  checklist: string[];
};

export function buildWeeklyEventPlan(startDate: Date, days: number = 7): WeeklyEventPlanItem[] {
  const list: WeeklyEventPlanItem[] = [];
  for (let i = 0; i < days; i += 1) {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + i);
    const day = current.getDay(); // 0=dimanche
    const event: WeeklyEventType = day === 0 || day === 6 ? "weekend" : day === 5 ? "soiree" : "bureau";
    list.push({
      isoDate: current.toISOString().split("T")[0],
      dayLabel: current.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric" }),
      event,
    });
  }
  return list;
}

function withOccasion(base: GenderLookAdvice, extra: {
  title: string;
  piece: string;
  accessory: string;
  tip: string;
}): GenderLookAdvice {
  return {
    ...base,
    title: extra.title,
    pieces: [...base.pieces, extra.piece],
    accessories: [...base.accessories, extra.accessory],
    tip: `${base.tip} ${extra.tip}`,
  };
}

export function buildOccasionLook(base: DailyGenderLook, occasion: OccasionType): OccasionLookPlan {
  if (occasion === "mariage") {
    return {
      occasion,
      title: "Look mariage",
      subtitle: "Elegance ceremonie, confort longue journee",
      femme: withOccasion(base.femme, {
        title: "Look femme - Mariage",
        piece: "Robe ou ensemble chic ceremonie",
        accessory: "Bijou lumineux raffine",
        tip: "Priorite a l'allure ceremonie sans sacrifier le confort.",
      }),
      homme: withOccasion(base.homme, {
        title: "Look homme - Mariage",
        piece: "Costume leger bien coupe",
        accessory: "Pochette ou montre habillee",
        tip: "Favoriser des matieres respirantes et une silhouette nette.",
      }),
      checklist: ["Chaussures confortables", "Veste adaptee a la meteo", "Accessoire statement discret"],
    };
  }
  if (occasion === "entretien") {
    return {
      occasion,
      title: "Look entretien",
      subtitle: "Credible, propre, professionnel",
      femme: withOccasion(base.femme, {
        title: "Look femme - Entretien",
        piece: "Blazer structure ou robe sobre",
        accessory: "Sac structure minimal",
        tip: "Couleurs neutres et coupe nette pour inspirer confiance.",
      }),
      homme: withOccasion(base.homme, {
        title: "Look homme - Entretien",
        piece: "Blazer + pantalon propre",
        accessory: "Ceinture cuir sobre",
        tip: "Tenue professionnelle, propre et sans surcharge.",
      }),
      checklist: ["Silhouette sobre", "Chaussures impeccables", "Palette neutre"],
    };
  }
  if (occasion === "date") {
    return {
      occasion,
      title: "Look date",
      subtitle: "Stylish, naturel, memorisable",
      femme: withOccasion(base.femme, {
        title: "Look femme - Date",
        piece: "Piece flatteuse confortable",
        accessory: "Bijou signature",
        tip: "Chercher l'equilibre entre charme et aisance.",
      }),
      homme: withOccasion(base.homme, {
        title: "Look homme - Date",
        piece: "Chemise/Polo premium + veste legere",
        accessory: "Montre discrete",
        tip: "Gardez une allure nette avec une touche personnelle.",
      }),
      checklist: ["Confort prioritaire", "Une piece signature", "Plan pluie/vent si besoin"],
    };
  }
  return {
    occasion,
    title: "Look voyage",
    subtitle: "Pratique, modulable, photogenic",
    femme: withOccasion(base.femme, {
      title: "Look femme - Voyage",
      piece: "Superposition facile a retirer",
      accessory: "Sac crossbody fonctionnel",
      tip: "Privilégier des pieces polyvalentes et des chaussures fiables.",
    }),
    homme: withOccasion(base.homme, {
      title: "Look homme - Voyage",
      piece: "Couche intermediaire respirante",
      accessory: "Sac compact multi-usage",
      tip: "Confort deplacement et adaptation rapide aux changements meteo.",
    }),
    checklist: ["Chaussures marche", "Couche anti-pluie", "Tenue adaptable jour/soir"],
  };
}
