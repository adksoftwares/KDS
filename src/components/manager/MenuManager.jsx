import React, { useState, useEffect } from 'react';
import { listenToMenuItems, updateMenuItem } from '../../services/db';
import { Plus } from 'lucide-react';

const MenuManager = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const unsub = listenToMenuItems(setItems);
    return () => unsub();
  }, []);

  const toggleAvailability = (item) => {
    updateMenuItem(item.id, { is_available: !item.is_available });
  };

  return (
    <div className="menu-manager-card card">
      <div className="card-header">
        <h4>Live Inventory Control</h4>
        <button className="btn btn-primary btn-sm"><Plus size={14} /> Add Item</button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: 60 }}></th>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Availability</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} style={!item.is_available ? { opacity: 0.5 } : {}}>
              <td>
                <img src={item.image_url} alt={item.name} className="item-thumb" />
              </td>
              <td style={{ fontWeight: 600 }}>{item.name}</td>
              <td style={{ color: 'var(--text-secondary)' }}>{item.category}</td>
              <td style={{ fontWeight: 700 }}>${item.price.toFixed(2)}</td>
              <td>
                <div
                  className="toggle-wrap"
                  role="switch"
                  aria-checked={item.is_available}
                  onClick={() => toggleAvailability(item)}
                  title={item.is_available ? 'Mark as Sold Out' : 'Mark as In Stock'}
                >
                  <div className={`toggle-track ${item.is_available ? 'on' : ''}`}>
                    <div className="toggle-thumb" />
                  </div>
                  <span style={{ fontSize: '0.85rem', color: item.is_available ? 'var(--ready)' : 'var(--danger)', fontWeight: 600 }}>
                    {item.is_available ? 'In Stock' : 'Sold Out'}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MenuManager;
