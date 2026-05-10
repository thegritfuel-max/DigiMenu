import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { Restaurant, Category, MenuItem, Banner, OperationType } from '../types';
import { handleFirestoreError } from '../lib/dbService';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ShoppingCart, User, ChevronRight, Star, Clock, Info, Flame, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

function ReviewPrompt({ googleLink }: { googleLink: string }) {
  const [rating, setRating] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleReview = (val: number) => {
    setRating(val);
    if (val >= 4) {
      window.open(googleLink, '_blank');
    }
    setSubmitted(true);
  };

  return (
    <div className="mx-4 p-8 bg-[#111] rounded-[32px] text-white space-y-6 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6B00]/20 rounded-full blur-[40px] -mr-16 -mt-16 transition-transform group-hover:scale-150" />
      <div className="relative z-10">
        {!submitted ? (
          <div className="space-y-6">
            <h3 className="text-2xl font-black font-display tracking-tight leading-tight">Rate your Experience</h3>
            <p className="text-gray-400 text-sm font-medium">Help us perfect our culinary research.</p>
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-[24px]">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star} 
                  onClick={() => handleReview(star)}
                  className="p-2 transition-all hover:scale-125"
                >
                  <Star 
                    size={32} 
                    className={cn(
                      "transition-all",
                      rating && rating >= star ? "fill-[#FF6B00] text-[#FF6B00]" : "text-gray-600"
                    )} 
                  />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <h3 className="text-2xl font-black font-display tracking-tight leading-tight">
              {rating! >= 4 ? "Redirecting to Google..." : "Thank you for the data."}
            </h3>
            <p className="text-gray-400 text-sm font-medium">
              {rating! >= 4 
                ? "Your positive review helps our decentralized kitchen grow." 
                : "Our systems will analyze your feedback for manual recalibration."}
            </p>
            <button 
              onClick={() => setSubmitted(false)}
              className="mt-4 text-[10px] uppercase font-black tracking-widest text-[#FF6B00] hover:underline"
            >
              Update Rating
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function FoodCardGallery({ images, name, restaurantId, itemId }: { images?: string[], name: string, restaurantId: string, itemId: string }) {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const displayImages = (images && images.length > 0) ? images : ['https://via.placeholder.com/400'];

  if (displayImages.length <= 1) {
    return (
      <Link to={`/${restaurantId}/item/${itemId}`} className="block w-full h-full">
        <img src={displayImages[0]} alt={name} className="w-full h-full object-cover" />
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

export function MenuPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!restaurantId) return;

    const resRef = doc(db, 'restaurants', restaurantId);
    const unsubRes = onSnapshot(resRef, (doc) => {
      if (doc.exists()) {
        setRestaurant({ id: doc.id, ...doc.data() } as Restaurant);
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

    return () => {
      unsubRes();
      unsubCat();
      unsubItems();
      unsubBanners();
    };
  }, [restaurantId]);

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.categoryId === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"
        />
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
              Decentralized Kitchen Lab
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/${restaurantId}/cart`} className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white text-[#111111] shadow-sm border border-gray-100">
            <ShoppingCart size={20} />
            <span className="absolute -top-1 -right-1 bg-[#FF6B00] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">2</span>
          </Link>
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-[#111111] shadow-sm border border-gray-100">
            <User size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search for dishes, cafes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#FF6B00] shadow-sm transition-all outline-none text-[#111111]"
          />
        </div>

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
            <h2 className="text-xl font-bold font-display">Categories</h2>
            <button className="text-[#FF6B00] text-sm font-bold flex items-center">
              See all <ChevronRight size={16} />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 hide-scrollbar">
            <button 
              onClick={() => setActiveCategory('all')}
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
              <span className="text-[11px] font-bold">Popular</span>
            </button>
            {categories.map((cat) => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
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
              <h2 className="text-xl font-bold font-display">Trending Now</h2>
              <div className="bg-[#FF6B00]/10 text-[#FF6B00] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Hot 🔥</div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 hide-scrollbar snap-x">
              {menuItems.filter(i => i.isTrending).map((item) => (
                <motion.div 
                  key={item.id}
                  className="min-w-[200px] bg-white rounded-[28px] overflow-hidden shadow-xl border border-gray-100 snap-center"
                  whileTap={{ scale: 0.95 }}
                >
                  <Link to={`/${restaurantId}/item/${item.id}`}>
                    <div className="aspect-square relative">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4 space-y-1">
                      <h4 className="font-bold text-sm truncate">{item.name}</h4>
                      <p className="text-[#FF6B00] font-black text-xs">₹{item.price}</p>
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
            <h2 className="text-xl font-bold font-display tracking-tight text-[#111]">Artisanal Selections</h2>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest text-[#FF6B00]">Live Inventory</span>
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
                >
                  <div className="relative w-28 h-28 rounded-[16px] overflow-hidden flex-shrink-0 bg-gray-100">
                    <FoodCardGallery 
                      images={item.images || (item.imageUrl ? [item.imageUrl] : [])} 
                      name={item.name} 
                      restaurantId={restaurantId!} 
                      itemId={item.id} 
                    />
                    {item.isBestseller && (
                      <div className="absolute top-2 left-2 bg-[#FF6B00] text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest">
                        Bestseller
                      </div>
                    )}
                  </div>
                  <Link to={`/${restaurantId}/item/${item.id}`} className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className={cn(
                          "w-3 h-3 rounded-sm border flex items-center justify-center p-0.5",
                          item.isVeg ? "border-green-600" : "border-red-600"
                        )}>
                          <div className={cn(
                            "w-full h-full rounded-full",
                            item.isVeg ? "bg-green-600" : "bg-red-600"
                          )} />
                        </div>
                        <h3 className="font-bold text-base leading-tight font-display">{item.name}</h3>
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-2 mb-2 leading-relaxed">{item.description}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                          <Star size={12} className="fill-[#FF6B00] text-[#FF6B00]" /> {item.rating || 4.5}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                          <Clock size={12} /> 15-20 min
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-black text-lg text-[#111] font-display">₹{item.price}</span>
                      <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); /* handle add to cart */ }}
                        className="bg-[#FF6B00] text-white px-5 py-2 rounded-[12px] text-xs font-black shadow-lg shadow-[#FF6B00]/20 active:scale-95 transition-all"
                      >
                        ADD
                      </button>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        {/* Intelligent Review Section */}
        {restaurant.googleReviewLink && (
          <ReviewPrompt googleLink={restaurant.googleReviewLink} />
        )}
      </main>

      {/* Floating Bottom Nav */}
      <footer className="fixed bottom-6 left-6 right-6 z-50">
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 text-[#111] rounded-full p-2 flex items-center justify-around shadow-2xl shadow-black/5">
          <Link to={`/${restaurantId}`} className="flex flex-col items-center gap-1 px-4 py-2 bg-[#111] text-white rounded-full">
            <Search size={18} />
            <span className="text-[9px] font-black uppercase">Home</span>
          </Link>
          <Link to={`/${restaurantId}`} className="flex flex-col items-center gap-1 px-4 py-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <Info size={18} />
            <span className="text-[9px] font-black uppercase">Offers</span>
          </Link>
          <Link to={`/${restaurantId}/cart`} className="flex flex-col items-center gap-1 px-4 py-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <ShoppingCart size={18} />
            <span className="text-[9px] font-black uppercase">Cart</span>
          </Link>
          <Link to={`/${restaurantId}`} className="flex flex-col items-center gap-1 px-4 py-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <User size={18} />
            <span className="text-[9px] font-black uppercase">Profile</span>
          </Link>
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
