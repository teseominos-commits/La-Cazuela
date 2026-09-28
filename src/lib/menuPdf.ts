import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { ALLERGEN_INITIALS } from "../components/AllergenIcon";
import { appUrl } from "./url";
import { formatPrice, getPdfAccentColor, loadImageAsPngDataUrl, loadPdfFonts } from "./pdfShared";
import { ALLERGEN_LABELS, type AllergenCode, type Category, type Dish, type Restaurant } from "../types";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_RESERVED = 26;

const QR_SIZE_MM: Record<Restaurant["pdf_qr_size"], number> = {
  pequeno: 11,
  mediano: 15,
  grande: 20,
};

export async function generateMenuPdf(
  restaurant: Restaurant,
  categories: Category[],
  dishes: Dish[],
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const ACCENT = getPdfAccentColor(restaurant.theme);

  const menuUrl = appUrl(restaurant.slug);
  const [, logo, qrDataUrl] = await Promise.all([
    loadPdfFonts(doc),
    restaurant.logo_url ? loadImageAsPngDataUrl(restaurant.logo_url) : Promise.resolve(null),
    restaurant.pdf_qr_enabled
      ? QRCode.toDataURL(menuUrl, { width: 200, margin: 1, color: { dark: "#1c1c1c", light: "#ffffff" } })
      : Promise.resolve(null),
  ]);

  let y = MARGIN;
  let lastFooterQrX = 0;
  let lastFooterQrY = 0;

  function drawFooter() {
    const lineY = PAGE_HEIGHT - MARGIN - FOOTER_RESERVED + 6;
    doc.setDrawColor(225);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, lineY, PAGE_WIDTH - MARGIN, lineY);

    const parts = [restaurant.address, restaurant.hours, restaurant.phone].filter(Boolean);

    if (!qrDataUrl) {
      // Sin QR: el texto de contacto centrado ocupa todo el ancho.
      if (parts.length > 0) {
        doc.setFont("Lato", "normal");
        doc.setFontSize(8);
        doc.setTextColor(130);
        const infoLines = doc.splitTextToSize(parts.join("   ·   "), CONTENT_WIDTH);
        doc.text(infoLines, PAGE_WIDTH / 2, lineY + 6, { align: "center", maxWidth: CONTENT_WIDTH });
      }
      doc.setTextColor(0);
      return;
    }

    const qrSize = QR_SIZE_MM[restaurant.pdf_qr_size];
    const qrX = PAGE_WIDTH - MARGIN - qrSize;
    const qrY = lineY + 4;
    lastFooterQrX = qrX;
    lastFooterQrY = qrY;
    doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

    const captionX = qrX - 4;
    doc.setFont("Lato", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(90);
    doc.text("Carta digital actualizada", captionX, qrY + 5, { align: "right" });
    doc.setFont("Lato", "italic");
    doc.setFontSize(6.5);
    doc.setTextColor(140);
    const disclaimerLines = doc.splitTextToSize(
      "Puede haber platos no incluidos en esta carta impresa",
      62,
    );
    doc.text(disclaimerLines, captionX, qrY + 9, { align: "right" });

    if (parts.length > 0) {
      doc.setFont("Lato", "normal");
      doc.setFontSize(8);
      doc.setTextColor(130);
      const infoLines = doc.splitTextToSize(parts.join("   ·   "), CONTENT_WIDTH - qrSize - 70);
      doc.text(infoLines, MARGIN, qrY + 3);
    }
    doc.setTextColor(0);
  }

  function ensureSpace(height: number) {
    if (y + height > PAGE_HEIGHT - MARGIN - FOOTER_RESERVED) {
      drawFooter();
      doc.addPage();
      y = MARGIN;
    }
  }

  // Cabecera: logo junto al nombre (misma línea) si existe, si no, nombre centrado solo
  const headerFontSize = 34;
  doc.setFont("Playfair", "bold");
  doc.setFontSize(headerFontSize);
  doc.setTextColor(20);
  if (logo) {
    const logoSize = 22;
    const nameWidth = doc.getTextWidth(restaurant.name);
    const totalWidth = logoSize + 5 + nameWidth;
    const startX = (PAGE_WIDTH - totalWidth) / 2;
    doc.addImage(logo, "PNG", startX, y - logoSize + 4, logoSize, logoSize);
    doc.text(restaurant.name, startX + logoSize + 5, y);
  } else {
    doc.text(restaurant.name, PAGE_WIDTH / 2, y, { align: "center" });
  }
  y += 10;

  if (restaurant.tagline) {
    doc.setFont("Lato", "italic");
    doc.setFontSize(11);
    doc.setTextColor(130, 110, 95);
    doc.text(restaurant.tagline, PAGE_WIDTH / 2, y, { align: "center" });
    doc.setTextColor(0);
    y += 8;
  } else {
    y += 2;
  }

  doc.setDrawColor(210);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 10;

  const usedAllergens = new Set<AllergenCode>();
  let categoriesRendered = 0;
  const SEPARATOR_HEIGHT = 8;
  const TITLE_HEIGHT = 9;
  const DISH_LINE_HEIGHT = 4;

  function measureDishBlockHeight(dish: Dish) {
    doc.setFont("Lato", "normal");
    doc.setFontSize(9.5);
    const descLines = dish.description ? doc.splitTextToSize(dish.description, CONTENT_WIDTH - 4) : [];
    const hasAllergens = dish.allergens.length > 0;
    const hasVegTag = dish.is_vegan || dish.is_vegetarian;
    return (
      5 +
      descLines.length * DISH_LINE_HEIGHT +
      (hasVegTag ? 4.2 : 0) +
      (hasAllergens ? 4.5 : 0) +
      (dish.price_note ? 4 : 0) +
      4
    );
  }

  function drawSeparator() {
    const centerX = PAGE_WIDTH / 2;
    const halfWidth = 9;
    const halfHeight = 1.6;
    doc.setDrawColor(...ACCENT);
    doc.setFillColor(...ACCENT);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y, centerX - halfWidth - 2, y);
    doc.line(centerX + halfWidth + 2, y, PAGE_WIDTH - MARGIN, y);
    doc.lines(
      [
        [halfWidth, -halfHeight],
        [halfWidth, halfHeight],
        [-halfWidth, halfHeight],
        [-halfWidth, -halfHeight],
      ],
      centerX - halfWidth,
      y,
      [1, 1],
      "FD",
      true,
    );
  }

  for (const category of categories) {
    const catDishes = dishes
      .filter((d) => d.category_id === category.id && !d.is_sold_out)
      .sort((a, b) => a.sort_order - b.sort_order);
    if (catDishes.length === 0) continue;

    const categoryContentHeight =
      TITLE_HEIGHT + catDishes.reduce((sum, d) => sum + measureDishBlockHeight(d) + 3.5, 0);
    const fullPageCapacity = PAGE_HEIGHT - MARGIN - FOOTER_RESERVED - MARGIN;

    if (categoriesRendered > 0) {
      const remaining = PAGE_HEIGHT - MARGIN - FOOTER_RESERVED - y;
      if (SEPARATOR_HEIGHT + categoryContentHeight > remaining && categoryContentHeight <= fullPageCapacity) {
        // La categoría entera no cabe en lo que queda de página, pero sí en una
        // página nueva: la empezamos limpia en vez de partirla por la mitad.
        drawFooter();
        doc.addPage();
        y = MARGIN;
      } else {
        drawSeparator();
        y += SEPARATOR_HEIGHT;
      }
    }
    categoriesRendered++;

    ensureSpace(16);
    doc.setFont("Playfair", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...ACCENT);
    doc.text(category.name.toUpperCase(), MARGIN, y);
    y += TITLE_HEIGHT;

    for (const dish of catDishes) {
      doc.setFont("Lato", "normal");
      doc.setFontSize(9.5);
      const descLines = dish.description ? doc.splitTextToSize(dish.description, CONTENT_WIDTH - 4) : [];
      const hasAllergens = dish.allergens.length > 0;
      dish.allergens.forEach((a) => usedAllergens.add(a));

      const blockHeight = measureDishBlockHeight(dish);
      ensureSpace(blockHeight);

      doc.setFont("Lato", "bold");
      doc.setFontSize(12);
      doc.setTextColor(20);
      doc.text(dish.name, MARGIN, y);
      doc.setTextColor(...ACCENT);
      doc.text(formatPrice(dish.price), PAGE_WIDTH - MARGIN, y, { align: "right" });
      y += 5.5;

      if (dish.price_note) {
        doc.setFont("Lato", "italic");
        doc.setFontSize(8);
        doc.setTextColor(140);
        doc.text(dish.price_note, PAGE_WIDTH - MARGIN, y, { align: "right" });
        y += 4;
      }

      if (descLines.length > 0) {
        doc.setFont("Lato", "italic");
        doc.setFontSize(9.5);
        doc.setTextColor(100);
        doc.text(descLines, MARGIN, y);
        y += descLines.length * DISH_LINE_HEIGHT;
      }

      if (dish.is_vegan || dish.is_vegetarian) {
        doc.setFont("Lato", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(16, 122, 87);
        doc.text(dish.is_vegan ? "VEGANO" : "VEGETARIANO", MARGIN, y);
        y += 4.2;
      }

      if (hasAllergens) {
        const codes = dish.allergens.map((code) => ALLERGEN_INITIALS[code]).join(", ");
        doc.setFont("Lato", "italic");
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Alérgenos: ${codes}`, MARGIN, y);
        y += 4.5;
      }

      doc.setTextColor(0);
      y += 3.5;
    }
  }

  drawFooter();

  if (usedAllergens.size > 0) {
    doc.addPage();
    y = MARGIN;
    doc.setFont("Playfair", "bold");
    doc.setFontSize(17);
    doc.setTextColor(20);
    doc.text("Leyenda de alérgenos", MARGIN, y);
    y += 10;

    const sortedCodes = Array.from(usedAllergens).sort();
    doc.setFont("Lato", "normal");
    doc.setFontSize(10);
    doc.setTextColor(70);
    for (const code of sortedCodes) {
      ensureSpace(7);
      doc.text(`${ALLERGEN_INITIALS[code]}  —  ${ALLERGEN_LABELS[code]}`, MARGIN, y);
      y += 6.5;
    }
    drawFooter();
  }

  // El aviso de "puede haber cambios" solo tiene sentido si hay más de una
  // página; con una sola, lo borramos del pie ya dibujado en vez de no
  // dibujarlo nunca, porque hasta el final no sabemos cuántas páginas habrá.
  // Si el QR está desactivado, ese aviso nunca se llegó a dibujar.
  if (qrDataUrl && doc.getNumberOfPages() === 1) {
    doc.setPage(1);
    doc.setFillColor(255, 255, 255);
    doc.rect(lastFooterQrX - 70, lastFooterQrY + 6.5, 70, 7, "F");
  }

  return doc;
}

export async function downloadMenuPdf(
  restaurant: Restaurant,
  categories: Category[],
  dishes: Dish[],
) {
  const doc = await generateMenuPdf(restaurant, categories, dishes);
  doc.save(`${restaurant.slug}-carta.pdf`);
}
