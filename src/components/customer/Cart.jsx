import React from 'react';
import { ShoppingBag, Minus, Plus, Loader2 } from 'lucide-react';

const Cart = ({ cart, updateQuantity, onSubmit, isSubmitting }) => {
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  if (!cart.length) {
    return (
      <>
        <div className="cart-topbar">
          <h3>Your Order</h3>
        </div>
        <div className="cart-empty">
          <ShoppingBag size={40} strokeWidth={1.5} />
          <p>Your cart is empty.<br />Add items from the menu to get started.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="cart-topbar">
        <h3>Your Order</h3>
        <span className="badge badge-pending">{cart.length} items</span>
      </div>

      <div className="cart-items-list">
        {cart.map((item, idx) => (
          <div key={`${item.id}-${idx}`} className="cart-row">
            <div className="cart-row-info">
              <div className="cart-row-name">{item.name}</div>
              <div className="cart-row-price">${(item.price * item.quantity).toFixed(2)}</div>
              {item.notes && <div className="cart-row-notes">{item.notes}</div>}
            </div>
            <div className="qty-control">
              <button className="qty-btn" onClick={() => updateQuantity(idx, -1)}><Minus size={13} /></button>
              <span className="qty-val">{item.quantity}</span>
              <button className="qty-btn" onClick={() => updateQuantity(idx, 1)}><Plus size={13} /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-footer">
        <div className="cart-total-row">
          <span className="cart-total-label">Total</span>
          <span className="cart-total-val">${total.toFixed(2)}</span>
        </div>
        <button
          id="checkout-btn"
          className="btn btn-primary btn-lg checkout-btn"
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? <><Loader2 size={18} className="spin" /> Sending to Kitchen...</>
            : 'Place Order'}
        </button>
      </div>
    </>
  );
};

export default Cart;
