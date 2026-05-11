import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Restaurant, Category, MenuItem, Banner, OperationType, Offer } from '../types';
import { handleFirestoreError } from '../lib/dbService';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ShoppingCart, User, ChevronRight, Star, Clock, Info, Flame, ChevronLeft, Settings, Tag, Home, CheckCircle2, LogIn, Lock } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

import { GoogleGenAI } from "@google/genai";
import { Copy, Facebook, Instagram, Youtube, Linkedin, MessageCircle, ExternalLink } from 'lucide-react';

// Lazy initialize Gemini (will only work if key is provided)
let genAIInstance: GoogleGenAI | null = null;
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. Using fallback reviews.");
    return null;
  }
  if (!genAIInstance) {
    genAIInstance = new GoogleGenAI({ apiKey });
  }
  return genAIInstance;
}

import { reviewFallbacks } from '../lib/reviewFallbacks';

function ReviewSection({ restaurant, primaryColor }: { restaurant: Restaurant, primaryColor: string }) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateReview = async (stars: number) => {
    setRating(stars);
    setGenerating(true);
    
    // Artificial delay for "Neural Synthesis" feel
    await new Promise(resolve => setTimeout(resolve, 800));

    const samples = reviewFallbacks[stars as keyof typeof reviewFallbacks] || reviewFallbacks[5];
    const baseReview = samples[Math.floor(Math.random() * samples.length)];
    
    // Add minor personalization
    const emojis = stars >= 4 ? ["✨", "🔥", "👌", "⭐", "😋"] : stars === 3 ? ["🤔", "⚖️", "😐"] : ["👎", "😒", "😟"];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    const finalReview = baseReview.replace(restaurant.name, restaurant.name) + (Math.random() > 0.5 ? ` ${randomEmoji}` : "");

    setReview(finalReview);
    setGenerating(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(review);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-[40px] p-8 space-y-6 border border-gray-100 shadow-sm">
      <div className="space-y-1">
        <h3 className="font-black text-xl tracking-tight">Rate our Dispatch</h3>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest leading-none">AI-Assisted Feedback Matrix</p>
      </div>

      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => { playClick(); generateReview(star); }}
            className={cn(
              "p-2 rounded-2xl transition-all active:scale-90",
              rating >= star ? "" : "text-gray-200"
            )}
            style={{ color: rating >= star ? primaryColor : undefined }}
          >
            <Star size={32} fill={rating >= star ? "currentColor" : "none"} strokeWidth={2.5} />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {rating > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden"
          >
            <div className="bg-gray-50 rounded-3xl p-6 relative border border-gray-100 group">
              {generating ? (
                <div className="flex items-center gap-3 py-2">
                   <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" />
                   <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                   <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Neural Synthesis...</span>
                </div>
              ) : (
                <>
                  <p className="text-xs font-medium leading-relaxed italic text-gray-600">"{review}"</p>
                  <button 
                    onClick={copyToClipboard}
                    className="absolute top-4 right-4 p-2 bg-white rounded-xl shadow-sm text-gray-400 hover:text-black transition-colors"
                  >
                    {copied ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-[9px] font-black uppercase text-gray-400 text-center tracking-widest">Copy and deploy to Google Network</p>
              <a 
                href={restaurant.googleReviewLink || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full bg-[#111111] text-white py-4 rounded-3xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all"
              >
                <div className="bg-white p-1 rounded-full">
                  <svg width="12" height="12" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                </div>
                Support on Google
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RestaurantFooter({ restaurant, primaryColor }: { restaurant: Restaurant, primaryColor: string }) {
  return (
    <div className="pb-32 pt-16 px-4 space-y-10 text-center">
      <div className="space-y-4">
        <h2 className="text-2xl font-black font-display uppercase tracking-tight">Connect with {restaurant.name}</h2>
        <div className="flex justify-center gap-4">
          {restaurant.socialLinks?.instagram && (
            <a href={restaurant.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-all text-[#E4405F]">
              <Instagram size={24} />
            </a>
          )}
          {restaurant.socialLinks?.facebook && (
            <a href={restaurant.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-all text-[#1877F2]">
              <Facebook size={24} />
            </a>
          )}
          {restaurant.socialLinks?.youtube && (
            <a href={restaurant.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-all text-[#FF0000]">
              <Youtube size={24} />
            </a>
          )}
          {restaurant.socialLinks?.linkedin && (
            <a href={restaurant.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-all text-[#0A66C2]">
              <Linkedin size={24} />
            </a>
          )}
          {restaurant.socialLinks?.whatsapp && (
            <a href={`https://wa.me/${restaurant.socialLinks.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-all text-[#25D366]">
              <MessageCircle size={24} />
            </a>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest italic opacity-50">Thank you for Choosing Culinary Excellence at</p>
        <h1 className="text-xl font-black uppercase tracking-tighter" style={{ color: primaryColor }}>{restaurant.name}</h1>
      </div>

      <div className="pt-4 flex flex-col items-center gap-1 opacity-20 group hover:opacity-100 transition-opacity">
         <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-400">Powered by Antigravity Protocol</p>
         <div className="w-12 h-[1px] bg-gray-200" />
      </div>
    </div>
  );
}
const translations = {
  en: {
    search: "Search for dishes, cafes...",
    categories: "Categories",
    seeAll: "See all",
    popular: "Popular",
    trending: "Trending Now",
    artisanal: "Artisanal Selections",
    live: "Live Inventory",
    add: "ADD",
    home: "Home",
    offers: "Offers",
    cart: "Cart",
    profile: "Profile",
    decentralized: "Decentralized Kitchen Lab",
    specialRewards: "Exclusive Node Rewards",
    rewardSubtitle: "Hyper-personalized offers for your current session.",
    apply: "Apply Node",
    trendingTag: "Hot 🔥"
  },
  mr: {
    search: "पदार्थ, कॅफे शोधा...",
    categories: "श्रेणी",
    seeAll: "सर्व पहा",
    popular: "लोकप्रिय",
    trending: "सध्या ट्रेंडिंग",
    artisanal: "विशेष निवड",
    live: "थेट साठा",
    add: "जोडा",
    home: "मुख्य",
    offers: "ऑफर्स",
    cart: "कार्ट",
    profile: "प्रोफाइल",
    decentralized: "विकेंद्रित किचन लॅब",
    specialRewards: "विशेष बक्षिसे",
    rewardSubtitle: "तुमच्या सध्याच्या सत्रासाठी विशेष ऑफर.",
    apply: "कोड वापरा",
    trendingTag: "गरम 🔥"
  }
};

const playClick = () => {
  const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
  audio.volume = 0.2;
  audio.play().catch(() => {}); // Ignore silent errors
};

function SplashScreen({ restaurant }: { restaurant: Restaurant }) {
  useEffect(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-white flex flex-col items-center justify-center p-8 space-y-8"
    >
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="w-32 h-32 rounded-[40px] bg-white shadow-2xl flex items-center justify-center overflow-hidden border border-gray-100"
      >
        <img src={restaurant.logoUrl || "https://api.dicebear.com/7.x/initials/svg?seed=" + restaurant.name} className="w-20 h-20 object-contain" />
      </motion.div>
      <div className="text-center space-y-2">
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-black font-display tracking-tight uppercase"
        >
          {restaurant.name}
        </motion.h1>
        <motion.p 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.4em]"
        >
          Initializing Interface...
        </motion.p>
      </div>
      <div className="absolute bottom-12 flex gap-2">
        <div className="w-2 h-2 rounded-full bg-black/10 animate-bounce" style={{ animationDelay: '0s' }} />
        <div className="w-2 h-2 rounded-full bg-black/10 animate-bounce" style={{ animationDelay: '0.2s' }} />
        <div className="w-2 h-2 rounded-full bg-black/10 animate-bounce" style={{ animationDelay: '0.4s' }} />
      </div>
    </motion.div>
  );
}

function FoodCardGallery({ images, name, restaurantId, itemId }: { images?: string[], name: string, restaurantId: string, itemId: string }) {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const [error, setError] = useState(false);
  const displayImages = (images && images.length > 0 && !error) 
    ? images 
    : ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800'];

  if (displayImages.length <= 1) {
    return (
      <Link to={`/${restaurantId}/item/${itemId}`} className="block w-full h-full">
        <img 
          src={displayImages[0]} 
          alt={name} 
          className="w-full h-full object-cover" 
          onError={() => setError(true)}
        />
      </Link>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden group">
      <div 
        className="flex h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {displayImages.map((img, i) => (
          <img 
            key={i}
            src={img}
            alt={`${name} ${i}`}
            className="w-full h-full object-cover flex-shrink-0 cursor-pointer"
            onClick={() => navigate(`/${restaurantId}/item/${itemId}`)}
            onError={() => setError(true)}
          />
        ))}
      </div>
      
      {/* Controls */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); setIndex(prev => Math.max(0, prev - 1)); }}
          className="w-5 h-5 rounded-full bg-white/90 flex items-center justify-center text-black shadow-lg"
        >
          <ChevronLeft size={12} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); setIndex(prev => Math.min(displayImages.length - 1, prev + 1)); }}
          className="w-5 h-5 rounded-full bg-white/90 flex items-center justify-center text-black shadow-lg"
        >
          <ChevronRight size={12} />
        </button>
      </div>

      {/* Dots */}
      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 px-1.5 py-0.5 rounded-full bg-black/20 backdrop-blur-md">
        {displayImages.map((_, i) => (
          <div key={i} className={cn("w-1 h-1 rounded-full transition-all", i === index ? "bg-white w-2" : "bg-white/40")} />
        ))}
      </div>
    </div>
  );
}

function AddToCartButton({ item, addToCart, primaryColor, t }: { item: MenuItem, addToCart: (item: MenuItem) => void, primaryColor: string, t: any }) {
  const [added, setAdded] = useState(false);
  
  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playClick();
    addToCart(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <button 
      onClick={handleAdd}
      className={cn(
        "px-6 py-2.5 rounded-2xl text-xs font-black shadow-xl active:scale-95 transition-all flex items-center justify-center min-w-[80px]",
        added ? "bg-green-500" : "text-white"
      )}
      style={{ 
        backgroundColor: added ? undefined : primaryColor, 
        boxShadow: added ? `0 8px 15px -4px rgba(34, 197, 94, 0.4)` : `0 8px 20px -4px ${primaryColor}66` 
      }}
    >
      {added ? <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}><CheckCircle2 size={16} /></motion.div> : t.add}
    </button>
  );
}

export function MenuPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const { addToCart, cartItems, isLoaded } = useCart();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [language, setLanguage] = useState<'en' | 'mr'>('en');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'menu' | 'profile' | 'offers' | 'cart'>('menu');
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!restaurantId) return;

    const resRef = doc(db, 'restaurants', restaurantId);
    const unsubRes = onSnapshot(resRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as Restaurant;
        setRestaurant({ id: doc.id, ...data } as Restaurant);
        if (data.language) setLanguage(data.language);
        localStorage.setItem('last_restaurant_id', restaurantId);
      }
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, `restaurants/${restaurantId}`));

    const catRef = collection(db, 'restaurants', restaurantId, 'categories');
    const qCat = query(catRef, orderBy('order', 'asc'));
    const unsubCat = onSnapshot(qCat, (snapshot) => {
      setCategories(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `categories`));

    const itemRef = collection(db, 'restaurants', restaurantId, 'menu_items');
    const unsubItems = onSnapshot(itemRef, (snapshot) => {
      setMenuItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `menu_items`));

    const bannerRef = collection(db, 'restaurants', restaurantId, 'banners');
    const qBanner = query(bannerRef, orderBy('order', 'asc'));
    const unsubBanners = onSnapshot(qBanner, (snapshot) => {
      setBanners(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Banner)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `banners`));

    const offerRef = collection(db, 'restaurants', restaurantId, 'offers');
    const qOffer = query(offerRef, orderBy('order', 'asc'));
    const unsubOffers = onSnapshot(qOffer, (snapshot) => {
      setOffers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Offer)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `offers`));

    // Splash timeout
    const timer = setTimeout(() => setShowSplash(false), 2500);

    return () => {
      unsubRes();
      unsubCat();
      unsubItems();
      unsubBanners();
      unsubOffers();
      clearTimeout(timer);
    };
  }, [restaurantId]);

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.categoryId === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      playClick();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
    }
  };

  const primaryColor = restaurant?.primaryColor || '#FF6B00';
  const t = translations[language];

  const userIsAdmin = user && restaurant && (
    (!restaurant.adminEmails || (restaurant.adminEmails as any).length === 0) || 
    (user.email && restaurant.adminEmails?.includes(user.email))
  );

  if (loading || !isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-gray-100 rounded-full" />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="absolute inset-0 border-4 border-[#FF6B00] border-t-transparent rounded-full"
          />
        </div>
        <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing Nodes...</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Restaurant Not Found</h1>
        <p className="text-gray-500 mb-6">The restaurant you are looking for doesn't exist.</p>
        <Link to="/" className="px-6 py-3 bg-orange-600 text-white rounded-full font-medium">
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-24 select-none">
      <AnimatePresence>
        {showSplash && <SplashScreen restaurant={restaurant} />}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-50 glass-morphism px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white overflow-hidden border border-gray-100 shadow-sm">
            {restaurant.logoUrl ? (
              <img src={restaurant.logoUrl} alt={restaurant.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-[#FF6B00]">
                {restaurant.name.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-sm font-black leading-tight font-display tracking-tight uppercase max-w-[150px] truncate">
              {restaurant.name}
            </h1>
            <p className="text-[8px] text-gray-400 flex items-center gap-1 font-black uppercase tracking-[0.2em]">
              {t.decentralized}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { playClick(); setLanguage(language === 'en' ? 'mr' : 'en'); }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-[#111111] shadow-sm border border-gray-100 font-bold text-xs"
          >
            {language === 'en' ? 'मरा' : 'EN'}
          </button>
          <Link 
            to={`/${restaurantId}/cart`} 
            onClick={playClick} 
            className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white text-[#111111] shadow-sm border border-gray-100"
          >
            <ShoppingCart size={20} />
            {cartItems.length > 0 && (
              <span 
                className="absolute -top-1 -right-1 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-in zoom-in"
                style={{ backgroundColor: primaryColor }}
              >
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 space-y-6">
        {activeTab === 'menu' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Search Bar & Suggestions */}
            <div className="relative z-50">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder={t.search} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => playClick()}
                  className="w-full bg-white border border-gray-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:ring-2 shadow-sm transition-all outline-none text-[#111111]"
                  style={{ borderColor: `${primaryColor}33` }}
                />
              </div>

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {searchQuery.length > 1 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-[100]"
                  >
                    <div className="p-2 max-h-[320px] overflow-y-auto hide-scrollbar">
                      <p className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400">Predicted Selections</p>
                      {menuItems
                        .filter(item => 
                          item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .slice(0, 6)
                        .map(item => (
                          <div 
                            key={item.id}
                            onClick={() => {
                              playClick();
                              setSearchQuery('');
                              navigate(`/${restaurantId}/item/${item.id}`);
                            }}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-2xl cursor-pointer transition-colors group"
                          >
                            <img src={item.imageUrl} className="w-10 h-10 rounded-xl object-cover" />
                            <div className="flex-1">
                              <h4 className="font-bold text-sm group-hover:text-[#FF6B00] transition-colors">{item.name}</h4>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">₹{item.price}</p>
                            </div>
                            <ChevronRight size={14} className="text-gray-300" />
                          </div>
                        ))
                      }
                      {menuItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                        <div className="p-8 text-center space-y-2">
                           <Search className="mx-auto text-gray-200" size={32} />
                           <p className="text-xs font-bold text-gray-400">No nodes found matching your query.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Zomato Style Offers - Curved Rectangular */}
            {offers.length > 0 && activeCategory === 'all' && !searchQuery && (
              <div className="space-y-4">
                 <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 hide-scrollbar snap-x">
                   {offers.map((offer) => (
                      <motion.div 
                        key={offer.id}
                        className="min-w-[280px] aspect-[16/7] rounded-[32px] overflow-hidden bg-white shadow-xl relative snap-center border border-gray-100"
                        whileTap={{ scale: 0.98 }}
                        onClick={playClick}
                      >
                         <img src={offer.imageUrl} className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent p-6 flex flex-col justify-center">
                            <h3 className="text-white font-black text-xl leading-none mb-1">{offer.title}</h3>
                            <p className="text-xs font-black tracking-widest uppercase" style={{ color: primaryColor }}>{offer.discountCode}</p>
                         </div>
                      </motion.div>
                   ))}
                 </div>
              </div>
            )}

            {/* Banners - Auto Sliding */}
            {banners.length > 0 && (
              <div className="relative overflow-hidden -mx-4">
                <motion.div 
                  className="flex gap-4 px-4"
                  animate={{
                    x: [0, -100 * banners.length + "%"],
                  }}
                  transition={{
                    duration: 20 * banners.length,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  {[...banners, ...banners].map((banner, index) => (
                    <div 
                      key={`${banner.id}-${index}`}
                      className="relative min-w-[85vw] aspect-[16/9] rounded-[24px] overflow-hidden bg-gray-200 shadow-md"
                    >
                      <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end">
                        <h3 className="text-white font-bold text-xl font-display">{banner.title}</h3>
                        <p className="text-white/80 text-sm">{banner.subtitle}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>
            )}

            {/* Categories */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-display">{t.categories}</h2>
                <button onClick={playClick} className="text-[#FF6B00] text-sm font-bold flex items-center">
                  {t.seeAll} <ChevronRight size={16} />
                </button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 hide-scrollbar">
                <button 
                  onClick={() => { playClick(); setActiveCategory('all'); }}
                  className={cn(
                    "flex flex-col items-center gap-2 min-w-[72px] transition-all",
                    activeCategory === 'all' ? "scale-105" : "opacity-60"
                  )}
                >
                  <div className={cn(
                    "w-14 h-14 rounded-[20px] flex items-center justify-center bg-white transition-colors border border-gray-100 shadow-sm",
                    activeCategory === 'all' && "bg-[#111111] text-white shadow-lg"
                  )}>
                    <Flame size={24} />
                  </div>
                  <span className="text-[11px] font-bold">{t.popular}</span>
                </button>
                {categories.map((cat) => (
                  <button 
                    key={cat.id}
                    onClick={() => { playClick(); setActiveCategory(cat.id); }}
                    className={cn(
                      "flex flex-col items-center gap-2 min-w-[72px] transition-all",
                      activeCategory === cat.id ? "scale-105" : "opacity-60"
                    )}
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-[20px] overflow-hidden bg-white transition-all shadow-sm border border-gray-100",
                      activeCategory === cat.id && "ring-2 ring-[#FF6B00] ring-offset-2"
                    )}>
                      <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[11px] font-bold">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Trending Section */}
            {menuItems.some(i => i.isTrending) && activeCategory === 'all' && !searchQuery && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold font-display">{t.trending}</h2>
                  <div 
                    className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                    style={{ backgroundColor: `${primaryColor}1A`, color: primaryColor }}
                  >
                    {t.trendingTag}
                  </div>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 hide-scrollbar snap-x">
                  {menuItems.filter(i => i.isTrending).map((item) => (
                    <motion.div 
                      key={item.id}
                      className="min-w-[200px] bg-white rounded-[28px] overflow-hidden shadow-xl border border-gray-100 snap-center"
                      whileTap={{ scale: 0.95 }}
                      onClick={playClick}
                    >
                      <Link to={`/${restaurantId}/item/${item.id}`}>
                        <div className="aspect-square relative">
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-4 space-y-1">
                          <h4 className="font-bold text-sm truncate">{item.name}</h4>
                          <p className="font-black text-xs" style={{ color: primaryColor }}>₹{item.price}</p>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Menu Items */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-display tracking-tight text-[#111]">{t.artisanal}</h2>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#FF6B00]">{t.live}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredItems.map((item) => (
                    <motion.div 
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ y: -4, scale: 1.01, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
                      className="bg-white rounded-[24px] p-4 flex gap-4 transition-all border border-gray-100 shadow-sm overflow-hidden"
                      onClick={playClick}
                    >
                      <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-[24px] overflow-hidden flex-shrink-0 bg-gray-100 shadow-inner">
                        <FoodCardGallery 
                          images={item.images || (item.imageUrl ? [item.imageUrl] : [])} 
                          name={item.name} 
                          restaurantId={restaurantId!} 
                          itemId={item.id} 
                        />
                        {item.isBestseller && (
                          <div 
                            className="absolute top-2 left-2 text-white text-[7px] md:text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-lg"
                            style={{ backgroundColor: '#FF2A00' }}
                          >
                            BESTSELLER
                          </div>
                        )}
                      </div>
                         <div className="flex-1 flex flex-col justify-between py-1">
                          <Link to={`/${restaurantId}/item/${item.id}`} className="block">
                            <div>
                              <div className="flex items-start gap-2 mb-1">
                                <div className={cn(
                                  "w-3 h-3 rounded-sm border flex items-center justify-center p-0.5 mt-1",
                                  item.isVeg ? "border-green-600" : "border-red-600"
                                )}>
                                  <div className={cn(
                                    "w-full h-full rounded-full",
                                    item.isVeg ? "bg-green-600" : "bg-red-600"
                                  )} />
                                </div>
                                <h3 className="font-black text-sm md:text-base leading-tight font-display text-gray-900 line-clamp-2">{item.name}</h3>
                              </div>
                              <p className="text-[10px] md:text-[11px] text-gray-500 line-clamp-2 mb-2 leading-tight font-medium opacity-80">{item.description}</p>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] text-gray-600 font-black flex items-center gap-1">
                                  <Star size={12} className="fill-current text-red-500" /> {item.rating || 5}
                                </span>
                                <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                                  <Clock size={12} /> 15-20 min
                                </span>
                              </div>
                            </div>
                          </Link>
                          <div className="flex items-center justify-between mt-3">
                            <span className="font-black text-lg text-[#111] font-display">₹{item.price}</span>
                            <AddToCartButton item={item} addToCart={addToCart} primaryColor={primaryColor} t={t} />
                          </div>
                        </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
            {/* Intelligent Review Section */}
            {(activeTab === 'menu' || activeTab === 'offers') && (
              <div className="pt-12 px-4">
                <ReviewSection restaurant={restaurant} primaryColor={primaryColor} />
              </div>
            )}
            
            <RestaurantFooter restaurant={restaurant} primaryColor={primaryColor} />
          </div>
        )}

        {/* Offers Tab */}
        {activeTab === 'offers' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <header className="space-y-2">
              <h1 className="text-3xl font-black font-display text-[#111]">{t.offers}</h1>
              <p className="text-gray-500 font-medium">Active rewards and promotional nodes.</p>
            </header>

            <div className="grid gap-6">
              {offers.map((offer) => (
                <motion.div 
                  key={offer.id}
                  className="aspect-[16/8] rounded-[32px] overflow-hidden bg-white shadow-xl relative border border-gray-100"
                  whileTap={{ scale: 0.98 }}
                  onClick={playClick}
                >
                   <img src={offer.imageUrl} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent p-8 flex flex-col justify-center">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black tracking-[0.3em] text-white/50 uppercase">Exclusive Node</span>
                        <h3 className="text-white font-black text-2xl font-display leading-tight">{offer.title}</h3>
                        <p className="text-white/70 text-xs font-medium max-w-[200px] line-clamp-2">{offer.description}</p>
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                          <code className="text-white font-black tracking-widest text-[10px]">{offer.discountCode}</code>
                        </div>
                        <button className="px-4 py-2 bg-white text-black rounded-xl font-black text-[9px] uppercase tracking-widest">
                          {t.apply}
                        </button>
                      </div>
                   </div>
                </motion.div>
              ))}
              {offers.length === 0 && (
                <div className="p-12 text-center bg-white rounded-[40px] border border-gray-100 shadow-sm space-y-4">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200">
                    <Tag size={32} />
                  </div>
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">No active nodes in your sector.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <header className="space-y-2">
              <h1 className="text-3xl font-black font-display text-[#111]">Laboratory</h1>
              <p className="text-gray-500 font-medium">System configuration and neural controls.</p>
            </header>

            <div className="space-y-4">
              {!user ? (
                <button 
                  onClick={handleLogin}
                  className="w-full flex items-center justify-between p-8 bg-white border-2 border-dashed border-gray-200 rounded-[40px] group hover:border-[#111] transition-all"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-[#111] group-hover:text-white transition-all">
                      <LogIn size={24} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-black text-xl text-gray-400 group-hover:text-[#111] transition-colors">Admin Login</h3>
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Sign in with Google Account</p>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-200 group-hover:text-[#111] transition-colors" />
                </button>
              ) : (
                <div className="space-y-6">
                  {userIsAdmin ? (
                    <Link 
                      to="/admin" 
                      className="flex items-center justify-between p-6 bg-[#111] text-white rounded-[32px] shadow-2xl group hover:scale-[1.02] transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                          <Settings style={{ color: primaryColor }} />
                        </div>
                        <div>
                          <h3 className="font-black text-lg text-white">Admin Dashboard</h3>
                          <p className="text-[#00FF44] text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle2 size={10} /> Authorized Clearance
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="text-gray-500 group-hover:text-white transition-colors" />
                    </Link>
                  ) : (
                    <div className="p-8 bg-red-50 border border-red-100 rounded-[40px] space-y-4">
                       <div className="flex items-center gap-4 text-red-600">
                          <Lock size={24} />
                          <div>
                            <h3 className="font-black text-lg">Access Prohibited</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Email Restricted</p>
                          </div>
                       </div>
                       <p className="text-xs font-medium text-red-500 leading-relaxed">
                          Your account does not have admin clearance. Request authorization for your email address from an existing administrator.
                       </p>
                       <div className="space-y-2">
                         <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-red-100">
                            <code className="flex-1 text-[10px] font-mono font-bold text-gray-500 break-all">{user.email}</code>
                            <button 
                              onClick={() => { navigator.clipboard.writeText(user.email || ''); alert('Email Copied'); }}
                              className="bg-red-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase"
                            >Copy Email</button>
                         </div>
                       </div>
                    </div>
                  )}

                  <div className="p-8 bg-white border border-gray-100 rounded-[40px] space-y-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                       <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} className="w-12 h-12 rounded-full border-2 border-gray-100" />
                       <div>
                          <h4 className="font-black text-[#111]">{user.displayName || 'Researcher'}</h4>
                          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{user.email}</p>
                       </div>
                    </div>

                    <h3 className="font-black text-xs uppercase tracking-[0.2em] text-gray-400">Environment Controls</h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-800">Hyper-Speed Browsing</span>
                        <div className="w-12 h-6 rounded-full relative" style={{ backgroundColor: primaryColor }}>
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-800">Neural Recommendations</span>
                        <div className="w-12 h-6 rounded-full relative" style={{ backgroundColor: primaryColor }}>
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-800">AR Food Visualization</span>
                        <div className="w-12 h-6 bg-gray-200 rounded-full relative">
                          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => { playClick(); auth.signOut(); }}
                    className="w-full p-6 text-red-500 font-black uppercase tracking-widest text-xs hover:bg-red-50 rounded-[28px] transition-colors flex items-center justify-center gap-3 border border-red-50"
                  >
                    Terminate Session
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Nav */}
      <footer className="fixed bottom-6 left-6 right-6 z-50">
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 text-[#111] rounded-full p-2 flex items-center justify-around shadow-2xl shadow-black/5">
          <button 
            onClick={() => { playClick(); setActiveTab('menu'); }}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-full transition-all duration-300",
              activeTab === 'menu' ? "bg-[#111] text-white" : "text-gray-400"
            )}
          >
            <Home size={18} />
            <span className="text-[9px] font-black uppercase">{t.home}</span>
          </button>
          <button 
            onClick={() => { playClick(); setActiveTab('offers'); }}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-full transition-all duration-300",
              activeTab === 'offers' ? "bg-[#111] text-white" : "text-gray-400"
            )}
          >
            <Info size={18} />
            <span className="text-[9px] font-black uppercase">{t.offers}</span>
          </button>
          <button 
            onClick={() => { playClick(); navigate(`/${restaurantId}/cart`); }}
            className="flex flex-col items-center gap-1 px-4 py-2 text-gray-400 relative"
          >
            <ShoppingCart size={18} />
            <span className="text-[9px] font-black uppercase">{t.cart}</span>
            {cartItems.length > 0 && (
              <span className="absolute top-1 right-3 w-4 h-4 bg-orange-600 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
              </span>
            )}
          </button>
          <button 
            onClick={() => { playClick(); setActiveTab('profile'); }}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-full transition-all duration-300",
              activeTab === 'profile' ? "bg-[#111] text-white" : "text-gray-400"
            )}
          >
            <User size={18} />
            <span className="text-[9px] font-black uppercase">{t.profile}</span>
          </button>
        </div>
      </footer>

      {/* CSS for hiding scrollbar */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
