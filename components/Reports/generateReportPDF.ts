import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { SaleReportResponse } from "../../services/Reports/fetchSaleReport";
import { PaidOrdersReportResponse } from "../../services/Reports/fetchPaidOrdersReport";
import { CreditOrdersReportResponse } from "../../services/Reports/fetchCreditOrdersReport";
import { ProductSalesStatisticsResponse } from "../../services/Reports/fetchProductSalesStatistics";
import { FOCOrder } from "../../services/Reports/fetchFOCOrders";
import { Expense } from "../../services/Expense/fetchExpenses";
import { getPaymentMethodLabel } from "../Orders/orderUtils";

type TabType =
  | "overall"
  | "paid"
  | "credit"
  | "statistics"
  | "revenue"
  | "foc"
  | "expense";

interface ReportPDFParams {
  activeTab: TabType;
  displayReport: {
    finalAmount: number;
    paidAmount: number;
    subTotal: number;
    tax: number;
    discount: number;
    orderCount: number;
    creditOrderCount: number;
    paidOrderCount: number;
  };
  saleReports: SaleReportResponse[];
  paidOrdersReport: PaidOrdersReportResponse | null;
  creditOrdersReport: CreditOrdersReportResponse | null;
  productSalesStatistics: ProductSalesStatisticsResponse | null;
  focOrders: FOCOrder[];
  expenses?: Expense[];
  selectedStorefront: string;
  storefrontName: string;
  startDate: Date | null;
  endDate: Date | null;
}

const formatCurrency = (value: number) => `${value.toLocaleString()} MMK`;

