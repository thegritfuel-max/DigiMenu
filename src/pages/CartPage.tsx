import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Table, Tag, CheckCircle2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { OperationType, OrderStatus, Offer } from '../types';
import { handleFirestoreError } from '../lib/dbService';
import { useCart } from '../context/CartContext';

export function CartPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    subtotal, 
    discountAmount, 
    total, 
    appliedOffer, 
    applyOffer,
    clearCart 
  } = useCart();

  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [showOfferSplash, setShowOfferSplash] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !restaurantId) return;
    
    setCouponError('');
    try {
      const q = query(
        collection(db, 'restaurants', restaurantId, 'offers'), 
        where('discountCode', '==', couponCode.toUpperCase())
      );
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setCouponError('Invalid neural key');
        return;
      }

      const offer = { id: snap.docs[0].id, ...snap.docs[0].data() } as Offer;
      applyOffer(offer);
      setShowOfferSplash(true);
      setTimeout(() => setShowOfferSplash(false), 3000);
    } catch (error) {
      console.error(error);
      setCouponError('Signal interrupted');
    }
  };

  const handlePlaceOrder = async () => {
    if (!tableNumber) {
      alert('Please select your designated table');
      return;
    }

    setIsOrdering(true);
    try {
      if (!restaurantId) return;
      const orderData = {
        tableNumber,
        items: cartItems.map(i => ({ itemId: i.id, name: i.name, quantity: i.quantity, price: i.price })),
        totalAmount: total,
        status: OrderStatus.PENDING,
        createdAt: serverTimestamp(),
        notes,
        discountApplied: appliedOffer ? {
          code: appliedOffer.discountCode,
          amount: discountAmount
        } : null
      };

      await addDoc(collection(db, 'restaurants', restaurantId, 'orders'), orderData);
      setOrderComplete(true);
      clearCart();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `restaurants/${restaurantId}/orders`);
    } finally {
      setIsOrdering(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center space-y-8">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-32 h-32 bg-green-50 text-green-500 rounded-full flex items-center justify-center"
        >
          <CheckCircle2 size={64} />
        </motion.div>
        <div className="space-y-2">
          <h1 className="text-4xl font-black uppercase tracking-tighter">Order Logged</h1>
          <p className="text-gray-500 font-medium">Your request has been prioritized in the kitchen queue.</p>
        </div>
        <Link to={`/${restaurantId}`} className="bg-black text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2">
          Return to Menu <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-24 h-24 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center">
          <ShoppingBag size={48} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black uppercase tracking-tighter">Empty Manifest</h1>
          <p className="text-gray-400 text-sm">No items detected in your selection protocols.</p>
        </div>
        <Link to={`/${restaurantId}`} className="text-orange-600 font-bold">Deploy Selection</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <AnimatePresence>
        {showOfferSplash && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-orange-600 p-6 text-center"
          >
            <motion.div 
              initial={{ scale: 0.5, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="text-white space-y-6"
            >
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                <Tag size={48} />
              </div>
              <div className="space-y-2">
                <h2 className="text-5xl font-black uppercase tracking-tighter italic">Discount Applied!</h2>
                <p className="text-orange-200 font-black uppercase tracking-widest text-sm">— Neural override successful —</p>
              </div>
              <p className="text-2xl font-bold">You saved ₹{discountAmount}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white p-6 flex items-center justify-between sticky top-0 z-50 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-black uppercase tracking-tight">Order manifest</h1>
        </div>
        <button onClick={clearCart} className="text-[10px] font-black uppercase tracking-widest text-red-500">Purge Cart</button>
      </div>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-3xl mx-auto w-full">
        {/* Table Selection */}
        <div className="bg-white p-6 md:p-8 rounded-[32px] space-y-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <Table size={20} />
             </div>
             <h3 className="font-black uppercase tracking-tight text-lg">Seating Node</h3>
          </div>
          <div className="grid grid-cols-5 gap-3 p-1.5 bg-gray-50 rounded-2xl overflow-x-auto">
            {['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10'].map((t) => (
              <button 
                key={t}
                onClick={() => setTableNumber(t)}
                className={cn(
                  "py-3 rounded-xl font-black text-xs transition-all min-w-[50px]",
                  tableNumber === t ? "bg-white text-orange-600 shadow-sm ring-1 ring-black/5" : "text-gray-400"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Cart Items */}
        <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 divide-y divide-gray-50">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
             <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Selection Stack</h2>
             <span className="text-[10px] font-bold text-gray-400">{cartItems.length} items</span>
          </div>
          <AnimatePresence>
            {cartItems.map((item) => (
              <motion.div 
                key={item.id}
                layout
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-5 p-6 hover:bg-gray-50/50 transition-colors"
              >
                <div className="relative">
                  <img src={item.imageUrl} className="w-16 h-16 rounded-2xl object-cover shadow-sm bg-gray-100" />
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center text-red-500 border border-gray-100 hover:bg-red-50"
                  >
                    <X size={12} />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-sm truncate uppercase tracking-tight">{item.name}</h4>
                  <p className="text-orange-600 font-black text-xs">₹{item.price}</p>
                </div>
                <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                  <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black">
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center text-xs font-black">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-orange-600 hover:scale-110">
                    <Plus size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Coupon Logic */}
        <div className="bg-white p-6 md:p-8 rounded-[32px] space-y-4 shadow-sm border border-gray-100">
           <div className="flex items-center justify-between mb-2">
              <label className="font-black uppercase tracking-widest text-[10px] text-gray-400">Discount Authorization</label>
              {appliedOffer && (
                <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase">Active: {appliedOffer.discountCode}</span>
              )}
           </div>
           <div className="flex gap-3">
              <div className="relative flex-1">
                 <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                 <input 
                  type="text" 
                  placeholder="ENTER ACCESS CODE" 
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className={cn(
                    "w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-6 text-xs font-black tracking-widest outline-none focus:ring-2 transition-all",
                    appliedOffer ? "focus:ring-green-500 bg-green-50 text-green-700" : "focus:ring-orange-600"
                  )}
                 />
              </div>
              <button 
                onClick={handleApplyCoupon}
                className="bg-black text-white px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-colors"
              >
                Apply
              </button>
           </div>
           {couponError && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest ml-2">{couponError}</p>}
        </div>

        {/* Notes */}
        <div className="bg-white p-6 md:p-8 rounded-[32px] space-y-4 shadow-sm border border-gray-100">
           <label className="font-black uppercase tracking-widest text-[10px] text-gray-400">Special Protocols</label>
           <textarea 
            placeholder="E.g. No allergies, medium heat..." 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-2xl p-6 outline-none focus:ring-2 focus:ring-orange-600 resize-none h-24 text-sm font-medium"
           />
        </div>

        {/* Price Breakdown */}
        <div className="bg-white p-8 rounded-[32px] space-y-4 shadow-sm border border-gray-100 mb-12">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400 font-bold uppercase tracking-widest">Base Value</span>
            <span className="font-black">₹{subtotal}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between items-center text-xs text-green-600">
              <span className="font-bold uppercase tracking-widest">Override Discount ({appliedOffer?.discountPercentage}%)</span>
              <span className="font-black">-₹{discountAmount}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400 font-bold uppercase tracking-widest">System Taxes (5%)</span>
            <span className="font-black">₹{Math.round(total * 0.05)}</span>
          </div>
          <div className="flex justify-between pt-5 border-t border-gray-50">
            <div>
               <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1">Final Settlement</p>
               <span className="text-3xl font-black uppercase tracking-tighter text-black">₹{total + Math.round(total * 0.05)}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Bar */}
      <div className="bg-white/80 backdrop-blur-xl p-6 md:p-8 border-t border-gray-100 flex flex-col md:flex-row gap-6 sticky bottom-0 z-50">
        <div className="flex-1 flex items-center justify-between md:justify-start gap-8">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Method</p>
            <p className="font-black text-xs text-black">Pay at Counter</p>
          </div>
          <div className="h-8 w-px bg-gray-100 hidden md:block" />
          <div className="space-y-1 text-right md:text-left">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Dishes</p>
            <p className="font-black text-xs text-black">{cartItems.length} in stack</p>
          </div>
        </div>
        <button 
          onClick={handlePlaceOrder}
          disabled={isOrdering || cartItems.length === 0}
          className="md:w-64 bg-orange-600 text-white py-5 rounded-3xl font-black shadow-xl shadow-orange-600/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
        >
          {isOrdering ? 'Deploying...' : 'Launch Order'}
          {!isOrdering && <ArrowRight size={18} />}
        </button>
      </div>
    </div>
  );
}
