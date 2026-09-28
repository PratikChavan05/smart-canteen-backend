import React, { useState, useEffect, useCallback } from 'react';
import { Search, ShoppingBag, Clock, Utensils, ChefHat, CreditCard } from 'lucide-react';
import { api } from '../utils/api';
import { resolveMenuImageUrl, MENU_IMAGE_PLACEHOLDER } from '../utils/images';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useWebSocket } from '../context/WebSocketContext';
import StatusStepper from '../components/shared/StatusStepper';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import PaymentModal from '../components/shared/PaymentModal';
import EmptyState from '../components/shared/EmptyState';
import LoadingSpinner from '../components/shared/LoadingSpinner';

export default function CustomerDashboard({ onAddToCart, refreshTrigger }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { subscribe } = useWebSocket();

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'orders'
  const [loading, setLoading] = useState(false);

  // Dialog & Payment Modal states
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [payOrder, setPayOrder] = useState(null); // { orderId, totalAmount }

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data || []);
    } catch {
      // ignore
    }
  }, []);

  const fetchMenuItems = useCallback(async () => {
    setLoading(true);
    try {
      let data = [];
      if (searchQuery.trim() !== '') {
        const res = await api.get(`/menu-items/search?name=${encodeURIComponent(searchQuery)}`);
        data = res.data;
      } else if (selectedCategory !== 'all') {
        const res = await api.get(`/menu-items/category/${selectedCategory}`);
        data = res.data;
      } else {
        const res = await api.get('/menu-items');
        data = res.data;
      }
      setMenuItems(data || []);
    } catch {
      showToast('Failed to load menu items', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, showToast]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders/my-orders');
      setOrders(res.data || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchOrders();
  }, [fetchCategories, fetchOrders, refreshTrigger]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  // Real-time WebSocket updates for this customer's orders only
  useEffect(() => {
    const unsubStatus = subscribe('/topic/orders/status', (updatedOrder) => {
      if (
        user?.email &&
        updatedOrder.customerId &&
        updatedOrder.customerId.toLowerCase() !== user.email.toLowerCase()
      ) {
        return;
      }

      setOrders((prev) => {
        const exists = prev.some((o) => o.id === updatedOrder.id);
        if (exists) {
          return prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
        }
        return [updatedOrder, ...prev];
      });

      if (updatedOrder.status === 'READY') {
        showToast(`Order #${updatedOrder.id.substring(0, 6)} is READY for pickup!`, 'success', 7000);
      } else if (updatedOrder.status === 'PREPARING') {
        showToast(`Kitchen is now preparing Order #${updatedOrder.id.substring(0, 6)}`, 'info');
      } else if (updatedOrder.status === 'PENDING') {
        showToast(`Payment confirmed for Order #${updatedOrder.id.substring(0, 6)}`, 'success');
      }
    });

    return () => {
      unsubStatus();
    };
  }, [subscribe, showToast, user?.email]);

  const confirmCancelOrder = async () => {
    if (!cancelOrderId) return;
    try {
      await api.patch(`/orders/${cancelOrderId}/cancel`);
      showToast('Order cancelled successfully', 'info');
      setCancelOrderId(null);
      fetchOrders();
    } catch (err) {
      showToast(err.message || 'Failed to cancel order', 'error');
    }
  };

  const activeOrders = orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  const pastOrders = orders.filter((o) => o.status === 'DELIVERED' || o.status === 'CANCELLED');

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Welcome Banner */}
      <div className="sc-hero relative rounded-3xl p-8 sm:p-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-teal-700/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="sc-badge">
              <Utensils className="w-3.5 h-3.5" />
              <span>Campus cafe ordering</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">
              Hungry today, <span className="gradient-text-primary">{user?.fullName || 'Foodie'}</span>?
            </h1>
            <p className="text-slate-500 text-sm max-w-xl leading-relaxed">
              Explore freshly prepared dishes, customize your meal, and skip the line with instant checkout.
            </p>
          </div>

          {activeOrders.length > 0 && (
            <div className="p-4 rounded-2xl glass-card border border-teal-700/20 flex items-center gap-4 shrink-0">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                <ChefHat className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-teal-800 uppercase tracking-wider">Active Order</p>
                <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {activeOrders[0].items?.length || 1} item(s) • {activeOrders[0].status}
                </p>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-teal-700 font-bold hover:underline cursor-pointer mt-1"
                >
                  Track progress →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('menu')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm transition-all cursor-pointer border-b-2 -mb-px ${
            activeTab === 'menu'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Browse Menu</span>
          <span className="text-xs bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-slate-600">
            {menuItems.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm transition-all cursor-pointer relative border-b-2 -mb-px ${
            activeTab === 'orders'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>My Orders</span>
          {activeOrders.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-teal-600" />
          )}
          <span className="text-xs bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-slate-600">
            {orders.length}
          </span>
        </button>
      </div>

      {/* VIEW: MENU TAB */}
      {activeTab === 'menu' && (
        <div className="space-y-6">
          {/* Search & Category Filter Pills */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search delicious dishes..."
                className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-slate-900 text-sm"
              />
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'gradient-btn-primary text-white shadow-md'
                    : 'glass-card text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                All Menu
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSearchQuery('');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'gradient-btn-primary text-white shadow-md'
                      : 'glass-card text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          {loading ? (
            <LoadingSpinner label="Loading fresh menu items..." />
          ) : menuItems.length === 0 ? (
            <EmptyState
              icon={<Utensils className="w-7 h-7 text-teal-700" />}
              title="No items found"
              description="Try adjusting your search or category filter to discover tasty options."
              actionText="Reset Filter"
              onAction={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-3xl glass-card overflow-hidden border border-slate-200 hover:border-teal-700/30 hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  {/* Thumbnail */}
                  <div className="h-48 relative overflow-hidden bg-slate-100">
                    <img
                      src={resolveMenuImageUrl(item.imageUrl) || MENU_IMAGE_PLACEHOLDER}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = MENU_IMAGE_PLACEHOLDER;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="sc-badge">
                        {item.categoryName || 'Canteen'}
                      </span>
                    </div>

                    <div className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-white/95 border border-emerald-200 text-sm font-extrabold text-emerald-700 shadow-sm">
                      ₹{Number(item.price).toFixed(2)}
                    </div>
                  </div>

                  {/* Info & Cart Button */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4 bg-white">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-800 transition-colors font-display">
                        {item.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {item.description || 'Freshly prepared with quality ingredients.'}
                      </p>
                    </div>

                    <button
                      onClick={() => onAddToCart(item)}
                      className="w-full py-2.5 rounded-xl gradient-btn-primary font-bold text-xs text-white shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-8">
          {orders.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag className="w-7 h-7 text-teal-700" />}
              title="No orders yet"
              description="Browse our menu and place your first delicious meal order!"
              actionText="Explore Food Menu"
              onAction={() => setActiveTab('menu')}
            />
          ) : (
            <>
              {/* Active Orders Section */}
              {activeOrders.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-lg font-bold text-slate-900 font-display">
                      Active Orders ({activeOrders.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeOrders.map((order) => (
                      <div
                        key={order.id}
                        className="rounded-3xl glass-card border border-slate-200 p-6 space-y-4 relative overflow-hidden"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              #{order.id.substring(0, 8)}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                              {order.items?.length || 0} Item(s) Ordered
                            </h4>
                          </div>
                          <span className="text-sm font-black text-emerald-700">
                            ₹{Number(order.totalAmount).toFixed(2)}
                          </span>
                        </div>

                        {/* Order Timeline Visual Stepper */}
                        <div className="py-2 border-y border-slate-200">
                          <StatusStepper status={order.status} />
                        </div>

                        {/* Items summary */}
                        <div className="space-y-1.5 text-xs text-slate-600">
                          {order.items?.map((item, i) => (
                            <div key={i} className="flex justify-between">
                              <span>
                                {item.name} × {item.quantity}
                              </span>
                              <span className="text-slate-500">
                                ₹{(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 pt-2 border-t border-slate-200">
                          {order.status === 'PENDING_PAYMENT' && (
                            <button
                              onClick={() =>
                                setPayOrder({
                                  orderId: order.id,
                                  totalAmount: order.totalAmount,
                                })
                              }
                              className="flex-1 gradient-btn-primary py-2.5 rounded-xl font-bold text-xs text-white shadow-md cursor-pointer flex items-center justify-center gap-2"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              Pay ₹{order.totalAmount} Now
                            </button>
                          )}

                          {(order.status === 'PENDING' || order.status === 'PENDING_PAYMENT') && (
                            <button
                              onClick={() => setCancelOrderId(order.id)}
                              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Past Completed Orders */}
              {pastOrders.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 font-display">Past Orders</h3>
                  <div className="space-y-3">
                    {pastOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-5 rounded-2xl glass-card border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-slate-500">
                              #{order.id.substring(0, 8)}
                            </span>
                            <span
                              className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                                order.status === 'DELIVERED'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {order.items?.map((it) => `${it.name} (x${it.quantity})`).join(', ')}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-extrabold text-slate-900">
                            ₹{Number(order.totalAmount).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Confirm Cancel Dialog */}
      <ConfirmDialog
        isOpen={!!cancelOrderId}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        confirmText="Yes, Cancel Order"
        confirmVariant="danger"
        onConfirm={confirmCancelOrder}
        onCancel={() => setCancelOrderId(null)}
      />

      {/* Razorpay Payment Modal */}
      {payOrder && (
        <PaymentModal
          isOpen={!!payOrder}
          orderId={payOrder.orderId}
          totalAmount={payOrder.totalAmount}
          onSuccess={() => {
            setPayOrder(null);
            fetchOrders();
          }}
          onClose={() => setPayOrder(null)}
        />
      )}
    </div>
  );
}
