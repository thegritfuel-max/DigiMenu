import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, query, limit, getDocs, where } from 'firebase/firestore';
import { MenuItem, OperationType } from '../types';
import { handleFirestoreError } from '../lib/dbService';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Share2, Heart, Star, Clock, Flame, Info, Check, Plus, Minus, ChevronRight, X, Box, Maximize2 } from 'lucide-react';
import { cn } from '../lib/utils';

const playClick = () => {
  const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
  audio.volume = 0.2;
  audio.play().catch(() => {});
};

function DetailGallery({ images, name }: { images?: string[], name: string }) {
  const [index, setIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const displayImages = (images && images.length > 0) ? images : ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1000'];

  return (
    <>
      <div className="relative w-full h-full overflow-hidden">
        <div 
          className="flex h-full transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {displayImages.map((img, i) => (
            <img 
              key={i}
              src={img}
              alt={`${name} ${i}`}
              className="w-full h-full object-cover flex-shrink-0 cursor-pointer"
              onClick={() => setShowLightbox(true)}
            />
          ))}
        </div>
        
        {displayImages.length > 1 && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10">
            {displayImages.map((_, i) => (
              <button 
                key={i} 
                className={cn("w-1.5 h-1.5 rounded-full transition-all duration-300", i === index ? "bg-white w-4" : "bg-white/40")}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        )}

        {/* Navigation Arrows for Large Screens or Explicit Clicks */}
        {displayImages.length > 1 && (
          <>
            <button 
              onClick={() => setIndex(prev => Math.max(0, prev - 1))}
              disabled={index === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white disabled:opacity-0 transition-opacity"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => setIndex(prev => Math.min(displayImages.length - 1, prev + 1))}
              disabled={index === displayImages.length - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white disabled:opacity-0 transition-opacity"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      <AnimatePresence>
        {showLightbox && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#111] flex flex-col items-center justify-center p-4 bg-opacity-95"
          >
            <button 
              onClick={() => setShowLightbox(false)}
              className="absolute top-8 right-8 text-white w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all z-10"
            >
              <X size={24} />
            </button>
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative w-full max-w-lg aspect-[4/5] bg-black rounded-[32px] overflow-hidden shadow-2xl"
            >
               <img src={displayImages[index]} alt={name} className="w-full h-full object-contain" />
            </motion.div>

            <div className="mt-12 flex gap-4 overflow-x-auto p-4 w-full justify-center hide-scrollbar">
              {displayImages.map((img, i) => (
                <button 
                  key={i}
                  onClick={() => setIndex(i)}
                  className={cn(
                    "w-20 h-20 rounded-[20px] overflow-hidden transition-all flex-shrink-0 border-2",
                    i === index ? "border-[#FF6B00] scale-110 shadow-lg shadow-[#FF6B00]/20" : "border-transparent opacity-40 grayscale"
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            
            <p className="mt-6 text-gray-500 font-black uppercase text-[10px] tracking-widest leading-loose">
              Visualizing the Craft <br /> <span className="text-white">SCALORA RESEARCH LAB</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function ItemDetailPage() {
  const { restaurantId, itemId } = useParams<{ restaurantId: string; itemId: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<MenuItem | null>(null);
  const [recommendations, setRecommendations] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showAR, setShowAR] = useState(false);

  useEffect(() => {
    if (!restaurantId || !itemId) return;

    const fetchItemAndRecs = async () => {
      try {
        const itemDoc = await getDoc(doc(db, 'restaurants', restaurantId, 'menu_items', itemId));
        if (itemDoc.exists()) {
          const itemData = { id: itemDoc.id, ...itemDoc.data() } as MenuItem;
          setItem(itemData);

          // Fetch simple recommendations (other items in same category or just random items)
          const q = query(
            collection(db, 'restaurants', restaurantId, 'menu_items'),
            where('categoryId', '==', itemData.categoryId),
            limit(4)
          );
          const snap = await getDocs(q);
          setRecommendations(snap.docs.filter(d => d.id !== itemId).map(d => ({ id: d.id, ...d.data() } as MenuItem)));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `restaurants/${restaurantId}/menu_items/${itemId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchItemAndRecs();
  }, [restaurantId, itemId]);

  if (loading) return null;
  if (!item) return <div className="p-8 text-center text-black">Item not found</div>;

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Top Media Section */}
      <div className="relative h-[50vh] bg-gray-100 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-6">
          <button 
            onClick={() => { playClick(); navigate(-1); }}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-black shadow-lg border border-white/50"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex gap-3">
            <button onClick={playClick} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-black shadow-lg border border-white/50">
              <Share2 size={20} />
            </button>
            <button onClick={playClick} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-black shadow-lg border border-white/50">
              <Heart size={20} />
            </button>
          </div>
        </div>

        <DetailGallery images={item.images || (item.imageUrl ? [item.imageUrl] : [])} name={item.name} />
      </div>

      {/* Content Section */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative -mt-10 bg-white rounded-t-[40px] p-8 space-y-8 shadow-2xl"
      >
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className={cn(
                "w-4 h-4 rounded-sm border flex items-center justify-center p-0.5",
                item.isVeg ? "border-green-600" : "border-red-600"
              )}>
                <div className={cn(
                  "w-full h-full rounded-full",
                  item.isVeg ? "bg-green-600" : "bg-red-600"
                )} />
              </div>
              <h1 className="text-3xl font-black font-display text-[#111] leading-tight">{item.name}</h1>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-[#FF6B00] font-display">₹{item.price}</p>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">+ taxation</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 py-4 border-y border-gray-100">
            <div className="flex items-center gap-2">
              <Star size={18} className="fill-[#FF6B00] text-[#FF6B00]" />
              <span className="text-sm font-black">{item.rating || 4.5}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Clock size={18} />
              <span className="text-sm font-bold">15-20 min</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Flame size={18} className="text-[#FF6B00]" />
              <span className="text-sm font-bold">{item.calories || 240} cal</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-gray-600">
          <h3 className="font-black text-[#111] flex items-center gap-2 uppercase text-xs tracking-widest">
            The Recipe <Info size={14} className="text-gray-300" />
          </h3>
          <p className="text-[15px] leading-relaxed font-medium">{item.description}</p>
        </div>

        {item.ingredients && item.ingredients.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-black text-[#111] uppercase text-xs tracking-widest">Selected Ingredients</h3>
            <div className="flex flex-wrap gap-2">
              {item.ingredients.map((ing, i) => (
                <span key={i} className="px-4 py-2 bg-[#F8F8F8] border border-gray-100 rounded-[12px] text-[11px] font-bold text-[#111]">
                  {ing}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AR Entry Point */}
        <div className="pt-2">
          <button 
            onClick={() => {
              playClick();
              if (item.arModelUrl) {
                window.open(item.arModelUrl, '_blank');
              } else {
                setShowAR(true);
              }
            }}
            className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-[#FF6B00] to-[#FF8A00] text-white rounded-[32px] shadow-xl shadow-orange-500/20 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <Box size={24} className="animate-bounce" />
              </div>
              <div className="text-left">
                <h4 className="font-black text-sm uppercase tracking-widest leading-none mb-1">AR Visualize Food</h4>
                <p className="text-white/70 text-[10px] font-bold">
                  {item.arModelUrl ? "Launch Immersion Mode" : "System Generating Visualizer"}
                </p>
              </div>
            </div>
            <Maximize2 size={24} className="text-white/50 group-hover:text-white transition-colors relative z-10" />
          </button>
        </div>

        {/* Quantity and Add to Cart */}
        <div className="pt-4 flex items-center gap-4">
          <div className="flex items-center bg-[#F8F8F8] rounded-[20px] p-1.5 border border-gray-100 shadow-inner">
            <button 
              onClick={() => { playClick(); setQuantity(Math.max(1, quantity - 1)); }}
              className="w-12 h-12 flex items-center justify-center text-gray-400 transition-colors hover:text-[#111]"
            >
              <Minus size={20} />
            </button>
            <span className="w-8 text-center font-black text-lg">{quantity}</span>
            <button 
              onClick={() => { playClick(); setQuantity(quantity + 1); }}
              className="w-12 h-12 flex items-center justify-center text-[#FF6B00] transition-colors hover:text-[#111]"
            >
              <Plus size={20} />
            </button>
          </div>
          <button onClick={playClick} className="flex-1 bg-[#FF6B00] text-white h-14 rounded-[20px] font-black shadow-xl shadow-[#FF6B00]/20 active:scale-95 transition-all uppercase tracking-widest text-sm">
            Add to Order • ₹{item.price * quantity}
          </button>
        </div>

        {/* Dynamic Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-6 pt-6 pb-12">
            <h3 className="font-black text-lg font-display">Frequently Paired</h3>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-8 px-8">
              {recommendations.map((rec) => (
                <Link 
                  key={rec.id}
                  to={`/${restaurantId}/item/${rec.id}`}
                  className="min-w-[160px] space-y-3 p-3 bg-[#F8F8F8] rounded-[24px] border border-gray-100 shadow-sm transition-all hover:bg-white hover:shadow-lg group"
                >
                  <div className="aspect-square bg-gray-200 rounded-[16px] overflow-hidden">
                    <img src={rec.imageUrl} alt={rec.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black leading-tight line-clamp-1 text-[#111]">{rec.name}</h4>
                    <p className="text-sm font-black text-[#FF6B00] font-display">₹{rec.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* AR Modal Placeholder */}
      <AnimatePresence>
        {showAR && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col"
          >
            <div className="p-6 flex items-center justify-between relative z-10">
              <button onClick={() => setShowAR(false)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-md">
                <ChevronLeft />
              </button>
              <h3 className="text-white font-black uppercase tracking-[0.3em] text-xs">Neural AR Visualization</h3>
              <div className="w-10" />
            </div>
            
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
               <motion.div 
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 10, repeat: Infinity }}
                className="w-full aspect-square max-w-sm relative z-10"
               >
                 <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain filter drop-shadow-[0_35px_35px_rgba(255,107,0,0.3)]" />
               </motion.div>
               
               {/* Scanning Effect */}
               <motion.div 
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-0.5 bg-[#FF6B00] shadow-[0_0_15px_#FF6B00] z-20"
               />

               <div className="absolute inset-0 bg-[#FF6B00]/5 animate-pulse" />
            </div>

            <div className="p-8 space-y-6 bg-black">
              <div className="space-y-2 text-center text-white">
                <h4 className="text-2xl font-black font-display tracking-tight">System Ready</h4>
                <p className="text-gray-400 text-sm font-medium">Point your camera at a flat surface to project the {item.name}.</p>
              </div>
              <button className="w-full py-5 bg-white text-black rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl shadow-white/10 active:scale-95 transition-all">
                Enable Camera Access
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
