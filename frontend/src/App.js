import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import './App.css';

const API = '/api';

/* ===== PROJECT CONFIG ===== */
const PROJECT_TOTAL_BUDGET = 11200000;
const MONTH_BUDGET = Math.round(PROJECT_TOTAL_BUDGET / 12);
const EDIT_USERS = ['kaushik', 'shruthi'];

const CATEGORY_ICONS = {
  'Foundation & Structure': '🏗️', 'Masonry': '🧱', 'Roofing': '🏠', 'Plumbing': '🚰',
  'Electrical': '💡', 'Labor & Services': '👷', 'Transport & Miscellaneous': '🚚',
  'Professional & Government': '📄', 'Site Preparation': '🚜', 'Carpentry & Wood Work': '🪚',
  'Metal & Fabrication': '🔩', 'Exterior Works': '🌳',
};

const formatINR = (val) => 
  new Intl.NumberFormat('en-IN', { 
    style: 'currency', currency: 'INR', maximumFractionDigits: 0 
  }).format(val);

function App() {
  const [user, setUser] = useState(localStorage.getItem('user') || '');
  const [loginName, setLoginName] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState({});
  const [selectedMonth, setSelectedMonth] = useState('');
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const getToday = () => new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    date: getToday(),
    quantity: '', unit: 'Units', category: '', group: '', amount: '', notes: '', vendor: '', Image: null,
  });

  const canEdit = EDIT_USERS.includes(user.toLowerCase());

  useEffect(() => {
    loadCategories(); loadExpenses();
    const now = new Date();
    setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  }, []);

  const loadCategories = async () => {
    const res = await axios.get(`${API}/categories`);
    setCategories(res.data || {});
  };

  const loadExpenses = async () => {
    const res = await axios.get(`${API}/expenses`);
    setExpenses(res.data);
  };

  const submit = async () => {
    if (!canEdit) return alert('Read-only access');
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });

    if (editing) {
      const res = await axios.put(`${API}/expenses/${editing._id}`, fd);
      setExpenses(p => p.map(e => e._id === editing._id ? res.data : e));
      setEditing(null);
    } else {
      const res = await axios.post(`${API}/expenses`, fd);
      setExpenses(p => [res.data, ...p]);
    }
    resetForm();
  };

  const resetForm = () => setForm({ date: getToday(), quantity: '', unit: 'Units', category: '', group: '', amount: '', notes: '', vendor: '', Image: null });

  const totalProjectSpent = useMemo(() => expenses.reduce((s, e) => s + Number(e.amount || 0), 0), [expenses]);
  
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        const d = new Date(e.date);
        const mMatch = selectedMonth ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === selectedMonth : true;
        const sMatch = [e.category, e.group, e.notes, e.vendor].some(field => 
          field?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return mMatch && sMatch;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [expenses, selectedMonth, searchTerm]);

  const monthlySpent = filteredExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const categoryTotals = filteredExpenses.reduce((a, e) => { a[e.group] = (a[e.group] || 0) + Number(e.amount || 0); return a; }, {});
  const maxCategory = Math.max(...Object.values(categoryTotals), 1);

  if (!user) {
    return (
      <div style={loginOverlay}>
        <div style={loginCard}>
          <h2 style={{ color: '#2c3e50' }}>🏗️ BuildTrack AI</h2>
          <p style={muted}>G+3 Construction Dashboard</p>
          <input style={loginInput} placeholder="Your Name" value={loginName} onChange={(e) => setLoginName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && loginName && setUser(loginName)} />
          <button style={loginBtn} onClick={() => { if(loginName) { localStorage.setItem('user', loginName); setUser(loginName); }}}>Access Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div style={mainBg}>
      <div className="container">
        {/* PROGRESS: POINT 1 */}
        <div style={{ ...card, marginBottom: 20, borderTop: '4px solid #28a745' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <strong>Total Project Budget Status</strong>
            <strong>{Math.round((totalProjectSpent / PROJECT_TOTAL_BUDGET) * 100)}% Spent</strong>
          </div>
          <div style={progressBg}><div style={{ ...progressBar, width: `${(totalProjectSpent / PROJECT_TOTAL_BUDGET) * 100}%` }} /></div>
          <div style={{ ...muted, marginTop: 5 }}>Overall: {formatINR(totalProjectSpent)} / {formatINR(PROJECT_TOTAL_BUDGET)}</div>
        </div>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
          <h1>Dashboard</h1>
          <div style={{ textAlign: 'right' }}>
            <strong>{user}</strong> <span style={roleBadge}>{canEdit ? 'Editor' : 'Viewer'}</span>
            <div style={{ cursor: 'pointer', color: '#dc3545', fontSize: 12 }} onClick={() => { localStorage.removeItem('user'); setUser(''); }}>Logout</div>
          </div>
        </div>

        {/* FILTERS */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 25 }}>
          <div style={{ ...card, flex: 1, textAlign: 'center' }}>
            <div style={muted}>Monthly Gauge</div>
            <CircularGauge percent={Math.min(Math.round((monthlySpent / MONTH_BUDGET) * 100), 100)} />
            <div style={{ fontWeight: 'bold' }}>{formatINR(monthlySpent)}</div>
          </div>
          <div style={{ ...card, flex: 2 }}>
            <h3>Project Filters</h3>
            <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ flex: 1 }}>
                {Array.from({ length: 12 }, (_, i) => {
                  const d = new Date(2025, i);
                  const val = `${d.getFullYear()}-${String(i + 1).padStart(2, '0')}`;
                  return <option key={val} value={val}>{d.toLocaleString('default', { month: 'short', year: 'numeric' })}</option>;
                })}
              </select>
              <input style={searchInput} placeholder="🔍 Search vendor, material, note..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={() => {setSearchTerm(''); setSelectedMonth('');}} style={clearBtn}>Reset All View</button>
          </div>
        </div>

        {/* FORM: POINT 2 & 3 & DATE */}
        {canEdit && (
          <div style={{ ...card, marginBottom: 25, background: '#f8f9fa' }}>
            <h3 style={{ marginBottom: 15 }}>{editing ? '📝 Edit Transaction' : '➕ Add Construction Expense'}</h3>
            <div className="form-row">
              <div style={inputGroup}>
                <label style={labelStyle}>Date</label>
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>Quantity</label>
                <div style={{ display: 'flex', gap: 5 }}>
                  <input placeholder="Qty" style={{ width: '60px' }} value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
                  <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                    <option>Units</option><option>Bags</option><option>Kg</option><option>CFT</option><option>Load</option><option>Sqft</option>
                  </select>
                </div>
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>Category</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value, group: e.target.selectedOptions[0].dataset.group})}>
                  <option value="">Select Material</option>
                  {Object.entries(categories).map(([g, items]) => (
                    <optgroup key={g} label={g}>{items.map(c => <option key={c._id} value={c.name} data-group={g}>{c.name}</option>)}</optgroup>
                  ))}
                </select>
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>Vendor (Shop)</label>
                <input placeholder="Name of Supplier" value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})} />
              </div>
            </div>
            <div className="form-row" style={{ marginTop: 15 }}>
              <div style={{ ...inputGroup, flex: 1 }}>
                <label style={labelStyle}>Total Amount</label>
                <input type="number" placeholder="₹" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
              </div>
              <div style={{ ...inputGroup, flex: 2 }}>
                <label style={labelStyle}>Notes</label>
                <input placeholder="Bill details or payment mode" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="btn-add" style={{ height: '40px' }} onClick={submit}>{editing ? 'Update' : 'Save Entry'}</button>
                {editing && <button onClick={resetForm} style={{ ...clearBtn, height: '40px', marginLeft: 10 }}>Cancel</button>}
              </div>
            </div>
          </div>
        )}

        {/* INTERACTIVE CARDS: POINT 4 */}
        <div style={grid}>
          {Object.entries(categoryTotals).map(([g, amt]) => (
            <div key={g} style={{ ...card, cursor: 'pointer', border: searchTerm === g ? '2px solid #28a745' : '1px solid transparent' }} onClick={() => setSearchTerm(g)}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{CATEGORY_ICONS[g] || '📦'} {g}</span>
                <strong>{formatINR(amt)}</strong>
              </div>
              <div style={progressBg}><div style={{ ...progressBar, width: `${(amt / maxCategory) * 100}%` }} /></div>
            </div>
          ))}
        </div>

        {/* TABLE */}
        <h3 style={{ marginTop: 30 }}>Expense Log ({filteredExpenses.length})</h3>
        <table className="expense-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Material / Vendor</th>
              <th>Qty</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map(e => (
              <tr key={e._id}>
                <td>{new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                <td>
                  <strong>{e.category}</strong>
                  <div style={{ fontSize: 11, color: '#28a745' }}>{e.vendor || 'Unknown'}</div>
                </td>
                <td>{e.quantity} {e.unit}</td>
                <td style={{ fontWeight: 'bold' }}>{formatINR(e.amount)}</td>
                <td>
                  {canEdit && <button className="btn-add" onClick={() => {setEditing(e); setForm({ ...e, Image: null }); window.scrollTo(0,0)}}>Edit</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* STYLES (Keep existing or update as below) */
const mainBg = { backgroundColor: '#f4f7f9', minHeight: '100vh', paddingBottom: '40px' };
const loginOverlay = { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2c3e50' };
const loginCard = { background: 'white', padding: '40px', borderRadius: '15px', textAlign: 'center', width: '90%', maxWidth: '400px' };
const loginInput = { width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #ddd' };
const loginBtn = { width: '100%', padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' };
const card = { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 };
const labelStyle = { fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' };
const muted = { fontSize: 12, color: '#777' };
const progressBg = { height: 8, background: '#e9ecef', borderRadius: 10, marginTop: 10 };
const progressBar = { height: '100%', background: '#28a745', borderRadius: 10 };
const roleBadge = { padding: '2px 8px', borderRadius: 12, fontSize: 10, color: 'white', background: '#28a745', marginLeft: 5 };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 };
const searchInput = { flex: 2, padding: '10px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' };
const clearBtn = { marginTop: 10, padding: '5px 10px', fontSize: 11, background: '#eee', border: 'none', borderRadius: 4, cursor: 'pointer' };

const CircularGauge = ({ percent }) => (
  <div style={{ width: 90, height: 90, borderRadius: '50%', background: `conic-gradient(#28a745 ${percent}%, #e9ecef 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '15px auto' }}>
    <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{percent}%</div>
  </div>
);

export default App;