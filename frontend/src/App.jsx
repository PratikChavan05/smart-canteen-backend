import React, { useState } from 'react';
import Navbar from './components/Navbar';
import CartSidebar from './components/CartSidebar';
import Login from './pages/Login';
import CustomerDashboard from './pages/CustomerDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PaymentModal from './components/shared/PaymentModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { CartProvider, useCart } from './context/CartContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { api } from './utils/api';

function MainApp() {
  const { user, isAuthenticated, logout } = useAuth();
  const { showToast } = useToast();
  const { items: cartItems, addToCart, updateQuantity, removeFromCart, clearCart, totalCount, totalAmount } = useCart();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [pendingPaymentOrder, setPendingPaymentOrder] = useState(null); // { orderId, totalAmount }
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    setIsPlacingOrder(true);
    const orderPayload = {
      items: cartItems.map((item) => ({
        menuItemId: item.id,
        quantity: item.quantity,
      })),
    };

    try {
      const res = await api.post('/orders', orderPayload);
      const createdOrder = res.data;
      clearCart();
      setIsCartOpen(false);
      // Open Payment Modal for Razorpay checkout
      setPendingPaymentOrder({
        orderId: createdOrder.id,
        totalAmount: createdOrder.totalAmount,
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      showToast(err.message || 'Failed to initialize order', 'error');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handlePaymentSuccess = () => {
    setPendingPaymentOrder(null);
    setRefreshTrigger((prev) => prev + 1);
    showToast('Order paid and sent to the kitchen!', 'success');
  };

  return (
    <div className="min-h-screen text-slate-900 flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900">
      {isAuthenticated && user ? (
        <>
          <Navbar
            user={user}
            cartCount={totalCount}
            onCartClick={() => setIsCartOpen(true)}
            onLogout={() => {
              logout();
              showToast('Logged out successfully', 'info');
            }}
          />

          <main className="flex-1">
            {user.role === 'ADMIN' && <AdminDashboard />}
            {user.role === 'MANAGER' && <ManagerDashboard />}
            {user.role === 'CUSTOMER' && (
              <CustomerDashboard
                onAddToCart={(item) => {
                  addToCart(item);
                  showToast(`Added ${item.name} to cart`, 'success', 2500);
                }}
                refreshTrigger={refreshTrigger}
              />
            )}
          </main>

          <CartSidebar
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cartItems={cartItems}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={(id) => {
              removeFromCart(id);
              showToast('Item removed from cart', 'info', 2000);
            }}
            onCheckout={handleCheckout}
            isPlacingOrder={isPlacingOrder}
          />

          {/* Razorpay Payment Modal */}
          {pendingPaymentOrder && (
            <PaymentModal
              isOpen={!!pendingPaymentOrder}
              orderId={pendingPaymentOrder.orderId}
              totalAmount={pendingPaymentOrder.totalAmount}
              onSuccess={handlePaymentSuccess}
              onClose={() => {
                setPendingPaymentOrder(null);
                setRefreshTrigger((prev) => prev + 1);
              }}
            />
          )}
        </>
      ) : (
        <Login onAuthSuccess={() => setRefreshTrigger((prev) => prev + 1)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <WebSocketProvider>
            <MainApp />
          </WebSocketProvider>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
