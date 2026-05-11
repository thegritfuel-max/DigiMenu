import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { MenuItem, Offer } from '../types';

interface CartItem extends MenuItem {
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  appliedOffer: Offer | null;
  applyOffer: (offer: Offer | null) => void;
  subtotal: number;
  discountAmount: number;
  total: number;
  isLoaded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  // Extract restaurantId from pathname: /restaurantId/...
  const restaurantId = pathname.split('/')[1] || undefined;
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [appliedOffer, setAppliedOffer] = useState<Offer | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const cartKey = `cart_${restaurantId || 'global'}`;

  // Load cart from local storage on mount
  useEffect(() => {
    if (restaurantId === undefined && !window.location.pathname.includes('setup')) return;
    
    const savedCart = localStorage.getItem(cartKey);
    try {
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          setCartItems(parsed);
        }
      } else {
        setCartItems([]);
      }
    } catch (e) {
      console.error('Failed to parse cart', e);
      setCartItems([]);
    } finally {
      setIsLoaded(true);
    }
  }, [restaurantId, cartKey]);

  // Save cart to local storage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(cartKey, JSON.stringify(cartItems));
    }
  }, [cartItems, isLoaded, cartKey]);

  const addToCart = (item: MenuItem) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCartItems(prev => {
      return prev.map(i => {
        if (i.id === itemId) {
          const newQty = Math.max(0, i.quantity + delta);
          return { ...i, quantity: newQty };
        }
        return i;
      }).filter(i => i.quantity > 0);
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedOffer(null);
  };

  const applyOffer = (offer: Offer | null) => {
    setAppliedOffer(offer);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountAmount = appliedOffer?.discountPercentage 
    ? Math.round(subtotal * (appliedOffer.discountPercentage / 100)) 
    : 0;
  const total = Math.max(0, subtotal - discountAmount);

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart,
      appliedOffer,
      applyOffer,
      subtotal,
      discountAmount,
      total,
      isLoaded
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
