import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { db } from './firebase';
import { collection, getDocs, limit, query, orderBy } from 'firebase/firestore';
import { MenuPage } from './pages/MenuPage';
import { AdminPage } from './pages/AdminPage';
import { LandingPage as SetupPage } from './pages/LandingPage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { CartPage } from './pages/CartPage';

function RootRedirect() {
  const [target, setTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRestaurants = async () => {
      // Immediate check of localStorage for fastest possible redirect
      const lastId = localStorage.getItem('last_restaurant_id');
      
      try {
        const q = query(collection(db, 'restaurants'), orderBy('createdAt', 'desc'), limit(1));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const firstId = snap.docs[0].id;
          setTarget(`/${firstId}`);
          localStorage.setItem('last_restaurant_id', firstId);
        } else if (lastId) {
          setTarget(`/${lastId}`);
        } else {
          setTarget('/setup');
        }
      } catch (e) {
        console.error("Redirect error:", e);
        setTarget(lastId ? `/${lastId}` : '/setup');
      } finally {
        setLoading(false);
      }
    };
    checkRestaurants();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-[#111] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return <Navigate to={target || '/setup'} replace />;
}

function AdminRedirect() {
  const [target, setTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const q = query(collection(db, 'restaurants'), orderBy('createdAt', 'desc'), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setTarget(`/${snap.docs[0].id}/admin`);
        } else {
          setTarget('/setup');
        }
      } catch (e) {
        setTarget('/setup');
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, []);

  if (loading) return null;
  return <Navigate to={target || '/setup'} replace />;
}

import { CartProvider } from './context/CartContext';

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/admin" element={<AdminRedirect />} />
          <Route path="/:restaurantId/admin/*" element={<AdminPage />} />
          <Route path="/:restaurantId" element={<MenuPage />} />
          <Route path="/:restaurantId/item/:itemId" element={<ItemDetailPage />} />
          <Route path="/:restaurantId/cart" element={<CartPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}
