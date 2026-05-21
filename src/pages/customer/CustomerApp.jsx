import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { listenToMenuItems, createOrder } from '../../services/db';
import { signInCustomerAnonymously } from '../../services/auth';
import MenuBrowser from '../../components/customer/MenuBrowser';
import Cart from '../../components/customer/Cart';
import { Utensils, CheckCircle } from 'lucide-react';
import './customer.css';

const CustomerApp = () => {
  const { table_id } = useParams();
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    signInCustomerAnonymously().catch(err => console.error("Anonymous sign in failed:", err));
    const unsubscribe = listenToMenuItems(setMenuItems);
    return () => unsubscribe();
  }, []);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, notes: '' }];
    });
  };

  const updateQuantity = (index, delta) => {
    setCart(prev => {
      const next = [...prev];
      next[index] = { ...next[index], quantity: next[index].quantity + delta };
      if (next[index].quantity <= 0) next.splice(index, 1);
      return next;
    });
  };

  const submitOrder = async () => {
    if (!cart.length) return;
    setIsSubmitting(true);
    try {
      const total_price = cart.reduce((s, i) => s + i.price * i.quantity, 0);
      await createOrder({
        table_id: table_id || 'unknown',
        total_price,
        items: cart.map(i => ({ item_id: i.id, name: i.name, quantity: i.quantity, notes: i.notes })),
      });
      setCart([]);
      setOrderSuccess(true);
      setTimeout(() => setOrderSuccess(false), 5000);
    } catch (err) {
      console.error("Order submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tableLabel = table_id ? table_id.replace(/_/g, ' ').toUpperCase() : 'UNKNOWN';

  return (
    <div className="customer-page">
      {/* Top Bar */}
      <header className="customer-topbar">
        <div className="logo-mark">
          <div className="logo-icon" style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}>
            <Utensils size={20} />
          </div>
          <div className="logo-text">
            <h1>Order Now</h1>
            <p>Table: {tableLabel}</p>
          </div>
        </div>
        <span className="badge" style={{ fontSize: '0.8rem' }}>
          {cart.reduce((s, i) => s + i.quantity, 0)} items in cart
        </span>
      </header>

      {/* Success Banner */}
      {orderSuccess && (
        <div className="order-success-banner">
          <CheckCircle size={18} />
          Order sent to kitchen! Your food is on its way.
        </div>
      )}

      {/* Body */}
      <div className="customer-body">
        <div className="menu-side">
          <MenuBrowser menuItems={menuItems} onAddToCart={addToCart} />
        </div>
        <div className="cart-side">
          <Cart
            cart={cart}
            updateQuantity={updateQuantity}
            onSubmit={submitOrder}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default CustomerApp;
