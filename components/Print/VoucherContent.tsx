import React from "react";
import { PrintShopBranding } from "../../utils/printShopBranding";
import { PrintPaperSize } from "../../utils/printPaperSize";
import logo from "../../public/mmah.png";
import address from "../../public/address.jpg";

export interface VoucherReceiptItem {
  name: string;
  code?: string;
  qty: number;
  price: number;
}

export interface VoucherReceiptData {
  invoiceNumber: string;
  storefrontName: string;
  date: string;
  items: VoucherReceiptItem[];
  subtotal: number;
  discountPercent: number;
  total: number;
  paymentMethod: string;
  paidAmount?: number;
  change?: number;
  note?: string;
  serviceCharge?: number;
  tax?: number;
  receiptSequenceNumber?: number;
  cashierName?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
}

interface VoucherContentProps {
  receiptData: VoucherReceiptData;
  shopBranding: PrintShopBranding;
  paperSize: PrintPaperSize;
  formatDate: (dateString: string) => string;
}

export const VoucherContent: React.FC<VoucherContentProps> = ({
  receiptData,
  shopBranding,
  paperSize,
  formatDate,
}) => {
  const isThermal = paperSize.startsWith("thermal");

  if (isThermal) {
    return (
      <div className="voucher-container" data-paper={paperSize}>
        {/* Header */}
        <div className="text-center mb-2">
          <img src={logo} alt="MMAH" className="mx-auto" />
          <img src={address} alt="Address" className="mx-auto" />
          {/* {shopBranding.logo ? (
            <img
              src={shopBranding.logo}
              alt={shopBranding.shopName}
              className="voucher-logo mx-auto object-contain"
            />
          ) : (
            <div className="voucher-logo mx-auto flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 font-bold">
              {shopBranding.shopName.charAt(0)}
            </div>
          )} */}
          {/* <h2 className="voucher-shop-name font-bold text-slate-800 mt-2">
            {shopBranding.shopName}
          </h2>
          */}
          {shopBranding.address && (
            <p className="voucher-address text-slate-600 mt-1 whitespace-pre-line">
              {shopBranding.address}
            </p>
          )}
          {shopBranding.phone && (
            <p className="voucher-address text-slate-600 mt-1">
              Tel: {shopBranding.phone}
            </p>
          )}
        </div>

        {/* Dashed separator */}
        <div className="voucher-dashed-separator" />

        {/* Customer Info */}
        {(receiptData.customerName || receiptData.customerPhone) && (
          <div className="mb-2" style={{ fontSize: "11px" }}>
            {receiptData.customerName && (
              <div>
                <span>Customer:</span>{" "}
                {receiptData.customerName}
              </div>
            )}
            {receiptData.customerPhone && (
              <div>
                <span>Phone:</span>{" "}
                {receiptData.customerPhone}
              </div>
            )}
            {receiptData.customerAddress && (
              <div>
                <span>Address:</span>{" "}
                {receiptData.customerAddress}
              </div>
            )}
          </div>
        )}

        {/* Items header */}
        <div className="voucher-thermal-header">
          <div>Description</div>
          <div className="text-right">Price</div>
          <div className="text-center">Qty</div>
          <div className="text-center">Total</div>
        </div>

        {/* Items */}
        <div className="voucher-thermal-items">
          {receiptData.items.map((item, index) => (
            <div key={index} className="voucher-thermal-item">
              <div className="break-words">
                {item.code ? `${item.code} ` : ""}
              </div>
              <div className="text-right">{item.price.toLocaleString()}</div>
              <div className="text-center">{item.qty}</div>
              <div className="text-center font-semibold">
                {(item.price * item.qty).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Dashed separator */}
        <div className="voucher-dashed-separator" />

        {/* Summary - right aligned */}
        <div className="voucher-thermal-summary">
          <div className="voucher-summary-row">
            <span>Gross</span>
            <span>{receiptData.subtotal.toLocaleString()}</span>
          </div>
          <div className="voucher-summary-row">
            <span>Service charge</span>
            <span>{(receiptData.serviceCharge || 0).toLocaleString()}</span>
          </div>
          <div className="voucher-summary-row">
            <span>Tax</span>
            <span>{(receiptData.tax || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Dashed separator */}
        <div className="voucher-dashed-separator" />

        {/* Total - large */}
        <div className="voucher-thermal-total">
          <span className="voucher-total-label">TOTAL</span>
          <span className="voucher-total-amount">
            {receiptData.total.toLocaleString()}
          </span>
        </div>

        {/* Dashed separator */}
        <div className="voucher-dashed-separator" />

        {/* Note */}
        {receiptData.note && (
          <div className="voucher-thermal-note">
            <p className="italic">Note: {receiptData.note}</p>
          </div>
        )}

        {/* Receipt info */}
        <div className="voucher-thermal-receipt-info">
          <div className="flex justify-between">
            <span>Receipt:</span>
            <span>{receiptData.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>{formatDate(receiptData.date)}</span>
            <span>Thank you!</span>
          </div>
        </div>

        {/* Double line separator */}
        <div className="voucher-double-line" />

        {/* Receipt sequence number */}
        {receiptData.receiptSequenceNumber != null && (
          <div className="voucher-thermal-sequence">
            #{String(receiptData.receiptSequenceNumber).padStart(4, "0")}
          </div>
        )}

        {/* Printed by */}
        {receiptData.cashierName && (
          <div className="voucher-thermal-printed-by">
            Printed by: {receiptData.cashierName}
          </div>
        )}
      </div>
    );
  }

  // A4 / A5 layout (unchanged)
  const contactParts = [
    shopBranding.phone && `Tel: ${shopBranding.phone}`,
    shopBranding.website,
  ].filter(Boolean);

  return (
    <div className="voucher-container" data-paper={paperSize}>
      <div className="text-center mb-4 sm:mb-8">
        {shopBranding.logo ? (
          <img
            src={shopBranding.logo}
            alt={shopBranding.shopName}
            className="voucher-logo mx-auto object-contain"
          />
        ) : (
          <div className="voucher-logo mx-auto flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 font-bold">
            {shopBranding.shopName.charAt(0)}
          </div>
        )}
        <h2 className="voucher-shop-name font-bold text-slate-800 mt-3">
          {shopBranding.shopName}
        </h2>
        {shopBranding.address && (
          <p className="voucher-address text-slate-600 mt-1">
            {shopBranding.address}
          </p>
        )}
      </div>

      <div className="flex justify-between items-start mb-4 sm:mb-6 voucher-invoice-row">
        <div className="text-right">
          <p className="font-bold mb-0.5">
            INVOICE NO : {receiptData.invoiceNumber}
          </p>
          <p className="font-bold">DATE: {formatDate(receiptData.date)}</p>
        </div>
      </div>

      <div className="mb-6 sm:mb-8">
        <table className="voucher-table">
          <thead>
            <tr>
              <th style={{ width: "10%" }}>NO</th>
              <th style={{ width: "45%" }}>ITEM DESCRIPTION</th>
              <th style={{ width: "15%" }}>PRICE</th>
              <th style={{ width: "15%" }}>QTY.</th>
              <th style={{ width: "15%" }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {receiptData.items.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{item.name}</td>
                <td>{item.price.toLocaleString()}</td>
                <td>{item.qty}</td>
                <td>{(item.price * item.qty).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
        <div>
          <div className="mb-3 sm:mb-6">
            <p className="font-bold mb-1">Payment Info:</p>
            <p>Method: {receiptData.paymentMethod}</p>
            {receiptData.paidAmount != null && (
              <p>
                Paid: {receiptData.paidAmount.toLocaleString()}{" "}
                {shopBranding.currency}
              </p>
            )}
            {receiptData.change != null && receiptData.change > 0 && (
              <p>
                Change: {receiptData.change.toLocaleString()}{" "}
                {shopBranding.currency}
              </p>
            )}
          </div>
          {receiptData.note && (
            <p className="italic">Note: {receiptData.note}</p>
          )}
        </div>

        <div>
          <div className="flex justify-between mb-1 sm:mb-2">
            <span>SUB TOTAL:</span>
            <span>{receiptData.subtotal.toLocaleString()}</span>
          </div>
          {receiptData.discountPercent > 0 && (
            <div className="flex justify-between mb-1 sm:mb-2">
              <span>DISCOUNT:</span>
              <span>
                -
                {(
                  (receiptData.subtotal * receiptData.discountPercent) /
                  100
                ).toLocaleString()}
              </span>
            </div>
          )}
          <div
            className="voucher-total-bar flex justify-between font-bold text-white"
            style={{ backgroundColor: "#1E90FF" }}
          >
            <span>TOTAL:</span>
            <span>
              {receiptData.total.toLocaleString()} {shopBranding.currency}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mt-16 text-center">
        <p className="voucher-footer-title font-bold italic mb-1">
          Please Keep Box, Warranty Card & Invoice. <br />
          Thank you for Your Business!
        </p>
        <div className="voucher-sign border-t border-gray-300 mt-6 sm:mt-8 pt-4">
          <p className="text-xs text-right">
            Authorised Sign: _________________
          </p>
        </div>
      </div>

      <div
        className="voucher-contact-bar mt-4 sm:mt-6 py-2 sm:py-3 px-3 sm:px-4 flex justify-between text-white text-xs"
        style={{ backgroundColor: "#000" }}
      >
        <span>
          {contactParts.length > 0
            ? `Contact: ${contactParts.join(" | ")}`
            : shopBranding.address || ""}
        </span>
        <span>{shopBranding.shopName}</span>
      </div>
    </div>
  );
};
