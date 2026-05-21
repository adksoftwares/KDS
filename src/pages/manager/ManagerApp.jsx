import React, { useState } from 'react';
import { LayoutDashboard, MenuSquare, QrCode, LogOut, Users } from 'lucide-react';
import { clearSession } from '../../services/auth';
import ManagerLogin from './ManagerLogin';
import MetricsDashboard from '../../components/manager/MetricsDashboard';
import MenuManager from '../../components/manager/MenuManager';
import QRGenerator from '../../components/manager/QRGenerator';
import StaffManager from '../../components/manager/StaffManager';
import './manager.css';

const ManagerApp = () => {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kds_auth')); }
    catch { return null; }
  });
  const [activeTab, setActiveTab] = useState('metrics');

  if (!session?.loggedIn) {
    return <ManagerLogin onLogin={(s) => setSession(s)} />;
  }

  const handleLogout = () => {
    clearSession();
    setSession(null);
  };

  const renderContent = () => {
    if (activeTab === 'metrics') return <MetricsDashboard />;
    if (activeTab === 'menu')    return <MenuManager />;
    if (activeTab === 'qr')      return <QRGenerator />;
    if (activeTab === 'staff')   return <StaffManager />;
  };

  return (
    <div className="manager-page">
      {/* Top Bar */}
      <header className="manager-topbar">
        <div className="logo-mark">
          <div className="logo-icon" style={{ background: 'rgba(139,92,246,.15)', color: '#a78bfa' }}>
            <LayoutDashboard size={20} />
          </div>
          <div className="logo-text">
            <h1>Manager Dashboard</h1>
            <p>Restaurant Operations</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <nav className="manager-nav">
            <button id="tab-metrics" className={`nav-btn ${activeTab === 'metrics' ? 'active' : ''}`}
              onClick={() => setActiveTab('metrics')}>
              <LayoutDashboard size={16} /> Metrics
            </button>
            <button id="tab-menu" className={`nav-btn ${activeTab === 'menu' ? 'active' : ''}`}
              onClick={() => setActiveTab('menu')}>
              <MenuSquare size={16} /> Menu
            </button>
            <button id="tab-qr" className={`nav-btn ${activeTab === 'qr' ? 'active' : ''}`}
              onClick={() => setActiveTab('qr')}>
              <QrCode size={16} /> QR Codes
            </button>
            <button id="tab-staff" className={`nav-btn ${activeTab === 'staff' ? 'active' : ''}`}
              onClick={() => setActiveTab('staff')}>
              <Users size={16} /> Staff Accounts
            </button>
          </nav>
          <a href="/kitchen" target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', height: '32px', lineHeight: '32px', padding: '0 12px' }}>
            🖥️ KDS Screen
          </a>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Sign Out">
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </header>

      <div className="manager-body">
        {renderContent()}
      </div>
    </div>
  );
};

export default ManagerApp;
