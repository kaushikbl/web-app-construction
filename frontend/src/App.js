import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import './App.css';

const API = '/api';

/* ===== PROJECT CONFIG ===== */
const PROJECT_TOTAL_BUDGET = 11200000;
const MONTH_BUDGET = Math.round(PROJECT_TOTAL_BUDGET / 16);
const EDIT_USERS = ['kaushik', 'shruthi'];

const CATEGORY_ICONS = {
  'Foundation & Structure': '🏗️', 'Masonry': '🧱', 'Roofing': '🏠', 'Plumbing': '🚰',
  'Electrical': '💡', 'Labor & Services': '👷', 'Transport & Miscellaneous': '🚚',
  'Government Fees': '🏛️', 'Architect Fees': '📐', 'Borewell': '🕳️',
  'Site Preparation': '🚜', 'Carpentry & Wood Work': '🪚',
  'Metal & Fabrication': '🔩', 'Exterior Works': '🌳',
};

const formatINR = (val) => 
  new Intl.NumberFormat('en-IN', { 
    style: 'currency', currency: 'INR', maximumFractionDigits: 0 
  }).format(val);

/* ===== REFINED SUB-COMPONENTS ===== */

// Semantic Gauge with Color Logic
const CircularGauge = ({ percent }) => {
  const getColor = (p) => {
    if (p > 90) return '#f43f5e'; // Rose-500 (Over-budget)
    if (p > 75) return '#f59e0b'; // Amber-500 (Warning)
    return '#10b981'; // Emerald-500 (Safe)
  };
  const color = getColor(percent);

  return (
    <div className="gauge-outer" style={{ background: `conic-gradient(${color} ${percent}%, #f1f5f9 0)` }}>
      <div className="gauge-inner" style={{ color: color }}>{percent}%</div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(localStorage.getItem('user') || '');
  const [loginName, setLoginName] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState({});
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editing, setEditing] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const getToday = () => new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    date: getToday(), quantity: '', unit: 'Units', category: '', 
    group: '', amount: '', notes: '', vendor: '', Image: null,
  });

  const canEdit = EDIT_USERS.includes(user.toLowerCase());

  useEffect(() => {
    if (user) {
      loadCategories(); 
      loadExpenses();
    }
  }, [user]);

  const loadCategories = async () => {
    try {
        const res = await axios.get(`${API}/categories`);
        setCategories(res.data || {});
    } catch (e) { console.error("Error loading categories", e); }
  };

  const loadExpenses = async () => {
    try {
        const res = await axios.get(`${API}/expenses`);
        setExpenses(res.data || []);
    } catch (e) { console.error("Error loading expenses", e); }
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ 
      date: getToday(), quantity: '', unit: 'Units', category: '', 
      group: '', amount: '', notes: '', vendor: '', Image: null 
    });
  };

  const submit = async () => {
    if (!canEdit) return alert('Read-only access');
    const fd = new FormData();
    Object.keys(form).forEach(key => fd.append(key, form[key]));

    try {
      if (editing) {
        const res = await axios.put(`${API}/expenses/${editing._id}`, fd);
        setExpenses(prev => prev.map(e => e._id === editing._id ? res.data : e));
      } else {
        const res = await axios.post(`${API}/expenses`, fd);
        setExpenses(prev => [res.data, ...prev]);
      }
      resetForm();
    } catch (err) { alert("Error saving record."); }
  };

  const remove = async (id) => {
    if (!canEdit || !window.confirm('Delete record?')) return;
    try {
      await axios.delete(`${API}/expenses/${id}`);
      setExpenses(p => p.filter(e => e._id !== id));
    } catch (err) { alert("Error deleting record."); }
  };

  const totalProjectSpent = useMemo(() => expenses.reduce((s, e) => s + Number(e.amount || 0), 0), [expenses]);
  
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        const d = new Date(e.date);
        const yearMatch = selectedYear ? d.getFullYear().toString() === selectedYear : true;
        const monthMatch = selectedMonth ? (d.getMonth() + 1).toString().padStart(2, '0') === selectedMonth : true;
        const sMatch = [e.category, e.group, e.notes, e.vendor].some(field => 
          String(field || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
        return yearMatch && monthMatch && sMatch;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [expenses, selectedYear, selectedMonth, searchTerm]);

  const currentViewTotal = filteredExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  const categorySummary = useMemo(() => {
    return filteredExpenses.reduce((acc, exp) => {
      const groupName = exp.group || "Other";
      acc[groupName] = (acc[groupName] || 0) + Number(exp.amount || 0);
      return acc;
    }, {});
  }, [filteredExpenses]);

  if (!user) return <LoginScreen loginName={loginName} setLoginName={setLoginName} setUser={setUser} />;

  return (
    <div className="dashboard-bg">
      <div className="container">
        {/* Header Section */}
        <header className="main-header">
            <h1 className="header-title">BuildNest Dashboard</h1>
            <div className="header-actions">
              <span className="user-badge">👤 {user}</span>
              <button onClick={() => { localStorage.clear(); setUser(''); }} className="btn-logout">Logout</button>
            </div>
        </header>

        {/* Global Progress Tracking Card */}
        <div className="dashboard-card progress-section">
          <div className="flex-between">
            <span className="text-slate-900 font-bold">Project Budget Progress</span>
            <span className="text-emerald-600 font-bold">{Math.round((totalProjectSpent / PROJECT_TOTAL_BUDGET) * 100)}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${Math.min((totalProjectSpent / PROJECT_TOTAL_BUDGET) * 100, 100)}%` }} />
          </div>
          <div className="text-slate-500 text-sm mt-2">Spent: {formatINR(totalProjectSpent)} / {formatINR(PROJECT_TOTAL_BUDGET)}</div>
        </div>

        <div className="dashboard-grid">
          {/* Monthly Metric Card */}
          <div className="dashboard-card metric-card">
            <span className="text-slate-500 block text-center">Monthly Budget Spent</span>
            <CircularGauge percent={Math.min(Math.round((currentViewTotal / MONTH_BUDGET) * 100), 100)} />
            <div className="text-center font-bold text-slate-900">{formatINR(currentViewTotal)} / {formatINR(MONTH_BUDGET)}</div>
          </div>

          {/* Filtering Card */}
          <div className="dashboard-card filter-card">
            <h3 className="section-title">View Filters</h3>
            <div className="filter-row">
              <select className="slate-input" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                {['2024','2025','2026'].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select className="slate-input" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                <option value="">Full Year</option>
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                  <option key={i} value={(i + 1).toString().padStart(2, '0')}>{m}</option>
                ))}
              </select>
            </div>
            <input className="slate-input search-box" placeholder="🔍 Search vendor, material..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {/* Dynamic Entry Form */}
        {canEdit && (
          <div className="dashboard-card form-section">
            <h3 className="section-title">{editing ? '📝 Edit Entry' : '➕ Add Expense'}</h3>
            <div className="form-grid">
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="slate-input" />
              <input className="slate-input" placeholder="Vendor / Payee" value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})} />
              <div className="flex-gap">
                <input className="slate-input" placeholder="Qty" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
                <select className="slate-input" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                  <option>Ton</option><option>Bags</option><option>Kg</option><option>CFT</option><option>Sqft</option>
                </select>
              </div>
              <select className="slate-input" value={form.category} onChange={e => {
                  const opt = e.target.selectedOptions[0];
                  setForm({...form, category: e.target.value, group: opt?.dataset.group || ''})
              }}>
                <option value="">Select Category</option>
                {Object.entries(categories).map(([g, items]) => (
                  <optgroup key={g} label={g}>{items.map(c => <option key={c._id} value={c.name} data-group={g}>{c.name}</option>)}</optgroup>
                ))}
              </select>
              <input className="slate-input" type="number" placeholder="Amount (₹)" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
              <input className="slate-input" placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              <input type="file" className="file-input" onChange={e => setForm({...form, Image: e.target.files[0]})} />
              <div className="form-buttons">
                {editing && <button onClick={resetForm} className="btn-cancel">Cancel</button>}
                <button className="btn-submit" onClick={submit}>{editing ? 'Update' : 'Add'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Visual Category Breakdown */}
        <div className="category-breakdown-section">
          <h3 className="section-title">Category Wise Expenses</h3>
          <div className="category-flex">
            {Object.entries(categorySummary).map(([group, total]) => (
              <div key={group} className="category-item-card">
                <div className="category-header">
                  <div className="icon-badge">{CATEGORY_ICONS[group] || '📦'}</div>
                  <span className="group-name">{group}</span>
                  <span className="group-total">{formatINR(total)}</span>
                </div>
                <div className="mini-progress"><div className="mini-progress-fill" style={{ width: `${(total / (totalProjectSpent || 1)) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>

        {/* Scannable Ledger Table */}
        <div className="dashboard-card table-wrapper">
          <table className="modern-table">
            <thead>
              <tr><th>Date</th><th>Details</th><th>Vendor</th><th>Amount</th><th>Bill</th><th>Action</th></tr>
            </thead>
            <tbody>
              {filteredExpenses.map(e => (
                <tr key={e._id}>
                  <td>{new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                  <td>
                    <div className="sub-detail">{e.group}</div>
                    <div className="main-detail">{e.category}</div>
                  </td>
                  <td className={e.vendor ? "text-slate-700" : "italic text-slate-400"}>
                    {e.vendor || 'No vendor recorded'}
                  </td>
                  <td><span className="amount-badge">{formatINR(e.amount)}</span></td>
                  <td>
                    {e.Image ? <img src={e.Image} onClick={() => setPreviewImage(e.Image)} className="thumb-preview" alt="receipt" /> : <span className="text-slate-300">—</span>}
                  </td>
                  <td>
                    {canEdit && <div className="action-row">
                      <button className="btn-action edit" onClick={() => { setEditing(e); setForm({...e, Image: null}); window.scrollTo(0,0); }}>Edit</button>
                      <button className="btn-action del" onClick={() => remove(e._id)}>Del</button>
                    </div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {previewImage && <div className="overlay-lightbox" onClick={() => setPreviewImage(null)}><img src={previewImage} className="full-receipt" alt="Full bill" /></div>}
    </div>
  );
}

// Minimalistic Login Component
const LoginScreen = ({ loginName, setLoginName, setUser }) => (
  <div className="login-container">
    <div className="login-box">
      <div className="login-logo-header">🏗️ BuildNest</div>
      <p className="login-tagline">Advanced Construction Metrics</p>
      <input className="slate-input mb-4" placeholder="Enter user name" value={loginName} onChange={(e) => setLoginName(e.target.value)} />
      <button className="btn-submit block-btn" onClick={() => { if(loginName.trim()){ localStorage.setItem('user', loginName); setUser(loginName); }}}>Get Started</button>
    </div>
  </div>
);

export default App;