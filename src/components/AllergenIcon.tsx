import { ALLERGEN_LABELS, type AllergenCode } from "../types";

export const ALLERGEN_INITIALS: Record<AllergenCode, string> = {
  gluten: "Gl",
  crustaceos: "Cr",
  huevos: "Hu",
  pescado: "Pe",
  cacahuetes: "Ca",
  soja: "So",
  lacteos: "La",
  frutos_secos: "Fs",
  apio: "Ap",
  mostaza: "Mo",
  sesamo: "Se",
  sulfitos: "Su",
  altramuces: "Al",
  moluscos: "Ml",
};

export function AllergenIcon({ code }: { code: AllergenCode }) {
  return (
    <span
      title={ALLERGEN_LABELS[code]}
      className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-neutral-300 bg-neutral-50 text-[9px] font-semibold text-neutral-500"
    >
      {ALLERGEN_INITIALS[code]}
    </span>
  );
}

export function AllergenLegend({ codes }: { codes: AllergenCode[] }) {
  if (codes.length === 0) return null;
  return (
    <details className="mt-6 text-xs text-[var(--color-text-soft)]">
      <summary className="cursor-pointer select-none">
        ¿Qué significan estos iconos?
      </summary>
      <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
        {codes.map((code) => (
          <li key={code} className="flex items-center gap-2">
            <AllergenIcon code={code} />
            <span>{ALLERGEN_LABELS[code]}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
