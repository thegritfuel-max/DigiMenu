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
      try {
        const q = query(collection(db, 'restaurants'), orderBy('createdAt', 'desc'), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setTarget(`/${snap.docs[0].id}`);
        } else {
          setTarget('/setup');
        }
      } catch (e) {
        console.error("Redirect error:", e);
        setTarget('/setup');
      } finally {
        setLoading(false);
      }
    };
    checkRestaurants();
  }, []);

  if (loading) return null;
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/admin" element={<AdminRedirect />} />
        <Route path="/:restaurantId/admin/*" element={<AdminPage />} />
        <Route path="/:restaurantId" element={<MenuPage />} />
        <Route path="/:restaurantId/item/:itemId" element={<ItemDetailPage />} />
        <Route path="/:restaurantId/cart" element={<CartPage />} />
        <Route path="/:restaurantId/admin/*" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
