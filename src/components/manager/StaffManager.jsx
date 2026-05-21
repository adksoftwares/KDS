import React, { useState, useEffect } from 'react';
import { listenToStaff, addStaffMember, removeStaffMember } from '../../services/db';
import { UserPlus, Trash2, Shield, User, Key, Mail } from 'lucide-react';

const StaffManager = () => {
  const [staffList, setStaffList] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Kitchen Staff');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const unsubscribe = listenToStaff(setStaffList);
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      // Check if email already exists
      const emailExists = staffList.some(
        (member) => member.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (emailExists) {
        setError('A staff member with this email already exists.');
        return;
      }

      await addStaffMember({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(), // In a real production system we would hash this
        role
      });

      setSuccess(`Staff account for ${name} successfully created!`);
      setName('');
      setEmail('');
      setPassword('');
      setRole('Kitchen Staff');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('Failed to add staff member. Please try again.');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove staff member: ${name}?`)) {
      try {
        await removeStaffMember(id);
        setSuccess(`Staff member ${name} removed.`);
        setTimeout(() => setSuccess(''), 4000);
      } catch (err) {
        setError('Failed to remove staff member.');
      }
    }
  };

  return (
    <div className="staff-manager-container" style={{ padding: '24px', color: '#ffffff' }}>
      <div className="tab-header" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          👥 Staff User Management
        </h2>
        <p style={{ color: '#888888', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
          Create and manage system access accounts for shop staff and kitchen chefs.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Left Side: Create User Form */}
        <div style={{ backgroundColor: '#111111', border: '1px solid #222222', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', borderBottom: '1px solid #222222', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
            <UserPlus size={18} /> Register New Staff Member
          </h3>

          {error && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
              ✓ {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaaaaa', marginBottom: '6px', fontWeight: '600' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666666' }}><User size={16} /></span>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px 10px 38px', backgroundColor: '#181818', border: '1px solid #333333', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaaaaa', marginBottom: '6px', fontWeight: '600' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666666' }}><Mail size={16} /></span>
                <input
                  type="email"
                  placeholder="e.g. chef@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px 10px 38px', backgroundColor: '#181818', border: '1px solid #333333', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaaaaa', marginBottom: '6px', fontWeight: '600' }}>Access Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666666' }}><Key size={16} /></span>
                <input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px 10px 38px', backgroundColor: '#181818', border: '1px solid #333333', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaaaaa', marginBottom: '6px', fontWeight: '600' }}>System Role</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666666' }}><Shield size={16} /></span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px 10px 38px', backgroundColor: '#181818', border: '1px solid #333333', borderRadius: '8px', color: '#ffffff', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="Kitchen Staff">🧑‍🍳 Kitchen Staff (KDS access)</option>
                  <option value="Manager">💼 Manager (Dashboard & KDS)</option>
                  <option value="Cashier">💵 Cashier / Receptionist</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '12px', borderRadius: '8px', fontWeight: '700', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}
            >
              <UserPlus size={16} /> Create User Account
            </button>
          </form>
        </div>

        {/* Right Side: Staff Accounts List */}
        <div style={{ backgroundColor: '#111111', border: '1px solid #222222', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', borderBottom: '1px solid #222222', paddingBottom: '12px', color: '#aaaaaa' }}>
            👥 Authorized Staff Accounts ({staffList.length})
          </h3>

          {staffList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#666666' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>No custom staff accounts found.</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>The system is currently using default super-admin credentials.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
              {staffList.map((member) => (
                <div
                  key={member.id}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', backgroundColor: '#181818', border: '1px solid #222222', borderRadius: '8px' }}
                >
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {member.name}
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: member.role === 'Manager' ? '#a78bfa' : '#3b82f6', backgroundColor: member.role === 'Manager' ? 'rgba(139,92,246,0.15)' : 'rgba(59,130,246,0.15)', padding: '2px 8px', borderRadius: '99px', border: member.role === 'Manager' ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(59,130,246,0.3)' }}>
                        {member.role}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#888888', marginTop: '2px' }}>
                      ✉ {member.email}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(member.id, member.name)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px', borderRadius: '6px', transition: 'background-color 0.2s' }}
                    title="Delete Account"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default StaffManager;
