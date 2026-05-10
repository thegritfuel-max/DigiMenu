import { useState, useEffect } from 'react';
import { useParams, Routes, Route, Link, useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, addDoc, orderBy } from 'firebase/firestore';
import { Restaurant, Category, MenuItem, Order, OrderStatus, OperationType } from '../types';
import { handleFirestoreError } from '../lib/dbService';
import { LayoutDashboard, Utensils, ListFilter, Image as ImageIcon, Settings, Bell, Clock, CheckCircle2, ChevronRight, Plus, Search, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function AdminPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-black text-white flex flex-col p-6 space-y-8 hidden md:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-bold">S</div>
          <h1 className="text-lg font-black tracking-tighter">SCALORA ADMIN</h1>
        </div>
        
        <nav className="flex-1 space-y-1">
          <SidebarItem to="" icon={<LayoutDashboard size={20} />} label="Dashboard" exact />
          <SidebarItem to="/menu" icon={<Utensils size={20} />} label="Menu Items" />
          <SidebarItem to="/categories" icon={<ListFilter size={20} />} label="Categories" />
          <SidebarItem to="/banners" icon={<ImageIcon size={20} />} label="Offer Banners" />
          <SidebarItem to="/settings" icon={<Settings size={20} />} label="Settings" />
        </nav>

        <div className="bg-white/5 rounded-2xl p-4 space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Restaurant Profile</p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-600" />
            <div className="truncate">
              <p className="text-sm font-bold truncate">Premium Kitchen</p>
              <p className="text-[10px] text-gray-500">Live • 4.9 Rating</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between flex-shrink-0">
          <h2 className="font-bold text-lg">Admin Dashboard</h2>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-orange-600 rounded-full" />
            </button>
            <div className="h-8 w-px bg-gray-200" />
            <div className="flex items-center gap-3">
              <p className="text-sm font-bold text-gray-700">Admin User</p>
              <div className="w-8 h-8 rounded-full bg-gray-200" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="menu" element={<AdminMenu />} />
            <Route path="*" element={<div className="flex items-center justify-center h-full text-gray-400">Section Under Construction</div>} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ to, icon, label, exact }: { to: string, icon: any, label: string, exact?: boolean }) {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const location = useLocation();
  const fullPath = `/${restaurantId}/admin${to}`;
  const isActive = exact ? location.pathname === fullPath : location.pathname.startsWith(fullPath);

  return (
    <Link 
      to={fullPath}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
        isActive ? "bg-orange-600 text-white shadow-lg shadow-orange-950/20" : "text-gray-400 hover:bg-white/5 hover:text-white"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

function AdminDashboard() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!restaurantId) return;
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
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Orders" value={orders.length.toString()} icon={<Utensils className="text-orange-600" />} />
        <StatCard title="Live" value={orders.filter(o => o.status !== OrderStatus.COMPLETED).length.toString()} icon={<Clock className="text-blue-600" />} />
        <StatCard title="Revenue" value="₹24,500" icon={<TrendingUp className="text-green-600" />} />
        <StatCard title="Rating" value="4.8" icon={<Star className="text-yellow-600" />} />
      </div>

      {/* Live Orders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-xl">Live Kitchen View</h3>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">Auto Refresh On</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <OrderColumn 
            title="Pending Approval" 
            orders={orders.filter(o => o.status === OrderStatus.PENDING)} 
            color="bg-orange-500"
            onAction={(id) => updateStatus(id, OrderStatus.PREPARING)}
            actionLabel="Start Cooking"
          />
          <OrderColumn 
            title="Preparing" 
            orders={orders.filter(o => o.status === OrderStatus.PREPARING)} 
            color="bg-blue-500"
            onAction={(id) => updateStatus(id, OrderStatus.COMPLETED)}
            actionLabel="Mark as served"
          />
          <OrderColumn 
            title="Served / History" 
            orders={orders.filter(o => o.status === OrderStatus.COMPLETED)} 
            color="bg-green-500"
            isHistory
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl space-y-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</p>
        <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-black">{value}</p>
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
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!restaurantId) return;
    const q = query(collection(db, 'restaurants', restaurantId, 'menu_items'), orderBy('name', 'asc'));
    return onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `menu_items`));
  }, [restaurantId]);

  const deleteItem = async (id: string) => {
    if (confirm('Are you sure you want to delete this dish?')) {
      await deleteDoc(doc(db, 'restaurants', restaurantId!, 'menu_items', id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-2xl">Menu Catalog</h3>
        <button className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-orange-100 transition-all hover:scale-105 active:scale-95 leading-none">
          <Plus size={20} /> Add New Dish
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search by name or category..." 
          className="w-full bg-white border border-gray-100 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-orange-500 shadow-sm transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.filter(i => i.name.toLowerCase().includes(search.toLowerCase())).map(item => (
          <div key={item.id} className="bg-white rounded-[32px] overflow-hidden border border-gray-100 group shadow-sm hover:shadow-xl transition-all">
            <div className="aspect-square relative overflow-hidden bg-gray-50">
              <img src={item.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              <div className="absolute top-4 right-4 flex gap-2 translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                <button 
                   onClick={() => deleteItem(item.id)}
                   className="p-2 bg-red-500 text-white rounded-xl shadow-lg hover:bg-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-2">
              <div className="flex justify-between items-start">
                <h4 className="font-bold leading-tight">{item.name}</h4>
                <div className={cn(
                  "w-3 h-3 rounded-sm border flex items-center justify-center p-0.5 mt-1",
                  item.isVeg ? "border-green-600" : "border-red-600"
                )}>
                  <div className={cn("w-full h-full rounded-full", item.isVeg ? "bg-green-600" : "bg-red-600")} />
                </div>
              </div>
              <p className="text-xs text-gray-400 line-clamp-2">{item.description}</p>
              <div className="flex items-center justify-between pt-3">
                <span className="font-black text-lg text-orange-600 uppercase tracking-tight">₹{item.price}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-full">
                  {item.isBestseller ? 'Bestseller' : 'Standard'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Re-imports for Dashboard
import { Star, TrendingUp } from 'lucide-react';
