import { useState, useEffect } from 'react';
import { useParams, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, addDoc, orderBy } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Restaurant, Category, MenuItem, Order, OrderStatus, OperationType, Banner, Offer } from '../types';
import { handleFirestoreError } from '../lib/dbService';
import { LayoutDashboard, Utensils, ListFilter, Image as ImageIcon, Settings, Bell, Clock, CheckCircle2, ChevronRight, Plus, Search, Trash2, Tag, Upload, Globe, Star, TrendingUp, Menu, X, LogOut, Lock, Instagram, Facebook, Youtube, Linkedin, MessageCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function AdminPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!restaurantId) return;
    return onSnapshot(doc(db, 'restaurants', restaurantId), (doc) => {
      setRestaurant({ id: doc.id, ...doc.data() } as Restaurant);
    });
  }, [restaurantId]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  };

  const isAdmin = restaurant && (
    !restaurant.adminUids || 
    restaurant.adminUids.length === 0 || 
    restaurant.adminUids.includes(user?.uid || '')
  );
  const primaryColor = restaurant?.primaryColor || '#ea580c'; // default orange-600

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center space-y-6">
        <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-orange-500">
          <Lock size={40} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black uppercase tracking-tight">Operation Locked</h1>
          <p className="text-gray-500 text-sm max-w-xs">You need authorized neural clearance to access this lab interface.</p>
        </div>
        {!user ? (
          <button 
            onClick={handleLogin}
            className="flex items-center gap-3 bg-white border border-gray-200 px-8 py-4 rounded-2xl shadow-sm hover:shadow-md transition-all font-bold"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" />
            Admin Login
          </button>
        ) : (
          <div className="space-y-4">
             <p className="text-red-500 text-xs font-black uppercase tracking-widest">Access Denied for {user.email}</p>
             <button onClick={() => auth.signOut()} className="text-gray-400 font-bold flex items-center gap-2 mx-auto">
                <LogOut size={16} /> Sign out
             </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-[110] w-64 bg-black text-white flex flex-col p-6 transition-transform lg:relative lg:translate-x-0 lg:flex",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-black bg-[#00FF44] shadow-[0_0_20px_rgba(0,255,68,0.4)]"
            >
              {restaurant?.name?.charAt(0) || 'T'}
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-black tracking-tighter uppercase truncate text-gray-400 group-hover:text-white transition-colors">{restaurant?.name || 'TANDUR CORNER'}</h1>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 space-y-2">
          <SidebarItem onClick={() => setSidebarOpen(false)} to="" icon={<LayoutDashboard size={20} />} label="Dashboard" exact />
          <SidebarItem onClick={() => setSidebarOpen(false)} to="/menu" icon={<Utensils size={20} />} label="Menu Items" />
          <SidebarItem onClick={() => setSidebarOpen(false)} to="/categories" icon={<ListFilter size={20} />} label="Categories" />
          <SidebarItem onClick={() => setSidebarOpen(false)} to="/offers" icon={<Tag size={20} />} label="Offers & Promo" />
          <SidebarItem onClick={() => setSidebarOpen(false)} to="/banners" icon={<ImageIcon size={20} />} label="Hero Banners" />
          
          <div className="pt-4 mt-4 border-t border-white/5">
             <SidebarItem onClick={() => setSidebarOpen(false)} to="/settings" icon={<Settings size={20} />} label="Settings" isProminent />
          </div>

          <Link 
            to={`/${restaurantId}`} 
            className="flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-black bg-[#111111] text-white hover:bg-white/10 transition-all mt-6 shadow-2xl group border border-white/5"
          >
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
              <Globe size={18} />
            </div>
            Return to Menu
          </Link>
        </nav>

        <div className="mt-auto pt-6">
          <div className="bg-[#111111] rounded-2xl p-4 flex items-center gap-3 border border-white/5">
            <div className="w-10 h-10 rounded-full bg-white overflow-hidden flex-shrink-0">
               <img src={restaurant?.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${restaurant?.name}`} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black truncate text-white uppercase tracking-tight">{restaurant?.name || 'Tandur Corner'}</p>
              <button 
                onClick={() => auth.signOut()}
                className="text-[10px] text-gray-500 font-bold hover:text-red-400 flex items-center gap-1 uppercase tracking-widest"
              >
                Logout ➜
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-100 px-4 md:px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="flex flex-col">
              <h2 className="font-bold text-base md:text-lg leading-none">{restaurant?.name || 'Dashboard'}</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Status: Active Hub</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <Link 
              to={`/${restaurantId}`} 
              target="_blank"
              className="hidden sm:flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl text-xs font-bold text-gray-600 transition-all border border-gray-100"
            >
              <Globe size={14} /> View Menu
            </Link>
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-orange-600 rounded-full" />
            </button>
            <div className="hidden sm:block h-8 w-px bg-gray-100" />
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex flex-col items-end">
                 <p className="text-xs font-bold text-gray-900 leading-none">{user.displayName || 'Admin'}</p>
                 <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Clearance: Level 4</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 overflow-hidden shadow-sm">
                <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="menu" element={<AdminMenu />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="offers" element={<AdminOffers />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="settings" element={<AdminSettings user={user!} />} />
            <Route path="*" element={<div className="flex items-center justify-center h-full text-gray-400 font-black uppercase tracking-[0.5em]">Section Offline</div>} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ to, icon, label, exact, onClick, isProminent }: { to: string, icon: any, label: string, exact?: boolean, onClick?: () => void, isProminent?: boolean }) {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const location = useLocation();
  const fullPath = `/${restaurantId}/admin${to}`;
  const isActive = exact ? location.pathname === fullPath : location.pathname.startsWith(fullPath);

  if (isProminent) {
    return (
      <Link 
        to={fullPath}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-black transition-all shadow-2xl",
          isActive ? "bg-[#00FF44] text-black shadow-[0_0_30px_rgba(0,255,68,0.3)]" : "text-gray-400 hover:text-white hover:bg-white/5"
        )}
      >
        {icon}
        {label}
      </Link>
    );
  }

  return (
    <Link 
      to={fullPath}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
        isActive ? "text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
      )}
    >
      <div className={cn(
        "p-2 rounded-lg transition-colors",
        isActive ? "text-[#00FF44]" : "text-gray-500"
      )}>
        {icon}
      </div>
      {label}
    </Link>
  );
}

function AdminSettings({ user }: { user: FirebaseUser }) {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!restaurantId) return;
    return onSnapshot(doc(db, 'restaurants', restaurantId), (doc) => {
      setRestaurant({ id: doc.id, ...doc.data() } as Restaurant);
    });
  }, [restaurantId]);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!restaurantId || !restaurant) return;
    setLoading(true);
    try {
      const { id, ...data } = restaurant;
      await updateDoc(doc(db, 'restaurants', restaurantId), data);
      alert('Settings updated successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `restaurants/${restaurantId}`);
    } finally {
      setLoading(false);
    }
  };

  if (!restaurant) return null;

  return (
    <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1">
        <h3 className="font-black text-2xl">Branding & Logic</h3>
        <p className="text-gray-500 text-sm">Control how your lab appears to the world.</p>
      </div>

      <form onSubmit={handleUpdate} className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-6 text-[#111111]">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 block mb-2">Restaurant Name</label>
            <input 
              type="text" 
              value={restaurant.name}
              onChange={e => setRestaurant({...restaurant, name: e.target.value})}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 block mb-2">Neural Branding (Logo)</label>
            <div className="flex gap-4">
              <input 
                type="text" 
                value={restaurant.logoUrl || ''}
                onChange={e => setRestaurant({...restaurant, logoUrl: e.target.value})}
                className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium text-xs"
                placeholder="Paste Matrix URL..."
              />
              <label className="flex flex-col items-center justify-center p-2 bg-gray-100 rounded-xl cursor-pointer hover:bg-gray-200 transition-all border-2 border-dashed border-gray-300">
                <Upload size={16} className="text-gray-400" />
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setRestaurant({...restaurant, logoUrl: reader.result as string});
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
              {restaurant.logoUrl && (
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
                  <img src={restaurant.logoUrl} alt="logo" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 block mb-2">Primary Color</label>
              <div className="flex gap-3">
                <input 
                  type="color" 
                  value={restaurant.primaryColor}
                  onChange={e => setRestaurant({...restaurant, primaryColor: e.target.value})}
                  className="w-12 h-12 rounded-lg cursor-pointer"
                />
                <input 
                  type="text" 
                  value={restaurant.primaryColor}
                  onChange={e => setRestaurant({...restaurant, primaryColor: e.target.value})}
                  className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-orange-500 outline-none text-xs"
                />
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-gray-100 space-y-6">
            <h4 className="text-[10px] uppercase font-black tracking-widest text-orange-600">Social Integration</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'instagram', icon: <Instagram size={16} />, label: 'Instagram' },
                { key: 'facebook', icon: <Facebook size={16} />, label: 'Facebook' },
                { key: 'youtube', icon: <Youtube size={16} />, label: 'YouTube' },
                { key: 'linkedin', icon: <Linkedin size={16} />, label: 'LinkedIn' },
                { key: 'whatsapp', icon: <MessageCircle size={16} />, label: 'WhatsApp (Bot integration)' },
              ].map(({ key, icon, label }) => (
                <div key={key}>
                  <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 block mb-2">{label} Profile</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      {icon}
                    </div>
                    <input 
                      type="text" 
                      value={restaurant.socialLinks?.[key as keyof Restaurant['socialLinks']] || ''}
                      onChange={e => setRestaurant({
                        ...restaurant, 
                        socialLinks: { 
                          ...(restaurant.socialLinks || {}), 
                          [key]: e.target.value 
                        }
                      })}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-6 focus:ring-2 focus:ring-orange-500 outline-none transition-all text-xs"
                      placeholder={`Paste ${label} link...`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

            <div>
              <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 block mb-2">Google Review Link</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-600">
                  <Star size={16} fill="currentColor" />
                </div>
                <input 
                  type="text" 
                  value={restaurant.googleReviewLink || ''}
                  onChange={e => setRestaurant({...restaurant, googleReviewLink: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-6 focus:ring-2 focus:ring-orange-500 outline-none transition-all text-xs font-bold"
                  placeholder="https://search.google.com/local/writereview?placeid=..."
                />
              </div>
              <p className="text-[9px] text-gray-400 mt-2 font-medium italic">Used for the smart review generator on the main menu.</p>
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 block mb-2">Default Feedback Language</label>
            <div className="flex gap-4">
               {['en', 'mr'].map(lang => (
                 <button 
                  key={lang}
                  type="button"
                  onClick={() => setRestaurant({...restaurant, language: lang as any})}
                  className={cn(
                    "flex-1 py-4 rounded-2xl font-bold border transition-all",
                    restaurant.language === lang ? "bg-black text-white border-black" : "bg-white border-gray-100 text-gray-400 hover:border-black"
                  )}
                 >
                   {lang === 'en' ? 'English' : 'Marathi'}
                 </button>
               ))}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 block mb-4">Authorized Admin Clearance (Multiple Accounts)</label>
            <div className="space-y-4">
              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 space-y-2">
                <p className="text-[10px] font-black uppercase text-orange-600">Your Neural Identity (UID)</p>
                <div className="flex items-center justify-between gap-4">
                  <code className="text-xs font-mono font-bold text-orange-900 break-all">{user?.uid}</code>
                  <button 
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(user?.uid || '');
                      alert('UID copied to clipboard');
                    }}
                    className="flex-shrink-0 bg-white text-orange-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase shadow-sm active:scale-95 transition-all"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {(restaurant.adminUids || []).map((uid, index) => (
                <div key={index} className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <Lock size={16} className="text-gray-400" />
                  <span className="flex-1 text-xs font-mono font-bold truncate">{uid}</span>
                  <button 
                    type="button"
                    onClick={() => {
                      const newUids = [...(restaurant.adminUids || [])];
                      newUids.splice(index, 1);
                      setRestaurant({...restaurant, adminUids: newUids});
                    }}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input 
                  type="text" 
                  id="newAdminUid"
                  placeholder="Paste Google User UID here..."
                  className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-orange-500 outline-none text-xs font-mono"
                />
                <button 
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('newAdminUid') as HTMLInputElement;
                    if (input.value && !restaurant.adminUids?.includes(input.value)) {
                      setRestaurant({
                        ...restaurant, 
                        adminUids: [...(restaurant.adminUids || []), input.value]
                      });
                      input.value = '';
                    }
                  }}
                  className="bg-black text-white px-6 rounded-2xl font-bold text-xs"
                >
                  Authorize
                </button>
              </div>
              <p className="text-[9px] text-gray-400 italic">User UID can be found in their profile or by an existing admin. This allows multiple Google accounts to manage this lab.</p>
            </div>
          </div>
        </div>

        <button 
          disabled={loading}
          className="w-full bg-black text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl shadow-gray-200 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Save Configuration'}
        </button>
      </form>
    </div>
  );
}

function AdminOffers() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [editingOffer, setEditingOffer] = useState<Partial<Offer> | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const primaryColor = restaurant?.primaryColor || '#ea580c';

  useEffect(() => {
    if (!restaurantId) return;
    onSnapshot(doc(db, 'restaurants', restaurantId), (doc) => {
      setRestaurant({ id: doc.id, ...doc.data() } as Restaurant);
    });
    const q = query(collection(db, 'restaurants', restaurantId, 'offers'), orderBy('order', 'asc'));
    return onSnapshot(q, (snap) => {
      setOffers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Offer)));
    });
  }, [restaurantId]);

  const saveOffer = async () => {
    if (!restaurantId || !editingOffer?.imageUrl) return;
    try {
      if (editingOffer.id) {
        const { id, ...data } = editingOffer;
        await updateDoc(doc(db, 'restaurants', restaurantId, 'offers', id!), data);
      } else {
        await addDoc(collection(db, 'restaurants', restaurantId, 'offers'), {
          ...editingOffer,
          order: offers.length
        });
      }
      setEditingOffer(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `offers`);
    }
  };

  const deleteOffer = async (id: string) => {
    if (confirm('Delete this reward node?')) {
      try {
        await deleteDoc(doc(db, 'restaurants', restaurantId!, 'offers', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `offers/${id}`);
      }
    }
  };

  return (
    <div className="space-y-8">
       <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-black text-2xl">Reward Nodes</h3>
          <p className="text-gray-500 text-sm">Zomato-style horizontal promotional banners.</p>
        </div>
        <button 
          onClick={() => setEditingOffer({ title: '', imageUrl: '', discountCode: '' })}
          className="text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus size={20} /> New Offer
        </button>
      </div>

      <div className="grid gap-6">
        {offers.map(offer => (
          <div key={offer.id} className="bg-white p-6 rounded-[32px] border border-gray-100 flex gap-6 items-center shadow-sm">
             <div className="w-32 h-20 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
               <img src={offer.imageUrl} className="w-full h-full object-cover" />
             </div>
             <div className="flex-1">
                <h4 className="font-black text-lg">{offer.title}</h4>
                <div className="flex items-center gap-2">
                   <p className="text-xs text-orange-600 font-bold uppercase tracking-widest">{offer.discountCode}</p>
                   {offer.discountPercentage && <span className="text-[10px] font-black bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{offer.discountPercentage}% OFF</span>}
                </div>
             </div>
             <div className="flex gap-2">
               <button onClick={() => setEditingOffer(offer)} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100"><Settings size={16} /></button>
               <button onClick={() => deleteOffer(offer.id)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100"><Trash2 size={16} /></button>
             </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {editingOffer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingOffer(null)} />
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-lg rounded-[40px] p-8 shadow-2xl space-y-6">
                <h3 className="text-2xl font-black">Configure Reward</h3>
                <div className="space-y-4">
                   <input 
                    placeholder="Offer Title (e.g. 50% OFF)" 
                    className="w-full bg-gray-100 border-none rounded-2xl py-4 px-6 font-bold"
                    value={editingOffer.title}
                    onChange={e => setEditingOffer({...editingOffer, title: e.target.value})}
                  />
                   <div className="flex gap-4">
                      <input 
                        placeholder="Discount Code" 
                        className="flex-1 bg-gray-100 border-none rounded-2xl py-4 px-6 font-bold uppercase"
                        value={editingOffer.discountCode}
                        onChange={e => setEditingOffer({...editingOffer, discountCode: e.target.value.toUpperCase()})}
                      />
                      <input 
                        type="number"
                        placeholder="Discount %" 
                        className="w-32 bg-gray-100 border-none rounded-2xl py-4 px-6 font-bold"
                        value={editingOffer.discountPercentage || ''}
                        onChange={e => setEditingOffer({...editingOffer, discountPercentage: Number(e.target.value)})}
                      />
                   </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Image URL (Rec: 1200x500 for wide banners)</label>
                       <div className="flex gap-4">
                          <input 
                            placeholder="https://..." 
                            className="flex-1 bg-gray-100 border-none rounded-2xl py-4 px-6 text-xs"
                            value={editingOffer.imageUrl}
                            onChange={e => setEditingOffer({...editingOffer, imageUrl: e.target.value})}
                          />
                          <label className="flex flex-col items-center justify-center p-2 bg-gray-100 rounded-xl cursor-pointer hover:bg-gray-200 transition-all border-2 border-dashed border-gray-300">
                             <Upload size={16} className="text-gray-400" />
                             <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => {
                                   const file = e.target.files?.[0];
                                   if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => setEditingOffer({...editingOffer, imageUrl: reader.result as string});
                                      reader.readAsDataURL(file);
                                   }
                                }}
                             />
                          </label>
                       </div>
                    </div>
                 </div>
                 <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-2">Business Preview</p>
                    <div className="flex items-center gap-4">
                       <div className="w-20 h-12 bg-gray-200 rounded-lg overflow-hidden border border-orange-200 shadow-sm">
                          {editingOffer.imageUrl && <img src={editingOffer.imageUrl} className="w-full h-full object-cover" />}
                       </div>
                       <div>
                          <p className="font-black text-sm">{editingOffer.title || 'Draft Offer'}</p>
                          <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">{editingOffer.discountCode || 'NO CODE'}</p>
                       </div>
                    </div>
                 </div>
                <div className="flex gap-4">
                   <button onClick={() => setEditingOffer(null)} className="flex-1 py-4 font-bold text-gray-400">Cancel</button>
                   <button onClick={saveOffer} className="flex-1 bg-orange-600 text-white rounded-2xl py-4 font-black">Execute Save</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminBanners() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null);

  useEffect(() => {
    if (!restaurantId) return;
    const q = query(collection(db, 'restaurants', restaurantId, 'banners'), orderBy('order', 'asc'));
    return onSnapshot(q, (snap) => {
      setBanners(snap.docs.map(d => ({ id: d.id, ...d.data() } as Banner)));
    });
  }, [restaurantId]);

  const saveBanner = async () => {
    if (!restaurantId || !editingBanner?.imageUrl) return;
    try {
      if (editingBanner.id) {
        const { id, ...data } = editingBanner;
        await updateDoc(doc(db, 'restaurants', restaurantId, 'banners', id!), data);
      } else {
        await addDoc(collection(db, 'restaurants', restaurantId, 'banners'), { ...editingBanner, order: banners.length });
      }
      setEditingBanner(null);
    } catch (e) { 
      handleFirestoreError(e, OperationType.WRITE, `banners`);
    }
  };

  return (
    <div className="space-y-8">
       <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-black text-2xl">Hero Banners</h3>
          <p className="text-gray-500 text-sm">Full-width sliding banners for the landing area.</p>
        </div>
        <button onClick={() => setEditingBanner({ title: '', imageUrl: '', subtitle: '' })} className="bg-black text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl"><Plus size={20} /> Add Hero</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map(banner => (
          <div key={banner.id} className="group relative aspect-video rounded-[32px] overflow-hidden shadow-sm border border-gray-100">
            <img src={banner.imageUrl} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-6 flex flex-col justify-end">
              <h4 className="text-white font-bold text-lg">{banner.title}</h4>
              <p className="text-white/60 text-xs">{banner.subtitle}</p>
            </div>
            <div className="absolute top-4 right-4 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
               <button onClick={() => setEditingBanner(banner)} className="p-2 bg-white rounded-lg text-black"><Settings size={14} /></button>
               <button onClick={() => deleteDoc(doc(db, 'restaurants', restaurantId!, 'banners', banner.id))} className="p-2 bg-red-500 rounded-lg text-white"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {editingBanner && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-black/60" onClick={() => setEditingBanner(null)} />
           <div className="relative bg-white w-full max-w-lg rounded-[40px] p-8 space-y-6">
              <h3 className="text-2xl font-black">Configure Hero</h3>
              <div className="space-y-4">
                 <input placeholder="Headline" className="w-full bg-gray-100 rounded-2xl py-4 px-6 font-bold" value={editingBanner.title} onChange={e => setEditingBanner({...editingBanner, title: e.target.value})} />
                 <div className="flex gap-4">
                    <input 
                      placeholder="Image URL" 
                      className="flex-1 bg-gray-100 rounded-2xl py-4 px-6 text-xs" 
                      value={editingBanner.imageUrl} 
                      onChange={e => setEditingBanner({...editingBanner, imageUrl: e.target.value})} 
                    />
                    <label className="flex flex-col items-center justify-center p-2 bg-gray-100 rounded-xl cursor-pointer hover:bg-gray-200 transition-all border-2 border-dashed border-gray-300">
                        <Upload size={16} className="text-gray-400" />
                        <input 
                           type="file" 
                           className="hidden" 
                           accept="image/*"
                           onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                 const reader = new FileReader();
                                 reader.onloadend = () => setEditingBanner({...editingBanner, imageUrl: reader.result as string});
                                 reader.readAsDataURL(file);
                              }
                           }}
                        />
                    </label>
                 </div>
              </div>
              <button onClick={saveBanner} className="w-full bg-black text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-sm">Update Interface</button>
           </div>
        </div>
      )}
    </div>
  );
}

function AdminCategories() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCat, setEditingCat] = useState<Partial<Category> | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const primaryColor = restaurant?.primaryColor || '#ea580c';

  useEffect(() => {
    if (!restaurantId) return;
    onSnapshot(doc(db, 'restaurants', restaurantId), (doc) => {
      setRestaurant({ id: doc.id, ...doc.data() } as Restaurant);
    });
    const q = query(collection(db, 'restaurants', restaurantId, 'categories'), orderBy('order', 'asc'));
    return onSnapshot(q, (snap) => setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category))));
  }, [restaurantId]);

  const saveCategory = async () => {
    if (!restaurantId || !editingCat?.name) return;
    try {
      if (editingCat.id) {
        const { id, ...data } = editingCat;
        await updateDoc(doc(db, 'restaurants', restaurantId, 'categories', id!), data);
      } else {
        await addDoc(collection(db, 'restaurants', restaurantId, 'categories'), {
          ...editingCat,
          order: categories.length
        });
      }
      setEditingCat(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `categories`);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-black text-2xl">Category Clusters</h3>
          <p className="text-gray-500 text-sm">Organize nodes into research clusters.</p>
        </div>
        <button 
          onClick={() => setEditingCat({ name: '', imageUrl: '' })}
          className="text-white p-4 rounded-2xl font-bold shadow-xl hover:scale-105 active:scale-95 transition-all text-sm leading-none"
          style={{ backgroundColor: primaryColor, boxShadow: `0 10px 15px -3px ${primaryColor}4D` }}
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white p-6 rounded-[40px] border border-gray-100 text-center space-y-4 group relative shadow-sm hover:shadow-xl transition-all">
             <div className="w-24 h-24 rounded-full bg-gray-50 mx-auto overflow-hidden border-2 border-gray-100">
               <img src={cat.imageUrl} className="w-full h-full object-cover" />
             </div>
             <p className="font-black text-sm uppercase tracking-tight">{cat.name}</p>
             <div className="flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditingCat(cat)} className="p-2 bg-gray-50 rounded-lg"><Settings size={12} /></button>
                <button onClick={() => deleteDoc(doc(db, 'restaurants', restaurantId!, 'categories', cat.id))} className="p-2 bg-red-50 text-red-500 rounded-lg"><Trash2 size={12} /></button>
             </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {editingCat && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingCat(null)} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="relative bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl space-y-6"
            >
              <h3 className="text-2xl font-black">Configure Cluster</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Cluster Name</label>
                  <input 
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold" 
                    value={editingCat.name} 
                    onChange={e => setEditingCat({...editingCat, name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Image URL / Paste Link (Square 500x500 recommended)</label>
                  <div className="flex gap-4">
                     <input 
                        className="flex-1 bg-gray-50 border-none rounded-2xl py-4 px-6 text-xs text-blue-600" 
                        value={editingCat.imageUrl} 
                        onChange={e => setEditingCat({...editingCat, imageUrl: e.target.value})} 
                        placeholder="Paste image URL here..."
                     />
                     <label className="flex flex-col items-center justify-center p-2 bg-gray-100 rounded-xl cursor-pointer hover:bg-gray-200 transition-all border-2 border-dashed border-gray-300">
                        <Upload size={16} className="text-gray-400" />
                        <input 
                           type="file" 
                           className="hidden" 
                           accept="image/*"
                           onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                 const reader = new FileReader();
                                 reader.onloadend = () => setEditingCat({...editingCat, imageUrl: reader.result as string});
                                 reader.readAsDataURL(file);
                              }
                           }}
                        />
                     </label>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setEditingCat(null)} className="flex-1 py-4 font-bold text-gray-400">Abort</button>
                <button onClick={saveCategory} className="flex-1 bg-black text-white rounded-2xl py-4 font-black">Lock In</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <div className="bg-white p-4 md:p-6 rounded-3xl space-y-2 md:space-y-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <p className="text-[9px] md:text-xs font-bold text-gray-400 uppercase tracking-widest truncate">{title}</p>
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-gray-50 flex items-center justify-center scale-90 md:scale-100">
          {icon}
        </div>
      </div>
      <p className="text-xl md:text-3xl font-black">{value}</p>
    </div>
  );
}

function OrderColumn({ title, orders, color, onAction, actionLabel, isHistory }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <div className={cn("w-2 h-2 rounded-full", color)} />
        <h4 className="font-bold text-sm text-gray-500">{title} ({orders.length})</h4>
      </div>
      <div className="space-y-4 h-[calc(100vh-400px)] overflow-y-auto hide-scrollbar pr-1">
        <AnimatePresence mode="popLayout">
          {orders.map((order: Order) => (
            <motion.div 
              key={order.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-black text-lg">Table {order.tableNumber}</h5>
                  <p className="text-[10px] text-gray-400 font-medium">Order #{order.id.slice(-4).toUpperCase()}</p>
                </div>
                {!isHistory && (
                  <button 
                    onClick={() => onAction(order.id)}
                    className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
                  >
                    {actionLabel}
                  </button>
                )}
              </div>
              
              <div className="space-y-2 py-3 border-y border-gray-50">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-500"><span className="font-bold text-black">{item.quantity}x</span> {item.name}</span>
                    <span className="font-bold">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              {order.notes && (
                <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100 flex gap-2">
                  <Bell size={14} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-yellow-800 font-medium leading-tight">Note: {order.notes}</p>
                </div>
              )}

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 flex items-center gap-1 font-medium italic">
                  <Clock size={12} /> {order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                </span>
                <span className="font-black text-sm">₹{order.totalAmount}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {orders.length === 0 && (
          <div className="h-32 flex flex-col items-center justify-center text-gray-300 border-2 border-dashed border-gray-200 rounded-3xl">
            <CheckCircle2 size={24} className="mb-2 opacity-50" />
            <p className="text-xs font-medium">All clear</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminMenu() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const primaryColor = restaurant?.primaryColor || '#ea580c';

  useEffect(() => {
    if (!restaurantId) return;
    onSnapshot(doc(db, 'restaurants', restaurantId), (doc) => {
      setRestaurant({ id: doc.id, ...doc.data() } as Restaurant);
    });
    const catQ = query(collection(db, 'restaurants', restaurantId, 'categories'), orderBy('order', 'asc'));
    const unsubCats = onSnapshot(catQ, (snap) => setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category))));
    
    const q = query(collection(db, 'restaurants', restaurantId, 'menu_items'), orderBy('name', 'asc'));
    const unsubItems = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `menu_items`));
    
    return () => { unsubCats(); unsubItems(); };
  }, [restaurantId]);

  const saveItem = async () => {
    if (!restaurantId || !editingItem?.name) return;
    try {
      if (editingItem.id) {
        const { id, ...data } = editingItem;
        await updateDoc(doc(db, 'restaurants', restaurantId, 'menu_items', id!), data);
      } else {
        await addDoc(collection(db, 'restaurants', restaurantId, 'menu_items'), editingItem);
      }
      setEditingItem(null);
    } catch (e) { 
      handleFirestoreError(e, OperationType.WRITE, `menu_items`);
    }
  };

  const deleteItem = async (id: string) => {
    if (confirm('Are you sure you want to delete this dish?')) {
      try {
        await deleteDoc(doc(db, 'restaurants', restaurantId!, 'menu_items', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `menu_items/${id}`);
      }
    }
  };

  const getFallbackImage = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('biryani')) return 'https://images.unsplash.com/photo-1563379091339-03b21bc4a6f8?auto=format&fit=crop&q=80&w=800';
    if (lowerName.includes('dal makhani')) return 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?auto=format&fit=crop&q=80&w=800';
    if (lowerName.includes('paneer')) return 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=800';
    return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-black text-2xl">Culinary Inventory</h3>
          <p className="text-gray-500 text-xs font-medium">Manage Dispatches & Flavor Nodes</p>
        </div>
        <button 
          onClick={() => setEditingItem({ name: '', price: 0, description: '', isVeg: true, isBestseller: false, categoryId: categories[0]?.id || '' })}
          className="text-white px-6 py-4 rounded-3xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-2xl transition-all active:scale-95"
          style={{ backgroundColor: primaryColor, boxShadow: `0 10px 25px -5px ${primaryColor}4D` }}
        >
          <Plus size={18} /> New Dish node
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Filter dispatch catalog..." 
          className="w-full bg-white border border-gray-100 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-orange-500 shadow-sm transition-all font-bold"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.filter(i => i.name.toLowerCase().includes(search.toLowerCase())).map(item => (
          <div key={item.id} className="bg-white rounded-[32px] overflow-hidden border border-gray-100 group shadow-sm hover:shadow-xl transition-all">
            <div className="aspect-square relative overflow-hidden bg-gray-50">
              <img src={item.imageUrl || getFallbackImage(item.name)} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              <div className="absolute top-4 left-4 flex gap-2">
                 {item.isVeg ? (
                   <span className="bg-green-500/90 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md">Veg</span>
                 ) : (
                   <span className="bg-red-500/90 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md">Non-Veg</span>
                 )}
              </div>
              <div className="absolute top-4 right-4 flex gap-2 translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                <button 
                   onClick={() => setEditingItem(item)}
                   className="p-2 bg-white text-black rounded-xl shadow-lg hover:scale-110 transition-transform"
                >
                   <Settings size={14} />
                </button>
                <button 
                   onClick={() => deleteItem(item.id)}
                   className="p-2 bg-red-500 text-white rounded-xl shadow-lg hover:scale-110 transition-transform"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                   <h4 className="font-black text-sm uppercase tracking-tight truncate leading-none">{item.name}</h4>
                   <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                      {categories.find(c => c.id === item.categoryId)?.name || 'Uncategorized'}
                   </p>
                </div>
                <p className="font-black text-sm">₹{item.price}</p>
              </div>
              <p className="text-[10px] text-gray-400 font-medium line-clamp-2 leading-relaxed">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0" onClick={() => setEditingItem(null)} />
             <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 40 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.9, opacity: 0, y: 40 }} 
                className="relative bg-white w-full max-w-4xl rounded-[48px] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] text-[#111111]"
             >
                <div className="md:w-5/12 bg-gray-50/50 p-8 flex flex-col gap-8 overflow-y-auto border-r border-gray-100">
                   <div className="space-y-1">
                      <h3 className="text-2xl font-black">Flavor Asset</h3>
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Image Matrix Integration</p>
                   </div>
                   
                   <div className="aspect-square rounded-[32px] overflow-hidden bg-white border border-gray-200 shadow-inner group relative">
                      <img src={editingItem.imageUrl || getFallbackImage(editingItem.name || '')} className="w-full h-full object-cover" />
                      <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-center p-6">
                         <Upload size={32} className="text-white mb-3" />
                         <span className="text-white text-[10px] font-black uppercase tracking-widest leading-tight">Neural Upload</span>
                       <div className="mt-4 space-y-1 bg-white p-2 rounded-xl border border-gray-100">
                          <label className="text-[8px] font-black uppercase text-gray-400 block px-2">Matrix URL</label>
                          <input 
                            placeholder="Paste link"
                            className="w-full bg-transparent border-none rounded-lg py-1 px-2 text-[11px] outline-none"
                            value={editingItem.imageUrl || ''}
                            onChange={e => setEditingItem({...editingItem, imageUrl: e.target.value})}
                          />
                       </div>
                         <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setEditingItem({...editingItem, imageUrl: reader.result as string});
                                reader.readAsDataURL(file);
                              }
                            }}
                         />
                      </label>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                        <button 
                           onClick={() => setEditingItem({...editingItem, isVeg: true})}
                           className={cn("py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2", editingItem.isVeg ? "bg-green-50 text-green-700 border-green-200" : "bg-white text-gray-300 border-gray-100")}
                        >Veg Mode</button>
                        <button 
                           onClick={() => setEditingItem({...editingItem, isVeg: false})}
                           className={cn("py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2", !editingItem.isVeg ? "bg-red-50 text-red-700 border-red-200" : "bg-white text-gray-300 border-gray-100")}
                        >Non-Veg</button>
                   </div>
                   <label className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 cursor-pointer shadow-sm">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Enable Bestseller Node</span>
                      <input 
                         type="checkbox" 
                         checked={editingItem.isBestseller} 
                         onChange={e => setEditingItem({...editingItem, isBestseller: e.target.checked})}
                         className="w-5 h-5 accent-orange-600 rounded" 
                      />
                   </label>
                </div>

                <div className="flex-1 p-8 md:p-12 space-y-10 overflow-y-auto">
                   <div className="space-y-6">
                      <div>
                         <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-3">Item Designation</label>
                         <input 
                            placeholder="e.g. Hyderabadi Dum Biryani"
                            className="w-full bg-gray-50 border border-gray-100 rounded-3xl py-4 px-6 font-black text-lg focus:ring-2 focus:ring-black outline-none transition-all" 
                            value={editingItem.name} 
                            onChange={e => setEditingItem({...editingItem, name: e.target.value})} 
                         />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                         <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-3">Credit Value (₹)</label>
                            <input 
                               type="number"
                               className="w-full bg-gray-50 border border-gray-100 rounded-3xl py-4 px-6 font-black focus:ring-2 focus:ring-black outline-none transition-all" 
                               value={editingItem.price} 
                               onChange={e => setEditingItem({...editingItem, price: Number(e.target.value)})} 
                            />
                         </div>
                         <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-3">Cluster ID</label>
                            <select 
                               className="w-full bg-gray-50 border border-gray-100 rounded-3xl py-4 px-6 font-bold text-sm h-[60px] focus:ring-2 focus:ring-black outline-none transition-all"
                               value={editingItem.categoryId}
                               onChange={e => setEditingItem({...editingItem, categoryId: e.target.value})}
                            >
                               <option value="">Select Cluster</option>
                               {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                         </div>
                      </div>
                      <div>
                         <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-3">Item Spec (Description)</label>
                         <textarea 
                            rows={3}
                            placeholder="Brief description of culinary profile..."
                            className="w-full bg-gray-50 border border-gray-100 rounded-3xl py-4 px-6 text-sm font-medium focus:ring-2 focus:ring-black outline-none transition-all" 
                            value={editingItem.description} 
                            onChange={e => setEditingItem({...editingItem, description: e.target.value})} 
                         />
                      </div>
                   </div>

                   <div className="flex gap-4 pt-6">
                      <button onClick={() => setEditingItem(null)} className="flex-1 py-5 font-black uppercase tracking-widest text-[10px] text-gray-400 hover:text-red-500 transition-colors">Abort Config</button>
                      <button 
                         onClick={saveItem} 
                         className="flex-[2] bg-black text-white rounded-[32px] py-5 font-black uppercase tracking-widest text-xs shadow-2xl active:scale-95 transition-all"
                      >
                         Execute Deployment
                      </button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminDashboard() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeColumn, setActiveColumn] = useState<'pending' | 'preparing' | 'completed'>('pending');
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const primaryColor = restaurant?.primaryColor || '#ea580c';

  useEffect(() => {
    if (!restaurantId) return;
    onSnapshot(doc(db, 'restaurants', restaurantId), (doc) => {
      setRestaurant({ id: doc.id, ...doc.data() } as Restaurant);
    });
    
    const q = query(collection(db, 'restaurants', restaurantId, 'orders'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `orders`));
  }, [restaurantId]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'restaurants', restaurantId!, 'orders', orderId), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Orders" value={orders.length.toString()} icon={<Utensils style={{ color: primaryColor }} size={16} />} />
        <StatCard title="Live" value={orders.filter(o => o.status !== OrderStatus.COMPLETED).length.toString()} icon={<Clock className="text-blue-600" size={16} />} />
        <StatCard title="Revenue" value={`₹${orders.reduce((acc, o) => acc + o.totalAmount, 0).toLocaleString()}`} icon={<TrendingUp className="text-green-600" size={16} />} />
        <StatCard title="Quality" value="4.8" icon={<Star className="text-yellow-600" size={16} />} />
      </div>

      {/* Live Orders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-xl text-[#111111]">Kitchen Dispatch</h3>
          <span className="hidden md:block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest">Real-time Sync</span>
        </div>

        {/* Mobile Column Tabs */}
        <div className="flex md:hidden bg-gray-100 p-1.5 rounded-2xl gap-2 mb-4">
           {['pending', 'preparing', 'completed'].map((col) => (
             <button 
              key={col}
              onClick={() => setActiveColumn(col as any)}
              className={cn(
                "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeColumn === col ? "bg-white text-black shadow-sm" : "text-gray-400"
              )}
             >
                {col}
             </button>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={cn(activeColumn !== 'pending' && "hidden md:block")}>
            <OrderColumn 
              title="Pending Approval" 
              orders={orders.filter(o => o.status === OrderStatus.PENDING)} 
              color="bg-orange-500"
              onAction={(id: string) => updateStatus(id, OrderStatus.PREPARING)}
              actionLabel="Cook"
            />
          </div>
          <div className={cn(activeColumn !== 'preparing' && "hidden md:block")}>
            <OrderColumn 
              title="Preparing" 
              orders={orders.filter(o => o.status === OrderStatus.PREPARING)} 
              color="bg-blue-500"
              onAction={(id: string) => updateStatus(id, OrderStatus.COMPLETED)}
              actionLabel="Serve"
            />
          </div>
          <div className={cn(activeColumn !== 'completed' && "hidden md:block")}>
            <OrderColumn 
              title="Completed" 
              orders={orders.filter(o => o.status === OrderStatus.COMPLETED)} 
              color="bg-green-500"
              isHistory
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Re-imports for Dashboard
