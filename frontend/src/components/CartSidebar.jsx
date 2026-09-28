import React from 'react';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';
import { resolveMenuImageUrl, MENU_IMAGE_PLACEHOLDER } from '../utils/images';

export default function CartSidebar({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  isPlacingOrder,
}) {
  if (!isOpen) return null;

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 flex max-w-full pl-6">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-xl flex flex-col animate-slide-in-right">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700 border border-teal-100">
                <ShoppingBag className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 font-display">Your Order</h2>
                <p className="text-[11px] text-slate-500">{cartItems.length} unique item(s)</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-stone-50/50">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                  <ShoppingBag className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">Your cart is empty.</p>
                <button
                  onClick={onClose}
                  className="text-xs font-semibold text-teal-700 hover:text-teal-800 transition cursor-pointer"
                >
                  Browse Menu & Add Items →
                </button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3.5 p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition-all"
                >
                  <img
                    src={resolveMenuImageUrl(item.imageUrl) || MENU_IMAGE_PLACEHOLDER}
                    alt={item.name}
                    className="w-14 h-14 object-cover rounded-lg shrink-0 border border-slate-200"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = MENU_IMAGE_PLACEHOLDER;
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-slate-900 truncate">{item.name}</h4>
                    <p className="text-xs text-teal-700 font-bold mt-0.5">
                      ₹{(Number(item.price) * item.quantity).toFixed(2)}
                    </p>
                    <span className="text-[10px] text-slate-500">₹{item.price} each</span>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        className="p-1 rounded text-slate-500 hover:text-slate-900 transition cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-slate-900 min-w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="p-1 rounded text-slate-500 hover:text-slate-900 transition cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary & Checkout */}
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-slate-200 bg-white space-y-4">
              <div className="space-y-2 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-slate-800">₹{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Canteen Service Fee</span>
                  <span className="text-emerald-700 font-medium">FREE</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                  <span>Total Amount</span>
                  <span className="text-xl font-extrabold text-emerald-700">
                    ₹{totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                <span>Secured via Razorpay & Live Kitchen Sync</span>
              </div>

              <button
                onClick={onCheckout}
                disabled={isPlacingOrder}
                className="w-full py-3.5 gradient-btn-primary rounded-xl font-semibold text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isPlacingOrder ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Proceed to Pay ₹{totalAmount.toFixed(2)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
