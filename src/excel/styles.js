// All ExcelJS style constants — mirrors the original Python tool exactly.

export const COLORS = {
  TITLE_BG:  '1A5276',
  HEADER_BG: '1F4E79',
  DOMAIN_BG: 'D6E4F0',
  CLUSTER_BG:'EBF5FB',
  ALT_BG:    'F7FBFE',
  WHITE:     'FFFFFFFF',
  HEALTHY:   '0F6E56',
  PENDING:   'BA7517',
  BORDER:    'BDC3C7',
  GREY_TEXT: '555555',
};

export const COLUMNS = [
  { header: 'Domain',          width: 22 },
  { header: 'Product',         width: 20 },
  { header: 'Current Version', width: 18 },
  { header: 'Current Build',   width: 16 },
  { header: 'Go to Version',   width: 18 },
  { header: 'Go to Build',     width: 16 },
  { header: 'Health Checks',   width: 14 },
  { header: 'Status',          width: 12 },
];

export function thinBorder(color = COLORS.BORDER) {
  const side = { style: 'thin', color: { argb: 'FF' + color } };
  return { top: side, left: side, bottom: side, right: side };
}

export function solidFill(hexColor) {
  // ExcelJS expects ARGB (8 chars); prepend FF for full opacity
  const argb = hexColor.length === 8 ? hexColor : 'FF' + hexColor;
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

export const TITLE_FONT   = { bold: true,  size: 11, color: { argb: COLORS.WHITE } };
export const HEADER_FONT  = { bold: true,  size: 10, color: { argb: COLORS.WHITE } };
export const DOMAIN_FONT  = { bold: true,  size: 9  };
export const PRODUCT_FONT = { bold: true,  size: 9  };
export const CELL_FONT    = { size: 9 };
export const CLUSTER_LABEL_FONT = { size: 9, color: { argb: 'FF' + COLORS.GREY_TEXT } };
export const HEALTHY_FONT = { bold: true, size: 9, color: { argb: 'FF' + COLORS.HEALTHY } };
export const PENDING_FONT = { bold: true, size: 9, color: { argb: 'FF' + COLORS.PENDING } };

export const CENTER_ALIGN = { horizontal: 'center', vertical: 'middle', wrapText: true };
