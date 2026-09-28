export type ThemeKey =
  | "mediterraneo_calido"
  | "elegante_oscuro"
  | "fresco_natural"
  | "costero_marinero"
  | "urbano_minimalista"
  | "cantina"
  | "dulce_pasteleria"
  | "trattoria_italiana"
  | "cerveceria_gastropub";

export const ALLERGEN_CODES = [
  "gluten",
  "crustaceos",
  "huevos",
  "pescado",
  "cacahuetes",
  "soja",
  "lacteos",
  "frutos_secos",
  "apio",
  "mostaza",
  "sesamo",
  "sulfitos",
  "altramuces",
  "moluscos",
] as const;

export type AllergenCode = (typeof ALLERGEN_CODES)[number];

export const COMMON_ALLERGENS: AllergenCode[] = [
  "gluten",
  "lacteos",
  "frutos_secos",
  "huevos",
  "pescado",
  "crustaceos",
];

export const ALLERGEN_LABELS: Record<AllergenCode, string> = {
  gluten: "Gluten",
  crustaceos: "Crustáceos",
  huevos: "Huevos",
  pescado: "Pescado",
  cacahuetes: "Cacahuetes",
  soja: "Soja",
  lacteos: "Lácteos",
  frutos_secos: "Frutos de cáscara",
  apio: "Apio",
  mostaza: "Mostaza",
  sesamo: "Granos de sésamo",
  sulfitos: "Dióxido de azufre y sulfitos",
  altramuces: "Altramuces",
  moluscos: "Moluscos",
};

export type PdfQrSize = "pequeno" | "mediano" | "grande";

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  theme: ThemeKey;
  logo_url: string | null;
  address: string | null;
  hours: string | null;
  phone: string | null;
  footer_text: string | null;
  pdf_qr_enabled: boolean;
  pdf_qr_size: PdfQrSize;
  plan: "basico" | "completo" | "premium";
  status: "active" | "paused";
  owner_user_id: string | null;
  owner_email: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
}

export interface Dish {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  price_note: string | null;
  photo_url: string | null;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_sold_out: boolean;
  allergens: AllergenCode[];
  sort_order: number;
}

export interface DailyMenu {
  restaurant_id: string;
  enabled: boolean;
  title: string | null;
  price: number | null;
  first_course: string | null;
  second_course: string | null;
  dessert: string | null;
  includes: string | null;
  note: string | null;
}
