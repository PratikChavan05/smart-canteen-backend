import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (menuItem, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === menuItem.id);
      if (existing) {
        const nextQty = Math.min(50, existing.quantity + quantity);
        return prev.map((item) =>
          item.id === menuItem.id ? { ...item, quantity: nextQty } : item
        );
      }
      return [...prev, { ...menuItem, quantity: Math.min(50, quantity) }];
    });
  };

  const removeFromCart = (itemId) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    const capped = Math.min(50, quantity);
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity: capped } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('cart');
  };

  const totalCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalCount,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
