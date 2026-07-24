import React, { useState } from "react";
import {
  RefreshCw,
  Eye,
  ShoppingBag,
  Store,
  CreditCard,
  UserPlus,
  User,
  UserCircle,
  Trash2,
  Loader2,
} from "lucide-react";
import { Order } from "../../services/Order/fetchOrders";
import { deleteOrder } from "../../services/Order/deleteOrder";
import {
  getStatusColor,
  getPaymentTypeLabel,
  getPaymentMethodLabel,
  getPaymentTypeColor,
  formatDate,
} from "./orderUtils";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import { useLanguage } from "@/context/LanguageContext";

interface OrdersTableProps {
  loading: boolean;
  orders: Order[];
  onViewOrder: (orderId: string) => void;
  onOpenCreditPersonModal: (order: Order) => void;
  onOrderDeleted?: () => void; // Callback to refresh orders after deletion
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  loading,
  orders,
  onViewOrder,
  onOpenCreditPersonModal,
  onOrderDeleted,
}) => {
  const { t } = useLanguage();
  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const userRole = adminData.role;
  // console.log(userRole);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  // Check if user can delete orders (admin or owner only)
  const canDeleteOrder = userRole.role === "owner";

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete order ${orderNumber}? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setDeletingOrderId(orderId);
    try {
      const response = await deleteOrder(orderId);

      if (response.success) {
        toast.success(`Order ${orderNumber} deleted successfully`);
        if (onOrderDeleted) {
          onOrderDeleted();
        }
      } else {
        toast.error(response.message || "Failed to delete order");
      }
    } catch (error: any) {
      console.error("Error deleting order:", error);
      toast.error(error.message || "Failed to delete order");
    } finally {
      setDeletingOrderId(null);
    }
  };
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
        <p className="text-slate-500">Loading orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
        <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">No orders found</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden flex flex-col min-h-0">
      {/* Table container with horizontal scroll on mobile */}
      <div className="overflow-x-auto overflow-y-auto max-h-[800px]">
        <table className="w-full text-sm text-left min-w-[800px]">
          <thead className="text-slate-500">
            <tr className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(229,231,235,1)]">
              <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">No</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Order Num</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Items</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Final Amount</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Paid</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Method</th>
              <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order, index) => (
              <tr key={order._id} className="hover:bg-slate-50/40 transition-colors">
                {/* No */}
                <td className="px-4 py-4 text-center font-bold text-slate-400 text-xs">
                  {String(index + 1).padStart(2, "0")}
                </td>

                {/* Order Num */}
                <td
                  onClick={() => onViewOrder(order._id)}
                  className="px-4 py-4 font-bold text-[#2216a8] hover:underline cursor-pointer text-xs sm:text-sm"
                >
                  {order.orderNumber}
                </td>

                {/* Items */}
                <td className="px-4 py-4 text-slate-500 text-xs font-medium">
                  {order.ordersProducts?.length || 0} {order.ordersProducts?.length === 1 ? "Item" : "Items"}
                </td>

                {/* Final Amount */}
                <td className="px-4 py-4 font-bold text-slate-800 text-xs whitespace-nowrap">
                  {order.finalAmount?.toLocaleString()}{" "}
                  <span className="text-[10px] text-slate-400 font-medium">MMK</span>
                </td>

                {/* Paid */}
                <td className="px-4 py-4 font-bold text-green-600 text-xs whitespace-nowrap">
                  {order.paidAmount?.toLocaleString()}{" "}
                  <span className="text-[10px] text-slate-400 font-medium">MMK</span>
                </td>

                {/* Method */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-slate-600 font-medium">
                      {getPaymentMethodLabel(order.paymentMethod)}
                    </span>
                  </div>
                </td>

                {/* Actions */}
                <td className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onViewOrder(order._id)}
                      className="px-4 py-1.5 text-xs font-semibold rounded-full bg-[#2216a8] hover:bg-[#2216a8]/90 text-white shadow-sm flex items-center justify-center cursor-pointer transition-all whitespace-nowrap"
                    >
                      {t("common.edit")}
                    </button>
                    {canDeleteOrder && (
                      <button
                        onClick={() => handleDeleteOrder(order._id, order.orderNumber)}
                        disabled={deletingOrderId === order._id}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors flex items-center justify-center disabled:opacity-50 cursor-pointer"
                        title="Delete"
                      >
                        {deletingOrderId === order._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
