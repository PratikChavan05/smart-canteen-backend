import React, { useState, useEffect, useCallback } from 'react';
import { ToggleRight, Calendar, DollarSign, ClipboardList, Plus, ChefHat, Check, X, Package, Edit2, Trash2 } from 'lucide-react';
import { api } from '../utils/api';
import { resolveMenuImageUrl, MENU_IMAGE_PLACEHOLDER } from '../utils/images';
import { useToast } from '../context/ToastContext';
import { useWebSocket } from '../context/WebSocketContext';
import AnimatedCounter from '../components/shared/AnimatedCounter';
import ImageUpload from '../components/shared/ImageUpload';
import EmptyState from '../components/shared/EmptyState';
import ConfirmDialog from '../components/shared/ConfirmDialog';

export default function ManagerDashboard() {
  const { showToast } = useToast();
  const { subscribe } = useWebSocket();

  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [dailySalesDate, setDailySalesDate] = useState(new Date().toISOString().split('T')[0]);
  const [salesSummary, setSalesSummary] = useState({ totalOrders: 0, totalRevenue: 0 });
  const [activeSubTab, setActiveSubTab] = useState('orders'); // 'orders' | 'menu-availability' | 'sales-report'
  const [loading, setLoading] = useState(false);

  // Add / Edit Item Modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    imageUrl: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, name: '' });

  const emptyItemForm = () => ({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    imageUrl: '',
  });

  const openCreateModal = () => {
    fetchCategories();
    setEditingItem(null);
    setItemForm(emptyItemForm());
    setShowItemModal(true);
  };

  const openEditModal = (item) => {
    fetchCategories();
    setEditingItem(item);
    setItemForm({
      name: item.name || '',
      description: item.description || '',
      price: item.price != null ? String(item.price) : '',
      categoryId: item.categoryId || '',
      imageUrl: item.imageUrl || '',
    });
    setShowItemModal(true);
  };

  const closeItemModal = () => {
    setShowItemModal(false);
    setEditingItem(null);
    setItemForm(emptyItemForm());
  };

  const fetchOrders = useCallback(async () => {
    try {
      const endpoint = statusFilter === 'ALL' ? '/orders/status' : `/orders/status?status=${statusFilter}`;
      const res = await api.get(endpoint);
      setOrders(res.data || []);
    } catch {
      showToast('Failed to fetch orders', 'error');
    }
  }, [statusFilter, showToast]);

  const fetchMenuItems = useCallback(async () => {
    try {
      const res = await api.get('/menu-items/manage');
      setMenuItems(res.data || []);
    } catch {
      showToast('Failed to fetch menu items', 'error');
    }
  }, [showToast]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data || []);
    } catch {
      // ignore
    }
  }, []);

  const fetchDailySummary = useCallback(async () => {
    try {
      const res = await api.get(`/orders/daily-summary?date=${dailySalesDate}`);
      setSalesSummary(res.data || { totalOrders: 0, totalRevenue: 0 });
    } catch {
      // ignore
    }
  }, [dailySalesDate]);

  useEffect(() => {
    if (activeSubTab === 'orders') fetchOrders();
    if (activeSubTab === 'menu-availability') {
      fetchMenuItems();
      fetchCategories();
    }
    if (activeSubTab === 'sales-report') fetchDailySummary();
  }, [activeSubTab, fetchOrders, fetchMenuItems, fetchCategories, fetchDailySummary]);

  // Real-time WebSocket listener for paid incoming orders and status changes
  useEffect(() => {
    const unsubNew = subscribe('/topic/orders/new', (newOrder) => {
      // Only paid orders are broadcast as "new" for the kitchen
      if (newOrder.status === 'PENDING_PAYMENT') return;
      showToast(`New Order #${newOrder.id.substring(0, 6)} received!`, 'info', 5000);
      setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
    });

    const unsubStatus = subscribe('/topic/orders/status', (updatedOrder) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === updatedOrder.id);
        if (!exists) {
          if (statusFilter === 'ALL' || statusFilter === updatedOrder.status) {
            return [updatedOrder, ...prev];
          }
          return prev;
        }
        const next = prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
        if (statusFilter !== 'ALL' && updatedOrder.status !== statusFilter) {
          return next.filter((o) => o.id !== updatedOrder.id);
        }
        return next;
      });
    });

    return () => {
      unsubNew();
      unsubStatus();
    };
  }, [subscribe, showToast, statusFilter]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      showToast(`Order status updated to ${newStatus}`, 'success');
      fetchOrders();
    } catch (err) {
      showToast(err.message || 'Failed to update order status', 'error');
    }
  };

  const handleToggleAvailability = async (itemId, currentAvailability) => {
    try {
      await api.patch(`/menu-items/${itemId}/availability?available=${!currentAvailability}`);
      showToast('Menu item availability updated', 'success');
      fetchMenuItems();
    } catch (err) {
      showToast('Failed to update availability', 'error');
    }
  };

  const handleSaveMenuItem = async (e) => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.price || !itemForm.categoryId) {
      showToast('Please fill all required fields', 'warning');
      return;
    }

    const imageUrl = typeof itemForm.imageUrl === 'string' ? itemForm.imageUrl.trim() : '';
    const payload = {
      name: itemForm.name.trim(),
      description: itemForm.description?.trim() || '',
      price: parseFloat(itemForm.price),
      categoryId: itemForm.categoryId,
      ...(imageUrl ? { imageUrl } : {}),
    };

    try {
      if (editingItem) {
        await api.put(`/menu-items/${editingItem.id}`, payload);
        showToast('Menu item updated successfully', 'success');
      } else {
        await api.post('/menu-items', payload);
        showToast('New menu item created successfully!', 'success');
      }
      closeItemModal();
      fetchMenuItems();
    } catch (err) {
      showToast(err.message || 'Failed to save menu item', 'error');
    }
  };

  const handleDeleteMenuItem = async () => {
    if (!deleteConfirm.id) return;
    try {
      await api.delete(`/menu-items/${deleteConfirm.id}`);
      showToast('Menu item deleted', 'info');
      setDeleteConfirm({ isOpen: false, id: null, name: '' });
      fetchMenuItems();
    } catch (err) {
      showToast(err.message || 'Failed to delete menu item', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      PENDING_PAYMENT: 'bg-amber-50 text-amber-700 border-amber-200',
      PENDING: 'bg-teal-50 text-teal-800 border-teal-200',
      PREPARING: 'bg-sky-50 text-sky-700 border-sky-200',
      READY: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${map[status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="sc-hero p-8 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="sc-badge mb-2">
            <ChefHat className="w-3.5 h-3.5" />
            <span>Kitchen & Order Operations</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 font-display">Kitchen Manager Hub</h1>
          <p className="text-slate-500 text-xs mt-1">
            Real-time incoming orders, live kitchen dispatch, and menu stock controls.
          </p>
        </div>

        {/* Quick action: Add item button */}
        <button
          onClick={openCreateModal}
          className="gradient-btn-primary px-5 py-3 rounded-2xl font-bold text-xs text-white shadow-md flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Menu Item</span>
        </button>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('orders')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm transition-all cursor-pointer border-b-2 -mb-px whitespace-nowrap ${
            activeSubTab === 'orders'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Live Order Stream</span>
          <span className="text-xs bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-slate-600">
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('menu-availability')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm transition-all cursor-pointer border-b-2 -mb-px whitespace-nowrap ${
            activeSubTab === 'menu-availability'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ToggleRight className="w-4 h-4" />
          <span>Menu & Stock</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sales-report')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm transition-all cursor-pointer border-b-2 -mb-px whitespace-nowrap ${
            activeSubTab === 'sales-report'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Daily Sales</span>
        </button>
      </div>

      {/* TAB 1: LIVE ORDERS */}
      {activeSubTab === 'orders' && (
        <div className="space-y-6">
          {/* Status filter pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {['ALL', 'PENDING_PAYMENT', 'PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'].map(
              (st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === st
                      ? 'gradient-btn-primary text-white shadow-md'
                      : 'glass-card text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              )
            )}
          </div>

          {/* Order Cards Grid */}
          {orders.length === 0 ? (
            <EmptyState
              icon={<ChefHat className="w-7 h-7 text-teal-700" />}
              title="No incoming orders"
              description={`No orders found matching filter: ${statusFilter}`}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-6 rounded-3xl glass-card border border-slate-200 hover:border-teal-700/25 transition-all space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-mono text-slate-500">
                        #{order.id.substring(0, 8)}
                      </span>
                      <p className="text-xs text-teal-800 font-semibold mt-0.5">
                        Customer: {order.customerId}
                      </p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  {/* Items list */}
                  <div className="py-3 border-y border-slate-200 space-y-2 text-xs">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-slate-700 font-medium">
                        <span>
                          <strong className="text-slate-900">{item.quantity}×</strong> {item.name}
                        </span>
                        <span className="text-slate-500">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Bottom bar & action controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                    <div>
                      <span className="text-xs text-slate-500">Amount: </span>
                      <span className="text-base font-black text-emerald-700">
                        ₹{Number(order.totalAmount).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {order.status === 'PENDING_PAYMENT' && (
                        <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                          Waiting for customer payment
                        </span>
                      )}

                      {order.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                            className="px-4 py-2 rounded-xl gradient-btn-primary font-bold text-xs text-white shadow-md cursor-pointer flex items-center gap-1.5"
                          >
                            <ChefHat className="w-3.5 h-3.5" />
                            Accept & Cook
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                            className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100 cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {order.status === 'PREPARING' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'READY')}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md cursor-pointer transition flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Mark as Ready
                        </button>
                      )}

                      {order.status === 'READY' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                          className="px-4 py-2 rounded-xl gradient-btn-success font-bold text-xs text-white shadow-md cursor-pointer transition flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MENU AVAILABILITY */}
      {activeSubTab === 'menu-availability' && (
        <div className="glass-card rounded-3xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase bg-slate-50">
                  <th className="py-4 px-6">Dish</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Price</th>
                  <th className="py-4 px-6 text-center">In Stock</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {menuItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 flex items-center gap-3">
                      <img
                        src={resolveMenuImageUrl(item.imageUrl) || MENU_IMAGE_PLACEHOLDER}
                        alt={item.name}
                        className="w-10 h-10 object-cover rounded-xl border border-slate-200"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = MENU_IMAGE_PLACEHOLDER;
                        }}
                      />
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">{item.name}</span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">{item.categoryName}</td>
                    <td className="py-4 px-6 font-extrabold text-emerald-700 text-sm">
                      ₹{Number(item.price).toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          item.available
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {item.available ? 'Available' : 'Sold Out'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        <button
                          onClick={() => openEditModal(item)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100 flex items-center gap-1.5"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleAvailability(item.id, item.available)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                            item.available
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {item.available ? 'Sold Out' : 'Available'}
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({ isOpen: true, id: item.id, name: item.name })
                          }
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer border border-transparent hover:border-rose-200"
                          title="Delete item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DAILY SALES REPORT */}
      {activeSubTab === 'sales-report' && (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="p-6 rounded-3xl glass-card border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base font-display">Select Reporting Date</h3>
              <p className="text-xs text-slate-500 mt-0.5">Filter sales and revenue performance by date</p>
            </div>
            <input
              type="date"
              value={dailySalesDate}
              onChange={(e) => setDailySalesDate(e.target.value)}
              className="glass-input px-4 py-2 rounded-xl text-slate-900 text-sm font-semibold cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl glass-card border border-slate-200 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Orders Completed
                </span>
                <h4 className="text-3xl font-extrabold text-slate-900 mt-1">
                  <AnimatedCounter value={salesSummary.totalOrders || 0} />
                </h4>
              </div>
            </div>

            <div className="p-6 rounded-3xl glass-card border border-slate-200 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Daily Revenue
                </span>
                <h4 className="text-3xl font-extrabold text-emerald-700 mt-1">
                  <AnimatedCounter
                    prefix="₹"
                    value={salesSummary.totalRevenue || 0}
                  />
                </h4>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT MENU ITEM MODAL */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in-up">
          <div className="glass-panel w-full max-w-lg p-6 rounded-3xl border border-slate-200 shadow-xl relative max-h-[90vh] overflow-y-auto bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 font-display">
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h3>
              <button
                onClick={closeItemModal}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMenuItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paneer Butter Masala"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                <textarea
                  placeholder="Ingredients, prep style, etc."
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  rows={2}
                  className="glass-input w-full px-4 py-2 rounded-xl text-slate-900 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="120.00"
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Category *</label>
                  <select
                    required
                    value={itemForm.categoryId}
                    onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-slate-900 text-sm bg-white cursor-pointer"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <ImageUpload
                value={itemForm.imageUrl}
                onChange={(url) => setItemForm({ ...itemForm, imageUrl: url })}
                folder="menu-items"
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeItemModal}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gradient-btn-primary px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md cursor-pointer"
                >
                  {editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Menu Item"
        message={`Remove "${deleteConfirm.name}" from the menu? This cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={handleDeleteMenuItem}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null, name: '' })}
      />
    </div>
  );
}
