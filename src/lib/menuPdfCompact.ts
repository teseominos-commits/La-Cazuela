import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { ALLERGEN_INITIALS } from "../components/AllergenIcon";
import { appUrl } from "./url";
import { ACCENT, formatPrice, loadImageAsPngDataUrl, loadPdfFonts } from "./pdfShared";
import { ALLERGEN_LABELS, type AllergenCode, type Category, type Dish, type Restaurant } from "../types";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 16;
const COLUMN_GAP = 8;
const COLUMN_WIDTH = (PAGE_WIDTH - MARGIN * 2 - COLUMN_GAP) / 2;
const FOOTER_RESERVED = 20;
const SEPARATOR_HEIGHT = 5;
const TITLE_HEIGHT = 6;
const DISH_LINE_HEIGHT = 3.2;

export async function generateCompactMenuPdf(
  restaurant: Restaurant,
  categories: Category[],
  dishes: Dish[],
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const orderedCategories = categories
    .map((category) => ({
      category,
      catDishes: dishes
        .filter((d) => d.category_id === category.id && !d.is_sold_out)
        .sort((a, b) => a.sort_order - b.sort_order),
    }))
    .filter((c) => c.catDishes.length > 0);

  const closingPhotos = orderedCategories
    .flatMap((c) => c.catDishes)
    .filter((d) => d.photo_url)
    .slice(0, 2);

  const menuUrl = appUrl(restaurant.slug);
  const [, logo, qrDataUrl, ...photoResults] = await Promise.all([
    loadPdfFonts(doc),
    restaurant.logo_url ? loadImageAsPngDataUrl(restaurant.logo_url) : Promise.resolve(null),
    QRCode.toDataURL(menuUrl, { width: 200, margin: 1, color: { dark: "#1c1c1c", light: "#ffffff" } }),
    ...closingPhotos.map((d) => loadImageAsPngDataUrl(d.photo_url as string)),
  ]);
  const closingPhotoImages = closingPhotos
    .map((dish, i) => ({ dish, image: photoResults[i] }))
    .filter((p): p is { dish: Dish; image: string } => Boolean(p.image));

  function drawFooter() {
    const lineY = PAGE_HEIGHT - MARGIN - FOOTER_RESERVED + 5;
    doc.setDrawColor(225);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, lineY, PAGE_WIDTH - MARGIN, lineY);

    const qrSize = 12;
    const qrX = PAGE_WIDTH - MARGIN - qrSize;
    const qrY = lineY + 3;
    doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

    doc.setFont("Lato", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(90);
    doc.text("Carta digital", qrX - 3, qrY + 4, { align: "right" });
    doc.setFont("Lato", "italic");
    doc.setFontSize(5.8);
    doc.setTextColor(140);
    doc.text("Puede haber cambios", qrX - 3, qrY + 8, { align: "right" });

    const parts = [restaurant.address, restaurant.hours, restaurant.phone].filter(Boolean);
    if (parts.length > 0) {
      doc.setFont("Lato", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(130);
      const lines = doc.splitTextToSize(parts.join("  ·  "), PAGE_WIDTH - MARGIN * 2 - qrSize - 55);
      doc.text(lines, MARGIN, qrY + 3);
    }
    doc.setTextColor(0);
  }

  // Cabecera: solo en la primera página
  let y = MARGIN;
  const headerLogoSize = 12;
  doc.setFont("Playfair", "bold");
  doc.setFontSize(19);
  doc.setTextColor(20);
  if (logo) {
    const nameWidth = doc.getTextWidth(restaurant.name);
    const totalWidth = headerLogoSize + 3 + nameWidth;
    const startX = (PAGE_WIDTH - totalWidth) / 2;
    doc.addImage(logo, "PNG", startX, y - headerLogoSize + 2, headerLogoSize, headerLogoSize);
    doc.text(restaurant.name, startX + headerLogoSize + 3, y);
  } else {
    doc.text(restaurant.name, PAGE_WIDTH / 2, y, { align: "center" });
  }
  y += 6;

  if (restaurant.tagline) {
    doc.setFont("Lato", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(130, 110, 95);
    doc.text(restaurant.tagline, PAGE_WIDTH / 2, y, { align: "center" });
    doc.setTextColor(0);
    y += 5;
  } else {
    y += 1;
  }

  doc.setDrawColor(210);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 7;

  let currentCol = 0;
  let colTop = y;
  let colY = colTop;
  const colBottom = PAGE_HEIGHT - MARGIN - FOOTER_RESERVED;

  function colX() {
    return currentCol === 0 ? MARGIN : MARGIN + COLUMN_WIDTH + COLUMN_GAP;
  }

  function newPage() {
    drawFooter();
    doc.addPage();
    currentCol = 0;
    colTop = MARGIN;
    colY = colTop;
  }

  function moveToNextColumn() {
    if (currentCol === 0) {
      currentCol = 1;
      colY = colTop;
    } else {
      newPage();
    }
  }

  function measureDishHeight(dish: Dish) {
    doc.setFont("Lato", "normal");
    doc.setFontSize(7.5);
    const descLines = dish.description ? doc.splitTextToSize(dish.description, COLUMN_WIDTH - 2) : [];
    const hasAllergens = dish.allergens.length > 0;
    return 4 + descLines.length * DISH_LINE_HEIGHT + (hasAllergens ? 3.2 : 0) + (dish.price_note ? 3 : 0) + 2.5;
  }

  function drawSeparator() {
    const cx = colX() + COLUMN_WIDTH / 2;
    const hw = 5;
    const hh = 1;
    doc.setDrawColor(...ACCENT);
    doc.setFillColor(...ACCENT);
    doc.setLineWidth(0.25);
    doc.line(colX(), colY, cx - hw - 1.5, colY);
    doc.line(cx + hw + 1.5, colY, colX() + COLUMN_WIDTH, colY);
    doc.lines(
      [
        [hw, -hh],
        [hw, hh],
        [-hw, hh],
        [-hw, -hh],
      ],
      cx - hw,
      colY,
      [1, 1],
      "FD",
      true,
    );
  }

  const usedAllergens = new Set<AllergenCode>();
  const categoryHeights = orderedCategories.map(({ catDishes }) =>
    TITLE_HEIGHT + catDishes.reduce((sum, d) => sum + measureDishHeight(d) + 2, 0),
  );
  const totalContentHeight =
    categoryHeights.reduce((a, b) => a + b, 0) + SEPARATOR_HEIGHT * Math.max(0, categoryHeights.length - 1);
  const targetFirstColumnHeight = totalContentHeight / 2;

  let categoriesRendered = 0;

  for (let i = 0; i < orderedCategories.length; i++) {
    const { category, catDishes } = orderedCategories[i];
    const categoryHeight = categoryHeights[i];
    const fullColCapacity = colBottom - colTop;

    if (categoriesRendered > 0) {
      const remaining = colBottom - colY;
      const columnSoFar = colY - colTop;
      const wouldUnbalance =
        currentCol === 0 &&
        columnSoFar > 0 &&
        columnSoFar + SEPARATOR_HEIGHT + categoryHeight > targetFirstColumnHeight;
      if (SEPARATOR_HEIGHT + categoryHeight > remaining && categoryHeight <= fullColCapacity) {
        moveToNextColumn();
      } else if (wouldUnbalance) {
        moveToNextColumn();
      } else {
        drawSeparator();
        colY += SEPARATOR_HEIGHT;
      }
    }
    categoriesRendered++;

    if (colY + TITLE_HEIGHT > colBottom) moveToNextColumn();
    doc.setFont("Playfair", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...ACCENT);
    doc.text(category.name.toUpperCase(), colX(), colY);
    colY += TITLE_HEIGHT;

    for (const dish of catDishes) {
      doc.setFont("Lato", "normal");
      doc.setFontSize(7.5);
      const descLines = dish.description ? doc.splitTextToSize(dish.description, COLUMN_WIDTH - 2) : [];
      const hasAllergens = dish.allergens.length > 0;
      dish.allergens.forEach((a) => usedAllergens.add(a));

      const blockHeight = measureDishHeight(dish);
      if (colY + blockHeight > colBottom) moveToNextColumn();

      doc.setFont("Lato", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(20);
      doc.text(dish.name, colX(), colY, { maxWidth: COLUMN_WIDTH - 14 });
      doc.setTextColor(...ACCENT);
      doc.text(formatPrice(dish.price), colX() + COLUMN_WIDTH, colY, { align: "right" });
      colY += 3.8;

      if (dish.price_note) {
        doc.setFont("Lato", "italic");
        doc.setFontSize(6);
        doc.setTextColor(140);
        doc.text(dish.price_note, colX() + COLUMN_WIDTH, colY, { align: "right" });
        colY += 3;
      }
      if (descLines.length > 0) {
        doc.setFont("Lato", "italic");
        doc.setFontSize(7);
        doc.setTextColor(100);
        doc.text(descLines, colX(), colY);
        colY += descLines.length * DISH_LINE_HEIGHT;
      }
      if (hasAllergens) {
        const codes = dish.allergens.map((code) => ALLERGEN_INITIALS[code]).join(", ");
        doc.setFont("Lato", "italic");
        doc.setFontSize(6);
        doc.setTextColor(150);
        doc.text(`Alérgenos: ${codes}`, colX(), colY);
        colY += 3.2;
      }
      doc.setTextColor(0);
      colY += 2;
    }
  }

  if (usedAllergens.size > 0) {
    const sortedCodes = Array.from(usedAllergens).sort();
    const legendHeight = 8 + sortedCodes.length * 5;
    const fullColCapacity = colBottom - colTop;

    if (categoriesRendered > 0) {
      const remaining = colBottom - colY;
      if (SEPARATOR_HEIGHT + legendHeight > remaining && legendHeight <= fullColCapacity) {
        moveToNextColumn();
      } else {
        drawSeparator();
        colY += SEPARATOR_HEIGHT;
      }
    }

    doc.setFont("Playfair", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(20);
    doc.text("Leyenda de alérgenos", colX(), colY);
    colY += TITLE_HEIGHT;
    doc.setFont("Lato", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(70);
    for (const code of sortedCodes) {
      if (colY + 5 > colBottom) moveToNextColumn();
      doc.text(`${ALLERGEN_INITIALS[code]}  —  ${ALLERGEN_LABELS[code]}`, colX(), colY);
      colY += 5;
    }
    doc.setTextColor(0);
  }

  // Bloque de cierre: logo grande y, si sobra sitio, fotos de platos.
  // Solo se dibuja si hay hueco de verdad; si no cabe, se omite sin más.
  const bigLogoSize = 26;
  const closingMinNeeded = bigLogoSize + 8;
  if (logo && colBottom - colY >= closingMinNeeded) {
    colY += 6;
    const cx = colX() + COLUMN_WIDTH / 2;
    doc.addImage(logo, "PNG", cx - bigLogoSize / 2, colY, bigLogoSize, bigLogoSize);
    colY += bigLogoSize + 5;

    if (closingPhotoImages.length > 0) {
      const gap = 3;
      const photoSize = Math.min(
        (COLUMN_WIDTH - gap * (closingPhotoImages.length - 1)) / closingPhotoImages.length,
        32,
      );
      const rowWidth = photoSize * closingPhotoImages.length + gap * (closingPhotoImages.length - 1);
      const neededForPhotos = photoSize + 8;
      if (colBottom - colY >= neededForPhotos) {
        let px = colX() + (COLUMN_WIDTH - rowWidth) / 2;
        for (const { dish, image } of closingPhotoImages) {
          doc.addImage(image, "PNG", px, colY, photoSize, photoSize);
          doc.setFont("Lato", "normal");
          doc.setFontSize(6);
          doc.setTextColor(110);
          const caption = doc.splitTextToSize(dish.name, photoSize);
          doc.text(caption, px + photoSize / 2, colY + photoSize + 3, { align: "center" });
          doc.setTextColor(0);
          px += photoSize + gap;
        }
      }
    }
  }

  drawFooter();

  return doc;
}

export async function downloadCompactMenuPdf(
  restaurant: Restaurant,
  categories: Category[],
  dishes: Dish[],
) {
  const doc = await generateCompactMenuPdf(restaurant, categories, dishes);
  doc.save(`${restaurant.slug}-carta-compacta.pdf`);
}
