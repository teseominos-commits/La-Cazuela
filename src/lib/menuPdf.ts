import { jsPDF } from "jspdf";
import { ALLERGEN_INITIALS } from "../components/AllergenIcon";
import { ALLERGEN_LABELS, type AllergenCode, type Category, type Dish, type Restaurant } from "../types";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function formatPrice(price: number) {
  return price.toFixed(2).replace(".", ",") + " €";
}

export function generateMenuPdf(
  restaurant: Restaurant,
  categories: Category[],
  dishes: Dish[],
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  function ensureSpace(height: number) {
    if (y + height > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  }

  // Cabecera
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(restaurant.name, PAGE_WIDTH / 2, y, { align: "center" });
  y += 8;

  if (restaurant.tagline) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(110);
    doc.text(restaurant.tagline, PAGE_WIDTH / 2, y, { align: "center" });
    doc.setTextColor(0);
    y += 6;
  }

  y += 2;
  doc.setDrawColor(200);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 10;

  const usedAllergens = new Set<AllergenCode>();

  for (const category of categories) {
    const catDishes = dishes
      .filter((d) => d.category_id === category.id && !d.is_sold_out)
      .sort((a, b) => a.sort_order - b.sort_order);
    if (catDishes.length === 0) continue;

    ensureSpace(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(40);
    doc.text(category.name.toUpperCase(), MARGIN, y);
    y += 2;
    doc.setDrawColor(230);
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    y += 8;

    for (const dish of catDishes) {
      const descLines = dish.description
        ? doc.setFont("helvetica", "normal").setFontSize(9).splitTextToSize(dish.description, CONTENT_WIDTH - 4)
        : [];
      const hasAllergens = dish.allergens.length > 0;
      dish.allergens.forEach((a) => usedAllergens.add(a));

      const blockHeight =
        6 + descLines.length * 4.2 + (hasAllergens ? 4.5 : 0) + (dish.price_note ? 4 : 0) + 3;
      ensureSpace(blockHeight);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(20);
      doc.text(dish.name, MARGIN, y);
      doc.text(formatPrice(dish.price), PAGE_WIDTH - MARGIN, y, { align: "right" });
      y += 4.5;

      if (dish.price_note) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text(dish.price_note, PAGE_WIDTH - MARGIN, y, { align: "right" });
        y += 4;
      }

      if (descLines.length > 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(90);
        doc.text(descLines, MARGIN, y);
        y += descLines.length * 4.2;
      }

      if (hasAllergens) {
        const codes = dish.allergens.map((code) => ALLERGEN_INITIALS[code]).join(", ");
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(140);
        doc.text(`Alérgenos: ${codes}`, MARGIN, y);
        y += 4.5;
      }

      doc.setTextColor(0);
      y += 3;
    }

    y += 5;
  }

  if (usedAllergens.size > 0) {
    doc.addPage();
    y = MARGIN;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(20);
    doc.text("Leyenda de alérgenos", MARGIN, y);
    y += 10;

    const sortedCodes = Array.from(usedAllergens).sort();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60);
    for (const code of sortedCodes) {
      ensureSpace(7);
      doc.text(`${ALLERGEN_INITIALS[code]}  —  ${ALLERGEN_LABELS[code]}`, MARGIN, y);
      y += 6.5;
    }
  }

  return doc;
}

export function downloadMenuPdf(
  restaurant: Restaurant,
  categories: Category[],
  dishes: Dish[],
) {
  const doc = generateMenuPdf(restaurant, categories, dishes);
  doc.save(`${restaurant.slug}-carta.pdf`);
}
