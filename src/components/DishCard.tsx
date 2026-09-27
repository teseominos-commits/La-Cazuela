import { AllergenIcon } from "./AllergenIcon";
import type { Dish } from "../types";

function formatPrice(price: number) {
  return price.toFixed(2).replace(".", ",") + " €";
}

export function DishCard({ dish }: { dish: Dish }) {
  return (
    <article
      className="rounded-2xl p-4 shadow-sm"
      style={{ background: "var(--color-surface)" }}
    >
      {dish.photo_url && (
        <img
          src={dish.photo_url}
          alt={dish.name}
          loading="lazy"
          className={`mb-3 h-36 w-full rounded-xl object-cover ${dish.is_sold_out ? "opacity-40" : ""}`}
        />
      )}
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-base font-semibold leading-snug">
          {dish.name}
        </h3>
        <span
          className="whitespace-nowrap text-base font-bold"
          style={{ color: "var(--color-accent)" }}
        >
          {formatPrice(dish.price)}
        </span>
      </div>
      {dish.price_note && (
        <p className="mt-0.5 text-xs text-[var(--color-text-soft)]">
          {dish.price_note}
        </p>
      )}
      {dish.description && (
        <p className="mt-1 text-sm text-[var(--color-text-soft)]">
          {dish.description}
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {dish.is_vegan ? (
          <span className="rounded-full bg-emerald-800/10 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
            Vegano
          </span>
        ) : dish.is_vegetarian ? (
          <span className="rounded-full bg-emerald-600/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
            Vegetariano
          </span>
        ) : null}
        {dish.allergens.map((code) => (
          <AllergenIcon key={code} code={code} />
        ))}
        {dish.is_sold_out && (
          <span className="ml-auto rounded-full bg-neutral-800/80 px-2 py-0.5 text-[10px] font-medium text-white">
            Agotado hoy
          </span>
        )}
      </div>
    </article>
  );
}
