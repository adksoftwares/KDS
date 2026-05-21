import React, { useState } from 'react';
import { Plus } from 'lucide-react';

const MenuBrowser = ({ menuItems, onAddToCart }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', ...new Set(menuItems.map(i => i.category))];
  const filtered = activeCategory === 'All'
    ? menuItems
    : menuItems.filter(i => i.category === activeCategory);

  return (
    <div>
      {/* Category Pills */}
      <div className="category-bar">
        {categories.map(cat => (
          <button
            key={cat}
            className={`cat-pill ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="menu-grid">
        {filtered.map(item => (
          <div key={item.id} className={`menu-card ${!item.is_available ? 'unavailable' : ''}`}>
            <div className="menu-img-wrap">
              <img src={item.image_url} alt={item.name} className="menu-img" loading="lazy" />
              {!item.is_available && <div className="sold-out-overlay">Sold Out</div>}
            </div>
            <div className="menu-body">
              <p className="menu-name">{item.name}</p>
              <p className="menu-price">${item.price.toFixed(2)}</p>
              <button
                className="btn btn-primary btn-sm add-btn"
                disabled={!item.is_available}
                onClick={() => onAddToCart(item)}
              >
                <Plus size={14} /> Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuBrowser;
