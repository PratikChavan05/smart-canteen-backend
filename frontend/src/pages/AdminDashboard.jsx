import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Users,
  FolderTree,
  UtensilsCrossed,
  Layers,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit2,
  DollarSign,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { api } from '../utils/api';
import { resolveMenuImageUrl, MENU_IMAGE_PLACEHOLDER } from '../utils/images';
import { useToast } from '../context/ToastContext';
import { useWebSocket } from '../context/WebSocketContext';
import AnimatedCounter from '../components/shared/AnimatedCounter';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import ImageUpload from '../components/shared/ImageUpload';

export default function AdminDashboard() {
  const { showToast } = useToast();
  const { subscribe } = useWebSocket();

  const [activeTab, setActiveTab] = useState('overview'); // overview, managers, categories, menu-items, orders
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, orderCountByStatus: {} });
  const [managers, setManagers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  // Orders Pagination
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Forms
  const [managerForm, setManagerForm] = useState({ fullName: '', email: '', password: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [editingCategory, setEditingCategory] = useState(null);
  const [itemForm, setItemForm] = useState({ name: '', description: '', price: '', imageUrl: '', categoryId: '' });
  const [editingItem, setEditingItem] = useState(null);

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // ==================== API Fetches ====================
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/orders/dashboard');
      setStats(res.data || { totalOrders: 0, totalRevenue: 0, orderCountByStatus: {} });
    } catch {
      // ignore
    }
  }, []);

  const fetchManagers = useCallback(async () => {
    try {
      const res = await api.get('/users/managers');
      setManagers(res.data || []);
    } catch {
      // ignore
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data || []);
    } catch {
      // ignore
    }
  }, []);

  const fetchMenuItems = useCallback(async () => {
    try {
      const res = await api.get('/menu-items/manage');
      setMenuItems(res.data || []);
    } catch {
      // ignore
    }
  }, []);

  const fetchAllOrders = useCallback(async () => {
    try {
      const res = await api.get(`/orders?page=${currentPage}&size=8`);
      setOrders(res.data?.content || []);
      setTotalPages(res.data?.totalPages || 0);
    } catch {
      // ignore
    }
  }, [currentPage]);

  useEffect(() => {
    if (activeTab === 'overview') fetchStats();
    if (activeTab === 'managers') fetchManagers();
    if (activeTab === 'categories') fetchCategories();
    if (activeTab === 'menu-items') {
      fetchCategories();
      fetchMenuItems();
    }
    if (activeTab === 'orders') fetchAllOrders();
  }, [activeTab, currentPage, fetchStats, fetchManagers, fetchCategories, fetchMenuItems, fetchAllOrders]);

  // Live WebSocket listener for dashboard stats
  useEffect(() => {
    const unsub = subscribe('/topic/dashboard', () => {
      fetchStats();
      if (activeTab === 'orders') fetchAllOrders();
    });
    return () => unsub();
  }, [subscribe, fetchStats, fetchAllOrders, activeTab]);

  // ==================== Manager Actions ====================
  const handleCreateManager = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users/managers', managerForm);
      showToast('Manager account registered successfully!', 'success');
      setManagerForm({ fullName: '', email: '', password: '' });
      fetchManagers();
    } catch (err) {
      showToast(err.message || 'Failed to create manager', 'error');
    }
  };

  // ==================== Category Actions ====================
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, categoryForm);
        showToast('Category updated successfully', 'success');
      } else {
        await api.post('/categories', categoryForm);
        showToast('Category created successfully', 'success');
      }
      setCategoryForm({ name: '', description: '' });
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      showToast(err.message || 'Failed to save category', 'error');
    }
  };

  const confirmDeleteCategory = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Category',
      message: 'Are you sure? Menu items belonging to this category may lose their reference.',
      onConfirm: async () => {
        try {
          await api.delete(`/categories/${id}`);
          showToast('Category deleted successfully', 'info');
          fetchCategories();
        } catch (err) {
          showToast(err.message || 'Failed to delete category', 'error');
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // ==================== MenuItem Actions ====================
  const handleItemSubmit = async (e) => {
    e.preventDefault();
    const imageUrl = typeof itemForm.imageUrl === 'string' ? itemForm.imageUrl.trim() : '';
    const payload = {
      name: itemForm.name?.trim(),
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
        showToast('Menu item created successfully!', 'success');
      }
      setItemForm({ name: '', description: '', price: '', imageUrl: '', categoryId: '' });
      setEditingItem(null);
      fetchMenuItems();
    } catch (err) {
      showToast(err.message || 'Failed to save menu item', 'error');
    }
  };

  const confirmDeleteItem = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Menu Item',
      message: 'Are you sure you want to remove this dish from the canteen menu? Any S3 image will be removed.',
      onConfirm: async () => {
        try {
          await api.delete(`/menu-items/${id}`);
          showToast('Menu item deleted', 'info');
          fetchMenuItems();
        } catch (err) {
          showToast(err.message || 'Failed to delete menu item', 'error');
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
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
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${map[status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const navBtn = (tab) =>
    `w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
      activeTab === tab
        ? 'bg-teal-50 text-teal-800 border border-teal-200'
        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
    }`;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 shrink-0">
        <div className="glass-panel rounded-3xl p-3 border border-slate-200 space-y-1.5 bg-white">
          <button onClick={() => setActiveTab('overview')} className={navBtn('overview')}>
            <TrendingUp className="w-4 h-4" />
            <span>Overview & KPIs</span>
          </button>
          <button onClick={() => setActiveTab('managers')} className={navBtn('managers')}>
            <Users className="w-4 h-4" />
            <span>Managers Staff</span>
          </button>
          <button onClick={() => setActiveTab('categories')} className={navBtn('categories')}>
            <FolderTree className="w-4 h-4" />
            <span>Categories</span>
          </button>
          <button onClick={() => setActiveTab('menu-items')} className={navBtn('menu-items')}>
            <UtensilsCrossed className="w-4 h-4" />
            <span>Menu Catalog</span>
          </button>
          <button onClick={() => setActiveTab('orders')} className={navBtn('orders')}>
            <Layers className="w-4 h-4" />
            <span>Master Orders Log</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in-up">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl glass-card border border-slate-200 flex items-center gap-4 bg-white">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold">Total Orders</span>
                  <h4 className="text-3xl font-black text-slate-900 mt-1">
                    <AnimatedCounter value={stats.totalOrders} />
                  </h4>
                </div>
              </div>

              <div className="p-6 rounded-3xl glass-card border border-slate-200 flex items-center gap-4 bg-white">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold">Total Revenue</span>
                  <h4 className="text-3xl font-black text-emerald-700 mt-1">
                    <AnimatedCounter prefix="₹" value={stats.totalRevenue || 0} />
                  </h4>
                </div>
              </div>

              <div className="p-6 rounded-3xl glass-card border border-slate-200 flex items-center gap-4 bg-white">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold">Delivered Meals</span>
                  <h4 className="text-3xl font-black text-slate-900 mt-1">
                    <AnimatedCounter value={stats.orderCountByStatus?.DELIVERED || 0} />
                  </h4>
                </div>
              </div>
            </div>

            {/* Distribution */}
            <div className="p-6 rounded-3xl glass-card border border-slate-200 space-y-4 bg-white">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">
                Order Pipeline Breakdown
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {Object.entries(stats.orderCountByStatus || {}).map(([status, count]) => (
                  <div
                    key={status}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center flex flex-col items-center gap-2"
                  >
                    {getStatusBadge(status)}
                    <span className="text-xl font-extrabold text-slate-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MANAGERS TAB */}
        {activeTab === 'managers' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
            <div className="p-6 rounded-3xl glass-card border border-slate-200 h-fit space-y-4 bg-white">
              <h3 className="font-bold text-slate-900 text-base font-display">Create Manager</h3>
              <form onSubmit={handleCreateManager} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={managerForm.fullName}
                    onChange={(e) => setManagerForm({ ...managerForm, fullName: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-slate-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={managerForm.email}
                    onChange={(e) => setManagerForm({ ...managerForm, email: e.target.value })}
                    placeholder="rahul@canteen.com"
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-slate-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={managerForm.password}
                    onChange={(e) => setManagerForm({ ...managerForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-slate-900 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 mt-2 gradient-btn-primary rounded-xl font-bold text-xs text-white shadow-md cursor-pointer"
                >
                  Register Manager
                </button>
              </form>
            </div>

            <div className="md:col-span-2 p-6 rounded-3xl glass-card border border-slate-200 space-y-4 bg-white">
              <h3 className="font-bold text-slate-900 text-base font-display">Active Managers ({managers.length})</h3>
              {managers.length === 0 ? (
                <p className="text-xs text-slate-500">No managers found.</p>
              ) : (
                <div className="space-y-3">
                  {managers.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{m.fullName}</h4>
                        <span className="text-xs text-slate-500">{m.email}</span>
                      </div>
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-semibold">
                        MANAGER
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
            <div className="p-6 rounded-3xl glass-card border border-slate-200 h-fit space-y-4 bg-white">
              <h3 className="font-bold text-slate-900 text-base font-display">
                {editingCategory ? 'Edit Category' : 'New Category'}
              </h3>
              <form onSubmit={handleCategorySubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    placeholder="e.g. Beverages"
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-slate-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    placeholder="Hot & cold drinks"
                    className="glass-input w-full px-4 py-2 rounded-xl text-slate-900 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 gradient-btn-primary rounded-xl font-bold text-xs text-white shadow-md cursor-pointer"
                  >
                    {editingCategory ? 'Update' : 'Create'}
                  </button>
                  {editingCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(null);
                        setCategoryForm({ name: '', description: '' });
                      }}
                      className="px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="md:col-span-2 p-6 rounded-3xl glass-card border border-slate-200 space-y-4 bg-white">
              <h3 className="font-bold text-slate-900 text-base font-display">
                Available Categories ({categories.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{c.name}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.description || 'No description'}</p>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                      <button
                        onClick={() => {
                          setEditingCategory(c);
                          setCategoryForm({ name: c.name, description: c.description || '' });
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-800 hover:bg-teal-50 cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => confirmDeleteCategory(c.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MENU ITEMS TAB */}
        {activeTab === 'menu-items' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
            <div className="p-6 rounded-3xl glass-card border border-slate-200 h-fit space-y-4 bg-white">
              <h3 className="font-bold text-slate-900 text-base font-display">
                {editingItem ? 'Edit Dish' : 'Create Dish'}
              </h3>
              <form onSubmit={handleItemSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Food Name *</label>
                  <input
                    type="text"
                    required
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    placeholder="e.g. Masala Dosa"
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-slate-900 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={itemForm.price}
                      onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                      placeholder="60.00"
                      className="glass-input w-full px-4 py-2.5 rounded-xl text-slate-900 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Category *</label>
                    <select
                      required
                      value={itemForm.categoryId}
                      onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                      className="glass-input w-full px-3 py-2.5 rounded-xl text-slate-900 text-sm bg-white"
                    >
                      <option value="">Select</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* S3 Image Upload Component */}
                <ImageUpload
                  value={itemForm.imageUrl}
                  onChange={(url) => setItemForm({ ...itemForm, imageUrl: url })}
                  folder="menu-items"
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    placeholder="Crispy crepe with spiced potato filling"
                    className="glass-input w-full px-4 py-2 rounded-xl text-slate-900 text-sm"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 gradient-btn-primary rounded-xl font-bold text-xs text-white shadow-md cursor-pointer"
                  >
                    {editingItem ? 'Update Item' : 'Create Item'}
                  </button>
                  {editingItem && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(null);
                        setItemForm({ name: '', description: '', price: '', imageUrl: '', categoryId: '' });
                      }}
                      className="px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="md:col-span-2 p-6 rounded-3xl glass-card border border-slate-200 space-y-4 bg-white">
              <h3 className="font-bold text-slate-900 text-base font-display">
                Menu Catalog ({menuItems.length})
              </h3>
              <div className="space-y-3">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={resolveMenuImageUrl(item.imageUrl) || MENU_IMAGE_PLACEHOLDER}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = MENU_IMAGE_PLACEHOLDER;
                        }}
                      />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-500">{item.categoryName}</span>
                          <span className="text-[10px] font-extrabold text-emerald-700">
                            ₹{Number(item.price).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setItemForm({
                            name: item.name,
                            description: item.description || '',
                            price: item.price.toString(),
                            imageUrl: item.imageUrl || '',
                            categoryId: item.categoryId,
                          });
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-teal-800 hover:bg-teal-50 cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => confirmDeleteItem(item.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MASTER ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="p-6 rounded-3xl glass-card border border-slate-200 space-y-4 animate-fade-in-up bg-white">
            <h3 className="font-bold text-slate-900 text-base font-display">System Master Orders Log</h3>
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-slate-900 font-bold">
                        #{order.id.substring(0, 10)}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-xs text-slate-500">Customer: {order.customerId}</p>
                    <span className="text-[10px] text-slate-400">{formatDate(order.createdAt)}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-700">
                      ₹{Number(order.totalAmount).toFixed(2)}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {order.items?.map((i) => `${i.name} (×${i.quantity})`).join(', ')}
                    </p>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold text-slate-500">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Confirm Action Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
