import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Table } from 'lucide-react';
import { cn } from '../lib/utils';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { OperationType, OrderStatus } from '../types';
import { handleFirestoreError } from '../lib/dbService';

// Mock cart for demo (usually would use a context or redux)
const CART_ITEMS = [
  { itemId: '1', name: 'Truffle Mushroom Burger', price: 499, quantity: 1, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400' },
  { itemId: '2', name: 'Fresh Fruit Bowl', price: 149, quantity: 2, imageUrl: 'https://images.unsplash.com/photo-1540189567006-5959de14691f?w=400' },
];

export function CartPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const [items, setItems] = useState(CART_ITEMS);
  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const taxes = Math.round(subtotal * 0.05);
  const total = subtotal + taxes;

  const handlePlaceOrder = async () => {
    if (!tableNumber) {
      alert('Please enter your table number');
      return;
    }

    setIsOrdering(true);
    try {
      if (!restaurantId) return;
      const orderData = {
        tableNumber,
        items: items.map(i => ({ itemId: i.itemId, name: i.name, quantity: i.quantity, price: i.price })),
        totalAmount: total,
        status: OrderStatus.PENDING,
        createdAt: serverTimestamp(),
        notes,
      };

      await addDoc(collection(db, 'restaurants', restaurantId, 'orders'), orderData);
      setOrderComplete(true);
      setItems([]);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `restaurants/${restaurantId}/orders`);
    } finally {
      setIsOrdering(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-bounce">
          <ShoppingBag size={48} />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black">Order Placed!</h1>
          <p className="text-gray-500">Your order has been sent to the kitchen. Please relax while we prepare your meal.</p>
        </div>
        <div className="bg-gray-50 p-6 rounded-3xl w-full max-w-sm space-y-4">
          <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Next Step</p>
          <div className="space-y-2">
            <h3 className="font-bold">Loved the experience?</h3>
            <p className="text-sm text-gray-500">Help others by sharing your feedback on Google.</p>
            <button className="w-full bg-orange-600 text-white py-3 rounded-2xl font-bold shadow-lg shadow-orange-100">
              Post Review on Google
            </button>
          </div>
        </div>
        <Link to={`/${restaurantId}`} className="text-orange-600 font-bold flex items-center gap-2">
          Back to Menu <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
      {/* Header */}
      <div className="glass-morphism p-6 flex items-center gap-4 sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 text-[#111]">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-black font-display text-[#111]">Your Order</h1>
      </div>

      <main className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Table Selection */}
        <div className="bg-white p-8 rounded-[32px] space-y-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 text-[#FF6B00]">
            <Table size={24} />
            <h3 className="font-black font-display text-lg">Confirm Seating</h3>
          </div>
          <div className="flex bg-[#F8F8F8] rounded-[24px] p-2 border border-gray-100">
            {['T1', 'T2', 'T3', 'T4', 'T5'].map((t) => (
              <button 
                key={t}
                onClick={() => setTableNumber(t)}
                className={cn(
                  "flex-1 py-4 rounded-[18px] font-black transition-all text-sm",
                  tableNumber === t ? "bg-white text-[#FF6B00] shadow-sm scale-105" : "text-gray-400"
                )}
              >
                {t}
              </button>
            ))}
          </div>
          {!tableNumber && (
            <input 
              type="text" 
              placeholder="Or enter Table Number manually" 
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-full bg-[#F8F8F8] border border-gray-100 rounded-[20px] py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-[#FF6B00] transition-all font-bold"
            />
          )}
        </div>

        {/* Cart Items */}
        <div className="space-y-4">
          <h2 className="text-lg font-black font-display px-2 uppercase tracking-widest text-gray-400 text-[10px]">Order Summary</h2>
          <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div 
                  key={item.itemId}
                  exit={{ opacity: 0, x: -100 }}
                  className="flex items-center gap-5 p-5 border-b border-gray-50 last:border-0"
                >
                  <img src={item.imageUrl} className="w-20 h-20 rounded-[20px] object-cover shadow-sm" />
                  <div className="flex-1 space-y-1">
                    <h4 className="font-black text-[#111] leading-tight font-display text-sm">{item.name}</h4>
                    <p className="text-[#FF6B00] font-black font-display">₹{item.price}</p>
                  </div>
                  <div className="flex items-center bg-[#F8F8F8] rounded-[16px] p-1 border border-gray-100">
                    <button className="w-10 h-10 flex items-center justify-center text-gray-400">
                      <Minus size={18} />
                    </button>
                    <span className="w-8 text-center text-sm font-black text-[#111]">{item.quantity}</span>
                    <button className="w-10 h-10 flex items-center justify-center text-[#FF6B00]">
                      <Plus size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white p-8 rounded-[32px] space-y-4 shadow-sm text-sm border border-gray-100">
           <label className="font-black text-[#111] uppercase tracking-widest text-[10px]">Special Instructions</label>
           <textarea 
            placeholder="E.g. No onion, make it extra spicy..." 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-[#F8F8F8] border border-gray-100 rounded-[24px] p-6 outline-none focus:ring-2 focus:ring-[#FF6B00] resize-none h-28 font-medium placeholder:text-gray-300"
           />
        </div>

        {/* Price Breakdown */}
        <div className="bg-white p-8 rounded-[32px] space-y-4 shadow-sm border border-gray-100 mb-12">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
            <span className="font-black text-[#111]">₹{subtotal}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Taxes & Fees</span>
            <span className="font-black text-[#111]">₹{taxes}</span>
          </div>
          <div className="flex justify-between pt-5 border-t border-gray-100">
            <span className="text-xl font-black font-display text-[#111]">Grand Total</span>
            <span className="text-2xl font-black font-display text-[#FF6B00]">₹{total}</span>
          </div>
        </div>
      </main>

      {/* Bottom Bar */}
      <div className="bg-white/90 backdrop-blur-xl p-8 border-t border-gray-100 space-y-6 shadow-[0_-20px_40px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Method</p>
            <p className="font-black flex items-center gap-2 text-[#111]">Pay at Counter <ChevronLeft size={16} className="-rotate-90 text-[#FF6B00]" /></p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Dishes</p>
            <p className="font-black text-[#111]">{items.length} Selected</p>
          </div>
        </div>
        <button 
          onClick={handlePlaceOrder}
          disabled={isOrdering || items.length === 0}
          className="w-full bg-[#FF6B00] text-white py-5 rounded-[24px] font-black shadow-2xl shadow-[#FF6B00]/30 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
        >
          {isOrdering ? 'Deploying to Kitchen...' : 'Launch Order'}
          {!isOrdering && <ArrowRight size={20} />}
        </button>
      </div>
    </div>
  );
}
