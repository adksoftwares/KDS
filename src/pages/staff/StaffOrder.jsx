import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMenuItems, createOrder } from '../../services/db';

export default function StaffOrder() {
  const { reg_id } = useParams();
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [notes, setNotes] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Fetch validated customer and product catalog on mount
  useEffect(() => {
    // 1. Fetch menu catalog
    getMenuItems().then(items => setMenuItems(items));

    // 2. Fetch validated customer details
    const mockUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
    const user = mockUsers.find(u => u.id === reg_id);
    if (!user) {
      navigate('/staff/scan');
    } else {
      setCurrentUser(user);
    }
  }, [reg_id, navigate]);

  const categories = ['All', 'Mains', 'Drinks', 'Desserts'];

  const filteredItems = activeCategory === 'All'
    ? menuItems
    : menuItems.filter(item => item.category === activeCategory);

  const addToCart = (item) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (itemId, delta) => {
    const updated = cart.map(c => {
      if (c.id === itemId) {
        const newQty = c.quantity + delta;
        return newQty > 0 ? { ...c, quantity: newQty } : null;
      }
      return c;
    }).filter(Boolean);
    setCart(updated);
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError('Please add at least one food item to the ticket.');
      return;
    }
    setError('');
    setLoading(true);

    const orderData = {
      user_id: currentUser.id,
      user_name: currentUser.name,
      items: cart.map(c => ({
        id: c.id,
        name: c.name,
        quantity: c.quantity,
        price: c.price
      })),
      notes: notes.trim(),
      total_price: parseFloat(getCartTotal()),
      status: 'pending',
      bell_triggered: false
    };

    const res = await createOrder(orderData);
    setLoading(false);

    if (res) {
      setSuccess(true);
      setTimeout(() => {
        // Reset and go back to scanner screen to process the next user
        navigate('/staff/scan');
      }, 2000);
    } else {
      setError('Failed to dispatch order to kitchen.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 p-6 font-sans flex flex-col">
      {/* Dynamic Success Checkmark Modal */}
      {success && (
        <div className="fixed inset-0 bg-[#0B0F19]/90 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-[#121A2F] border border-slate-700/80 rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_0_80px_rgba(139,92,246,0.2)] animate-in fade-in zoom-in duration-300">
            <span className="text-5xl block animate-bounce mb-4">🚀</span>
            <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">Order Dispatched!</h2>
            <p className="text-xs text-slate-400 mt-2">Food has been successfully logged and sent to the Kitchen Display console. Loading scanner...</p>
          </div>
        </div>
      )}

      {/* Top Cashier Navigation Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/staff/scan')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
          >
            ← Cancel & Exit
          </button>
          {currentUser && (
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-mono font-bold rounded-lg">{currentUser.id}</span>
              <strong className="text-sm font-extrabold">{currentUser.name}</strong>
            </div>
          )}
        </div>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Food checkout station</span>
      </div>

      {/* Primary Split Matrix Container */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        
        {/* Left Side: Product Grid (2 Columns on large) */}
        <div className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto max-h-[85vh] pr-2 custom-scrollbar">
          {/* Category Tabs */}
          <div className="flex gap-2 bg-[#101625] p-1.5 rounded-2xl border border-slate-850">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeCategory === cat 
                    ? 'bg-purple-600 text-slate-100 shadow-md shadow-purple-600/15' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Items List Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredItems.map(item => (
              <div 
                key={item.id} 
                className="bg-[#101625] border border-slate-800/80 rounded-2xl p-4 flex gap-4 hover:border-slate-700/60 hover:shadow-lg transition-all group relative overflow-hidden"
              >
                {/* Visual Image */}
                <div className="w-20 h-20 bg-slate-800 rounded-xl overflow-hidden relative shrink-0">
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  {!item.is_available && (
                    <div className="absolute inset-0 bg-[#000000]/70 backdrop-blur-[2px] flex items-center justify-center text-[10px] text-red-400 font-extrabold uppercase tracking-widest">Out of Stock</div>
                  )}
                </div>

                {/* Body Meta */}
                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-200">{item.name}</h3>
                    <span className="text-[10px] text-slate-500 font-mono block">{item.category}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-400 font-bold font-mono">${item.price.toFixed(2)}</span>
                    <button
                      onClick={() => addToCart(item)}
                      disabled={!item.is_available}
                      className="px-3 py-1.5 bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-slate-100 border border-purple-500/20 rounded-xl text-[10px] font-extrabold transition-all"
                    >
                      + Add Item
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Cashier checkout cart sheet (1 Column) */}
        <div className="bg-[#101625] border border-slate-800 rounded-3xl p-6 flex flex-col justify-between max-h-[85vh]">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight pb-3 border-b border-slate-800 mb-4">Checkout Ticket</h2>
            
            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <span className="text-3xl block mb-2">🛒</span>
                <p className="text-xs">Cart is currently empty.<br/>Select menu items to check out.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-[#1B2336] p-3 rounded-xl border border-slate-700/30">
                    <div>
                      <strong className="text-xs text-slate-200 block">{item.name}</strong>
                      <span className="text-[10px] text-slate-500 font-mono">${item.price.toFixed(2)}</span>
                    </div>
                    
                    {/* Quantity Selector controls */}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-xs font-bold"
                      >
                        -
                      </button>
                      <span className="text-xs font-extrabold text-slate-100 w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Chef/Kitchen cooking comments */}
            <div className="mt-4 pt-4 border-t border-slate-800/85">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Kitchen Comments / notes</label>
              <textarea
                placeholder="e.g. No onions on the burger, extra ice in drinks..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full h-20 px-3 py-2 bg-[#1B2336] rounded-xl border border-slate-700/60 text-slate-200 text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-all resize-none"
              />
            </div>
          </div>

          {/* Subtotal Checkout Action controls */}
          <div className="border-t border-slate-800/85 pt-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400">Total Ticket Bill</span>
              <strong className="text-xl text-purple-400 font-mono font-extrabold">${getCartTotal()}</strong>
            </div>

            {error && <p className="text-red-400 text-xs text-center mb-3 font-semibold">{error}</p>}

            <button
              onClick={handleCheckout}
              disabled={loading || cart.length === 0}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-slate-100 rounded-xl font-extrabold text-sm tracking-wide transition-all shadow-lg shadow-purple-600/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? 'Processing Ticket...' : 'Send Ticket to Kitchen 🚀'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
