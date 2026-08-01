import React from "react";
import { X, UserPlus, User } from "lucide-react";
import { Order } from "../../services/Order/fetchOrders";
import { CreditPersona } from "../../services/Credit/fetchCreditPersonas";

interface CreditPersonModalProps {
  isOpen: boolean;
  order: Order | null;
  creditPersonas: CreditPersona[];
  assigning: boolean;
  onClose: () => void;
  onAssign: (creditPersonId: string) => void;
}

export const CreditPersonModal: React.FC<CreditPersonModalProps> = ({
  isOpen,
  order,
  creditPersonas,
  assigning,
  onClose,
  onAssign,
}) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#f7f6f2] rounded-3xl shadow-2xl max-w-md w-full border border-white/40 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200/50 bg-orange-50/50">
          <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-orange-600" />
            Assign Credit Person
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-orange-100/50 rounded-full transition-colors text-slate-500 hover:text-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <div className="mb-4 p-4 bg-white border border-gray-200/70 rounded-xl">
            <p className="text-sm text-slate-600">
              Order:{" "}
              <span className="font-bold text-blue-600">{order.orderNumber}</span>
            </p>
            <p className="text-sm text-slate-600 mt-1">
              Amount:{" "}
              <span className="font-bold">
                {order.finalAmount?.toLocaleString()} MMK
              </span>
            </p>
          </div>

          <p className="text-sm font-semibold text-slate-700 mb-3">
            Select a credit person to assign to this order:
          </p>

          {creditPersonas.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <User className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No credit persons available</p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {creditPersonas.map((persona) => (
                <button
                  key={persona._id}
                  onClick={() => onAssign(persona._id)}
                  disabled={assigning}
                  className="w-full flex items-center gap-3 p-3 border border-gray-300 rounded-xl bg-white hover:bg-orange-50/50 hover:border-orange-300 transition-all text-left disabled:opacity-50 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-orange-100/50 flex items-center justify-center">
                    <User className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{persona.name}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{persona.phone}</p>
                    {persona.address && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">{persona.address}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-gray-200/50 bg-slate-50/40">
          <button
            onClick={onClose}
            disabled={assigning}
            className="w-full py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-full text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

