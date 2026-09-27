import type { ThemeKey } from "./types";

export interface ThemePalette {
  label: string;
  bg: string;
  surface: string;
  text: string;
  textSoft: string;
  accent: string;
  accentDark: string;
  accent2: string;
}

export const THEMES: Record<ThemeKey, ThemePalette> = {
  mediterraneo_calido: {
    label: "Mediterráneo cálido",
    bg: "#FFFBF5",
    surface: "#FFFFFF",
    text: "#292524",
    textSoft: "#6b6259",
    accent: "#C2703E",
    accentDark: "#8A4E2B",
    accent2: "#6B7F3B",
  },
  elegante_oscuro: {
    label: "Elegante oscuro",
    bg: "#1C1C1C",
    surface: "#262626",
    text: "#F5F1E8",
    textSoft: "#B9B3A4",
    accent: "#C9A15A",
    accentDark: "#a3803f",
    accent2: "#C9A15A",
  },
  fresco_natural: {
    label: "Fresco y natural",
    bg: "#FFFFFF",
    surface: "#F7F5EF",
    text: "#22301f",
    textSoft: "#5b6b57",
    accent: "#3E6B4F",
    accentDark: "#2c4d39",
    accent2: "#3E6B4F",
  },
  costero_marinero: {
    label: "Costero/marinero",
    bg: "#F0E4D0",
    surface: "#FFFFFF",
    text: "#12293a",
    textSoft: "#4a6274",
    accent: "#1B4965",
    accentDark: "#123249",
    accent2: "#1B4965",
  },
  urbano_minimalista: {
    label: "Urbano minimalista",
    bg: "#FAFAFA",
    surface: "#FFFFFF",
    text: "#2E2E2E",
    textSoft: "#6f6f6f",
    accent: "#D9A441",
    accentDark: "#a87c2e",
    accent2: "#2E2E2E",
  },
  cantina: {
    label: "Cantina",
    bg: "#FFF6E9",
    surface: "#FFFFFF",
    text: "#4a2410",
    textSoft: "#8a5a3a",
    accent: "#D9502C",
    accentDark: "#a53c20",
    accent2: "#F2B441",
  },
  dulce_pasteleria: {
    label: "Dulce/pastelería",
    bg: "#FDF6F7",
    surface: "#FFFFFF",
    text: "#5C4033",
    textSoft: "#8a6b5c",
    accent: "#E7A9B4",
    accentDark: "#c9808d",
    accent2: "#5C4033",
  },
  trattoria_italiana: {
    label: "Trattoria italiana",
    bg: "#FFFFFF",
    surface: "#FCF8F6",
    text: "#2b1c1d",
    textSoft: "#6b5152",
    accent: "#C1272D",
    accentDark: "#8f1c21",
    accent2: "#3B7A45",
  },
  cerveceria_gastropub: {
    label: "Cervecería/Gastropub",
    bg: "#F5EBD8",
    surface: "#FFFFFF",
    text: "#2c1f14",
    textSoft: "#6b573f",
    accent: "#C9812C",
    accentDark: "#8f5c1e",
    accent2: "#4A3728",
  },
};

export function applyTheme(theme: ThemeKey) {
  const palette = THEMES[theme] ?? THEMES.mediterraneo_calido;
  const root = document.documentElement.style;
  root.setProperty("--color-bg", palette.bg);
  root.setProperty("--color-surface", palette.surface);
  root.setProperty("--color-text", palette.text);
  root.setProperty("--color-text-soft", palette.textSoft);
  root.setProperty("--color-accent", palette.accent);
  root.setProperty("--color-accent-dark", palette.accentDark);
  root.setProperty("--color-accent-2", palette.accent2);
}
