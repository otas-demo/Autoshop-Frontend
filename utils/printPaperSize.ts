export type PrintPaperSize = "A4" | "A5" | "thermal-72mm";

export const PRINT_PAPER_SIZE_KEY = "voucherPrintPaperSize";

export interface PrintPaperOption {
  id: PrintPaperSize;
  label: string;
  description: string;
}

export const PRINT_PAPER_OPTIONS: PrintPaperOption[] = [
  { id: "A4", label: "A4", description: "Standard invoice (210 × 297 mm)" },
  { id: "A5", label: "A5", description: "Compact invoice (148 × 210 mm)" },
  {
    id: "thermal-72mm",
    label: "Thermal 72mm",
    description: "Receipt printer roll (72 mm wide)",
  },
];

export const getSavedPrintPaperSize = (): PrintPaperSize => {
  const saved = localStorage.getItem(PRINT_PAPER_SIZE_KEY);
  if (saved === "thermal-88mm" || saved === "thermal-80mm") {
    localStorage.setItem(PRINT_PAPER_SIZE_KEY, "thermal-72mm");
    return "thermal-72mm";
  }
  if (saved === "A4" || saved === "A5" || saved === "thermal-72mm") {
    return saved;
  }
  return "A4";
};

export const savePrintPaperSize = (size: PrintPaperSize) => {
  localStorage.setItem(PRINT_PAPER_SIZE_KEY, size);
};

export const parsePrintPaperSize = (
  value: string | null,
): PrintPaperSize | null => {
  if (value === "thermal-88mm" || value === "thermal-80mm") return "thermal-72mm";
  if (value === "A4" || value === "A5" || value === "thermal-72mm") {
    return value;
  }
  return null;
};

export const getPrintPaperStyles = (paperSize: PrintPaperSize): string => {
  const base = `
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      background: white !important;
      margin: 0;
      padding: 0;
    }
    .no-print {
      display: none !important;
    }
    .voucher-container {
      margin: 0 auto !important;
      background: white !important;
      box-sizing: border-box;
    }
  `;

  switch (paperSize) {
    case "A5":
      return `
        ${base}
        @media print {
          @page { size: A5; margin: 8mm; }
          .voucher-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 10mm !important;
          }
        }
        @media screen {
          .voucher-container {
            max-width: 148mm;
            min-height: 210mm;
            padding: 10mm;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
        }
        .voucher-container { font-size: 11px; }
        .voucher-logo { width: 80px !important; height: 80px !important; }
        .voucher-shop-name { font-size: 1rem !important; }
        .voucher-table th { padding: 8px; font-size: 9px; }
        .voucher-table td { padding: 8px; font-size: 10px; }
        .voucher-total-bar { font-size: 13px !important; padding: 8px 12px !important; }
        .voucher-footer-title { font-size: 1rem !important; }
        .voucher-summary-grid { gap: 1rem !important; }
      `;
    case "thermal-72mm":
      return `
        ${base}
        @media print {
          @page { size: 72mm auto; margin: 2mm; }
          .voucher-container {
            width: 72mm !important;
            max-width: 72mm !important;
            padding: 2mm !important;
          }
        }
        @media screen {
          .voucher-container {
            max-width: 72mm;
            padding: 3mm;
            box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          }
        }
        .voucher-container {
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
        }
        .voucher-logo { width: 48px !important; height: 48px !important; }
        .voucher-shop-name { font-size: 16px !important; font-weight: 800 !important; }
        .voucher-address { font-size: 11px !important; color: #333; }
        .voucher-dashed-separator {
          border-top: 1px dashed #999;
          margin: 2mm 0;
        }
        .voucher-thermal-header {
          display: grid;
          grid-template-columns: 45% 18% 12% 25%;
          gap: 1mm;
          padding: 1mm 0;
          font-weight: bold;
          font-size: 11px;
          color: #000;
        }
        .voucher-thermal-items {
          margin-bottom: 1mm;
        }
        .voucher-thermal-item {
          display: grid;
          grid-template-columns: 45% 18% 12% 25%;
          gap: 1mm;
          padding: 1mm 0;
          font-size: 11px;
          color: #000;
        }
        .voucher-thermal-summary {
          text-align: right;
          font-size: 11px;
          padding: 1mm 0;
        }
        .voucher-summary-row {
          display: flex;
          justify-content: flex-end;
          gap: 4mm;
          padding: 0.5mm 0;
        }
        .voucher-summary-row span:first-child {
          min-width: 25mm;
          text-align: right;
        }
        .voucher-thermal-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2mm 0;
        }
        .voucher-total-label {
          font-size: 20px;
          font-weight: 900;
          color: #000;
        }
        .voucher-total-amount {
          font-size: 22px;
          font-weight: 900;
          color: #000;
        }
        .voucher-thermal-note {
          font-size: 11px;
          padding: 1mm 0;
          color: #333;
        }
        .voucher-thermal-receipt-info {
          font-size: 11px;
          padding: 1mm 0;
          color: #333;
        }
        .voucher-double-line {
          border-top: 3px double #000;
          margin: 2mm 0;
        }
        .voucher-thermal-sequence {
          text-align: center;
          font-size: 26px;
          font-weight: 900;
          color: #000;
          padding: 2mm 0;
        }
        .voucher-thermal-printed-by {
          text-align: center;
          font-size: 11px;
          color: #333;
          padding-bottom: 2mm;
        }
      `;
    case "A4":
    default:
      return `
        ${base}
        @media print {
          @page { size: A4; margin: 10mm; }
          .voucher-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 15mm !important;
          }
        }
        @media screen {
          .voucher-container {
            max-width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
        }
        .voucher-container { font-size: 13px; }
        .voucher-logo { width: 120px !important; height: 120px !important; }
        .voucher-shop-name { font-size: 1.25rem !important; }
        .voucher-table th { padding: 12px; font-size: 12px; }
        .voucher-table td { padding: 12px; font-size: 13px; }
        .voucher-total-bar { font-size: 1rem !important; }
        .voucher-footer-title { font-size: 1.125rem !important; }
      `;
  }
};

export const getSharedTableStyles = (): string => `
  .voucher-table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
  }
  .voucher-table th {
    background-color: #1E90FF;
    color: white;
    text-align: center;
    font-weight: 700;
    text-transform: uppercase;
  }
  .voucher-table th:first-child { text-align: left; }
  .voucher-table th:last-child { text-align: right; }
  .voucher-table td {
    background-color: #E8E8E8;
    color: #000;
    border-bottom: 3px solid white;
  }
  .voucher-table td:first-child { text-align: left; }
  .voucher-table td:nth-child(2) { text-align: left; }
  .voucher-table td:nth-child(3),
  .voucher-table td:nth-child(4) { text-align: center; }
  .voucher-table td:last-child { text-align: right; font-weight: 600; }
`;
