import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { Restaurant, OperationType } from '../types';
import { handleFirestoreError } from '../lib/dbService';
import { motion } from 'motion/react';
import { UtensilsCrossed, ArrowRight, Zap, QrCode, TrendingUp } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'restaurants'));
        setRestaurants(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Restaurant)));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'restaurants');
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  const createDemoRestaurant = async () => {
    try {
      let user = auth.currentUser;
      if (!user) {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        user = result.user;
      }

      const demoData = {
        name: 'The Royal Indian Lab',
        primaryColor: '#FF6B00',
        logoUrl: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=200&auto=format&fit=crop',
        adminUids: [user.uid], 
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, 'restaurants'), demoData);
      
      // Add Indian categories
      const catRef = collection(db, 'restaurants', docRef.id, 'categories');
      const appetId = (await addDoc(catRef, { name: 'Appetizers', imageUrl: 'https://images.unsplash.com/photo-1601050638917-3f044037d53b?w=400', order: 1 })).id;
      const mainId = (await addDoc(catRef, { name: 'Main Course', imageUrl: 'https://images.unsplash.com/photo-1517244681291-4d9d5ddad26a?w=400', order: 2 })).id;
      const dessertId = (await addDoc(catRef, { name: 'Desserts', imageUrl: 'https://images.unsplash.com/photo-1589113103503-4908ef90f91a?w=400', order: 3 })).id;
      
      // Add Indian menu items
      const itemRef = collection(db, 'restaurants', docRef.id, 'menu_items');
      const indianItems = [
        {
          name: 'Paneer Tikka Angare',
          description: 'Cottage cheese cubes marinated in fiery spices and grilled to perfection in clay oven.',
          price: 349,
          imageUrl: 'https://images.unsplash.com/photo-1567188040759-fbba1883dbde?w=800',
          images: [
            'https://images.unsplash.com/photo-1567188040759-fbba1883dbde?w=800',
            'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800',
            'https://images.unsplash.com/photo-1626132646549-95233159dc74?w=800'
          ],
          categoryId: appetId,
          isVeg: true,
          isBestseller: true,
          isTrending: true,
          rating: 4.9,
          calories: 320,
          ingredients: ['Paneer', 'Bell Peppers', 'Secret Tikka Masala']
        },
        {
          name: 'Butter Chicken Artisanal',
          description: 'Velvety tomato gravy with tender grilled chicken chunks and fresh cream.',
          price: 499,
          imageUrl: 'https://images.unsplash.com/photo-1603894584202-9ca82439f05d?w=800',
          images: [
            'https://images.unsplash.com/photo-1603894584202-9ca82439f05d?w=800',
            'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800',
            'https://images.unsplash.com/photo-1610192244261-3f130797b805?w=800'
          ],
          categoryId: mainId,
          isVeg: false,
          isBestseller: true,
          isTrending: true,
          rating: 5.0,
          calories: 580,
          ingredients: ['Chicken', 'Butter', 'Fresh Cream', 'Tomato Puree']
        },
        {
          name: 'Hyderabadi Dum Biryani',
          description: 'Long-grain basmati rice cooked with succulent meat, saffron, and aromatic spices on slow fire.',
          price: 549,
          imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800',
          images: [
            'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800',
            'https://images.unsplash.com/photo-1631515223360-5d92d765ee13?w=800'
          ],
          categoryId: mainId,
          isVeg: false,
          isBestseller: true,
          rating: 5.0,
          calories: 720,
          ingredients: ['Basmati Rice', 'Goat Meat', 'Saffron', 'Whole Spices']
        },
        {
          name: 'Dal Makhani Velvet',
          description: 'Slow-cooked black lentils with cream and butter, simmered for 24 hours.',
          price: 389,
          imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800',
          images: [
            'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800',
            'https://images.unsplash.com/photo-1626777552726-4a6b547d4eb5?w=800'
          ],
          categoryId: mainId,
          isVeg: true,
          isBestseller: false,
          rating: 4.8,
          calories: 420,
          ingredients: ['Black Lentils', 'Butter', 'Cream', 'Ginger-Garlic']
        },
        {
          name: 'Gulab Jamun Saffron',
          description: 'Deep-fried milk solids dumplings soaked in cardamom and saffron infused sugar syrup.',
          price: 199,
          imageUrl: 'https://images.unsplash.com/photo-1589113103503-4908ef90f91a?w=800',
          images: [
            'https://images.unsplash.com/photo-1589113103503-4908ef90f91a?w=800'
          ],
          categoryId: dessertId,
          isVeg: true,
          isBestseller: true,
          rating: 4.9,
          calories: 450,
          ingredients: ['Khoya', 'Saffron', 'Cardamom', 'Rose Water']
        }
      ];
      for (const item of indianItems) {
        await addDoc(itemRef, item);
      }

      navigate(`/${docRef.id}`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#111] overflow-hidden relative">
      {/* Abstract Background Shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#FF6B00]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#FFB347]/10 rounded-full blur-[120px]" />
      
      {/* Hero */}
      <div className="relative pt-24 pb-32 px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 space-y-10 max-w-lg mx-auto text-center"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border border-gray-100">
            <Zap size={14} className="text-[#FF6B00]" /> Future of Post-Kitchen Dining
          </div>
          
          <div className="space-y-4">
            <h1 className="text-6xl font-black leading-[0.95] tracking-tighter font-display">
              SCALORA<span className="text-[#FF6B00]">.</span><br />
              <span className="text-gray-300">LABS</span>
            </h1>
            <p className="text-gray-500 text-lg font-medium max-w-xs mx-auto">
              Premium digital menus with autonomous AR visualization.
            </p>
          </div>
          
          <div className="flex flex-col gap-5 pt-8">
            <button 
              onClick={createDemoRestaurant}
              className="bg-[#FF6B00] text-white px-10 py-5 rounded-[32px] font-black text-lg flex items-center justify-center gap-4 shadow-2xl shadow-[#FF6B00]/40 active:scale-[0.98] transition-all uppercase tracking-widest text-sm"
            >
              Enter The Experience <ArrowRight size={20} />
            </button>
            <p className="text-center text-[10px] text-gray-400 font-black uppercase tracking-widest">Autonomous Setup • Free Forever</p>
          </div>
        </motion.div>
      </div>

      {/* Features Grid */}
      <div className="px-8 py-24 glass-morphism border-y border-white/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
          {[
            { icon: <QrCode />, title: 'Smart Node', desc: 'Instant 1-tap ordering nodes.' },
            { icon: <TrendingUp />, title: 'Neural Upsell', desc: 'AI suggests pairings based on sensory data.' },
            { icon: <UtensilsCrossed />, title: 'Spatial Menu', desc: 'Visualize 3D assets on your plate.' },
          ].map((f, i) => (
            <motion.div 
              key={i}
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 30 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="space-y-6 text-center md:text-left"
            >
              <div className="w-16 h-16 bg-white text-[#FF6B00] rounded-[24px] flex items-center justify-center shadow-xl border border-gray-50">
                {f.icon}
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black font-display">{f.title}</h3>
                <p className="text-gray-500 font-medium text-sm leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Existing Restaurants */}
      <div className="px-8 py-24 max-w-4xl mx-auto">
        <h2 className="text-xl font-black font-display mb-10 text-center uppercase tracking-widest text-gray-400 text-xs">Partner Establishments</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {restaurants.map((res) => (
            <Link key={res.id} to={`/${res.id}`} className="group relative bg-white border border-gray-100 p-6 rounded-[32px] flex items-center gap-6 hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="w-20 h-20 rounded-[20px] bg-[#F8F8F8] overflow-hidden flex-shrink-0">
                <img src={res.logoUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-black text-lg group-hover:text-[#FF6B00] transition-colors font-display leading-tight">{res.name}</h3>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Active Lab</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#F8F8F8] flex items-center justify-center text-gray-300 group-hover:bg-[#FF6B00] group-hover:text-white transition-all">
                <ChevronRight size={20} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <footer className="py-12 text-center">
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em]">Integrated Intelligence by Scalora</p>
      </footer>
    </div>
  );
}

// Re-using Link from router
import { Link } from 'react-router-dom';
import { ChevronRight as ChevronRightIcon } from 'lucide-react';
function ChevronRight(props: any) { return <ChevronRightIcon {...props} /> }