const formatDate = (date: Date | null): string => {
  if (!date) return "N/A";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const addHeader = (
  doc: jsPDF,
  title: string,
  storefrontName: string,
  startDate: Date | null,
  endDate: Date | null,
) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Storefront: ${storefrontName}`, 14, 30);
  doc.text(
    `Date: ${formatDate(startDate)} — ${formatDate(endDate)}`,
    14,
    36,
  );
  doc.text(
    `Generated: ${new Date().toLocaleString()}`,
    pageWidth - 14,
    36,
    { align: "right" },
  );

  doc.setDrawColor(200);
  doc.line(14, 40, pageWidth - 14, 40);

  return 46;
};

const generateOverallPDF = (doc: jsPDF, params: ReportPDFParams) => {
  const { displayReport, saleReports, selectedStorefront } = params;
  let yPos = addHeader(
    doc,
    "Overall Sales Report",
    params.storefrontName,
    params.startDate,
    params.endDate,
  );

  // Summary table
  autoTable(doc, {
    startY: yPos,
    head: [["Metric", "Value"]],
    body: [
      ["Total Sales", formatCurrency(displayReport.finalAmount)],
      ["Paid Amount", formatCurrency(displayReport.paidAmount)],
      [
        "Credit Amount",
        formatCurrency(displayReport.finalAmount - displayReport.paidAmount),
      ],
      ["Total Orders", String(displayReport.orderCount)],
      ["Paid Orders", String(displayReport.paidOrderCount)],
      ["Credit Orders", String(displayReport.creditOrderCount)],
      ["Sub Total", formatCurrency(displayReport.subTotal)],
      ["Discount", formatCurrency(displayReport.discount)],
      ["Tax", formatCurrency(displayReport.tax)],
    ],
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [59, 130, 246] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Storefront breakdown
  const reportsToShow =
    selectedStorefront === "all"
      ? saleReports.filter((r) => r.success)
      : saleReports.filter(
          (r) => r.success && r.data.storefront._id === selectedStorefront,
        );

  if (reportsToShow.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Storefront Breakdown", 14, yPos);
    yPos += 4;

    autoTable(doc, {
      startY: yPos,
      head: [
        [
          "Storefront",
          "Final Amount",
          "Paid Amount",
          "Sub Total",
          "Discount",
          "Orders",
          "Paid",
          "Credit",
        ],
      ],
      body: reportsToShow.map((r) => [
        `${r.data.storefront.locationName} (${r.data.storefront.locationCode})`,
        formatCurrency(r.data.report.finalAmount),
        formatCurrency(r.data.report.paidAmount),
        formatCurrency(r.data.report.subTotal),
        formatCurrency(r.data.report.discount),
        String(r.data.report.orderCount),
        String(r.data.report.paidOrderCount),
        String(r.data.report.creditOrderCount),
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
  }
};

const generatePaidOrdersPDF = (doc: jsPDF, params: ReportPDFParams) => {
  const { paidOrdersReport } = params;
  if (!paidOrdersReport?.success) return;

  let yPos = addHeader(
    doc,
    "Paid Orders Report",
    params.storefrontName,
    params.startDate,
    params.endDate,
  );

  const { totals, paymentMethods } = paidOrdersReport.data;

  // Summary
  autoTable(doc, {
    startY: yPos,
    head: [["Metric", "Value"]],
    body: [
      ["Total Paid Amount", formatCurrency(totals.totalPaidAmount)],
      ["Total Final Amount", formatCurrency(totals.totalFinalAmount)],
      ["Total Orders", String(totals.totalOrderCount)],
    ],
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [34, 197, 94] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Payment methods table
  if (paymentMethods.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Payment Methods Breakdown", 14, yPos);
    yPos += 4;

    autoTable(doc, {
      startY: yPos,
      head: [["Payment Method", "Orders", "Paid Amount", "Final Amount"]],
      body: [
        ...paymentMethods.map((pm) => [
          getPaymentMethodLabel(pm.paymentMethod),
          String(pm.orderCount),
          formatCurrency(pm.totalPaidAmount),
          formatCurrency(pm.totalFinalAmount),
        ]),
        [
          "Total",
          String(totals.totalOrderCount),
          formatCurrency(totals.totalPaidAmount),
          formatCurrency(totals.totalFinalAmount),
        ],
      ],
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [34, 197, 94] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
  }
};

const generateCreditOrdersPDF = (doc: jsPDF, params: ReportPDFParams) => {
  const { creditOrdersReport } = params;
  if (!creditOrdersReport?.success) return;

  let yPos = addHeader(
    doc,
    "Credit Orders Report",
    params.storefrontName,
    params.startDate,
    params.endDate,
  );

  const { totals, initialPayments, creditPayments } = creditOrdersReport.data;

  // Summary
  autoTable(doc, {
    startY: yPos,
    head: [["Metric", "Value"]],
    body: [
      ["Total Final Amount", formatCurrency(totals.totalFinalAmount)],
      ["Total Paid Amount", formatCurrency(totals.totalPaidAmount)],
      [
        "Initial Paid Amount",
        formatCurrency(totals.totalInitialPaidAmount),
      ],
      [
        "Credit Paid Amount",
        formatCurrency(totals.totalCreditPaidAmount),
      ],
      [
        "Remaining Balance",
        formatCurrency(totals.totalRemainingBalance),
      ],
      ["Order Count", String(totals.orderCount)],
      ["Credit Record Count", String(totals.creditRecordCount)],
    ],
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [249, 115, 22] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Initial payments
  if (initialPayments.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Initial Payments", 14, yPos);
    yPos += 4;

    autoTable(doc, {
      startY: yPos,
      head: [["Payment Method", "Orders", "Paid Amount"]],
      body: initialPayments.map((ip) => [
        getPaymentMethodLabel(ip.paymentMethod),
        String(ip.orderCount),
        formatCurrency(ip.totalPaidAmount),
      ]),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [249, 115, 22] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Credit payments
  if (creditPayments.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Credit Payments", 14, yPos);
    yPos += 4;

    autoTable(doc, {
      startY: yPos,
      head: [["Payment Method", "Records", "Paid Amount"]],
      body: creditPayments.map((cp) => [
        getPaymentMethodLabel(cp.paymentMethod),
        String(cp.recordCount),
        formatCurrency(cp.totalPaidAmount),
      ]),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [249, 115, 22] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
  }
};

const generateStatisticsPDF = (doc: jsPDF, params: ReportPDFParams) => {
  const { productSalesStatistics } = params;
  if (!productSalesStatistics?.success) return;

  let yPos = addHeader(
    doc,
    "Sale Statistics Report",
    params.storefrontName,
    params.startDate,
    params.endDate,
  );

  const { totals, products } = productSalesStatistics.data;

  // Summary
  autoTable(doc, {
    startY: yPos,
    head: [["Metric", "Value"]],
    body: [
      ["Total Unique Products", String(totals.totalUniqueProducts)],
      ["Total Quantity Sold", String(totals.totalQuantity)],
      ["Total Revenue", formatCurrency(totals.totalRevenue)],
    ],
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [168, 85, 247] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Products table
  if (products.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Product Sales Details", 14, yPos);
    yPos += 4;

    autoTable(doc, {
      startY: yPos,
      head: [
        [
          "Product Name",
          "Code",
          "Category",
          "Qty Sold",
          "Revenue",
          "Orders",
        ],
      ],
      body: products.map((p) => [
        p.productName.substring(0, 30),
        p.productCode,
        p.category,
        String(p.totalQuantity),
        formatCurrency(p.totalRevenue),
        String(p.orderCount),
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [168, 85, 247] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
  }
};

const generateFOCPDF = (doc: jsPDF, params: ReportPDFParams) => {
  const { focOrders } = params;

  let yPos = addHeader(
    doc,
    "FOC Products Report",
    params.storefrontName,
    params.startDate,
    params.endDate,
  );

  // Aggregate FOC products
  const aggregated = focOrders.reduce(
    (acc, order) => {
      order.ordersProducts.forEach((product) => {
        const key = `${product.inventoryId.productName}-${product.inventoryId.productCode}`;
        if (acc[key]) {
          acc[key].quantity += product.quantity;
          acc[key].orders.push(order.orderNumber);
        } else {
          acc[key] = {
            productName: product.inventoryId.productName,
            productCode: product.inventoryId.productCode,
            quantity: product.quantity,
            unitPrice: product.unitPrice,
            orders: [order.orderNumber],
          };
        }
      });
      return acc;
    },
    {} as Record<
      string,
      {
        productName: string;
        productCode: string;
        quantity: number;
        unitPrice: number;
        orders: string[];
      }
    >,
  );

  const productList = Object.values(aggregated).sort(
    (a, b) => b.quantity - a.quantity,
  );

  const totalQuantity = productList.reduce((sum, p) => sum + p.quantity, 0);
  const totalValue = productList.reduce(
    (sum, p) => sum + p.quantity * p.unitPrice,
    0,
  );

  // Summary
  autoTable(doc, {
    startY: yPos,
    head: [["Metric", "Value"]],
    body: [
      ["Total FOC Products", String(productList.length)],
      ["Total Quantity", String(totalQuantity)],
      ["Total Value", formatCurrency(totalValue)],
    ],
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [239, 68, 68] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Products table
  if (productList.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("FOC Products Details", 14, yPos);
    yPos += 4;

    autoTable(doc, {
      startY: yPos,
      head: [
        ["Product Name", "Code", "Qty", "Unit Price", "Total Value"],
      ],
      body: productList.map((p) => [
        p.productName.substring(0, 30),
        p.productCode,
        String(p.quantity),
        formatCurrency(p.unitPrice),
        formatCurrency(p.quantity * p.unitPrice),
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [239, 68, 68] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
  }
};

const generateExpensePDF = (doc: jsPDF, params: ReportPDFParams) => {
  addHeader(
    doc,
    "EXPENSE REPORT",
    params.storefrontName,
    params.startDate,
    params.endDate,
  );

  const expenses = params.expenses || [];
  const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalEntries = expenses.length;

  autoTable(doc, {
    startY: 44,
    head: [["Metric", "Value"]],
    body: [
      ["Total Expenses", formatCurrency(totalAmount)],
      ["Total Entries", String(totalEntries)],
      [
        "Average per Entry",
        formatCurrency(
          totalEntries > 0 ? Math.round(totalAmount / totalEntries) : 0,
        ),
      ],
    ],
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 80 } },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 65;

  autoTable(doc, {
    startY: finalY + 8,
    head: [
      [
        "No",
        "Date",
        "Category",
        "Location",
        "Notes",
        "Recorded By",
        "Amount",
      ],
    ],
    body: expenses.map((e, idx) => [
      String(idx + 1),
      formatDate(new Date(e.date)),
      e.category
        ? e.category.charAt(0).toUpperCase() + e.category.slice(1)
        : "-",
      e.locationId?.locationName ||
        (e.locationId as any)?.storefrontName ||
        "-",
      (e.notes || "-").substring(0, 25),
      e.adminId?.name || "-",
      formatCurrency(e.amount),
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [34, 22, 168] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });
};

export const generateReportPDF = (params: ReportPDFParams) => {
  const doc = new jsPDF();

  switch (params.activeTab) {
    case "overall":
      generateOverallPDF(doc, params);
      break;
    case "paid":
      generatePaidOrdersPDF(doc, params);
      break;
    case "credit":
      generateCreditOrdersPDF(doc, params);
      break;
    case "statistics":
      generateStatisticsPDF(doc, params);
      break;
    case "foc":
      generateFOCPDF(doc, params);
      break;
    case "expense":
      generateExpensePDF(doc, params);
      break;
    default:
      generateOverallPDF(doc, params);
  }

  const dateStr = params.startDate
    ? params.startDate.toISOString().split("T")[0]
    : "all";
  doc.save(`report-${params.activeTab}-${dateStr}.pdf`);
};
