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
    date: getToday(),
    quantity: '', 
    unit: 'Units', 
    category: '', 
    group: '', 
    amount: '', 
    notes: '', 
    vendor: '', 
    Image: null,
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
    if (!form.vendor) return alert('Please enter Vendor name');
    if (!form.category) return alert('Select category');
    if (!form.amount) return alert('Enter amount');
    if (!form.quantity) return alert('Enter quantity');

    const fd = new FormData();
    fd.append('date', form.date);
    fd.append('vendor', form.vendor);
    fd.append('quantity', form.quantity);
    fd.append('unit', form.unit);
    fd.append('category', form.category);
    fd.append('group', form.group);
    fd.append('amount', form.amount);
    fd.append('notes', form.notes);
    if (form.Image) fd.append('Image', form.Image);

    try {
      if (editing) {
        const res = await axios.put(`${API}/expenses/${editing._id}`, fd);
        setExpenses(prev => prev.map(e => e._id === editing._id ? res.data : e));
      } else {
        const res = await axios.post(`${API}/expenses`, fd);
        setExpenses(prev => [res.data, ...prev]);
      }
      resetForm();
    } catch (err) {
      alert("Error saving record.");
    }
  };

  const remove = async (id) => {
    if (!canEdit || !window.confirm('Delete record?')) return;
    try {
      await axios.delete(`${API}/expenses/${id}`);
      setExpenses(p => p.filter(e => e._id !== id));
    } catch (err) {
      alert("Error deleting record.");
    }
  };

  const getImageUrl = (img) => {
    if (!img) return null;
    return img.includes('/uploads/') ? img.substring(img.indexOf('/uploads/')) : img;
  };

  const totalProjectSpent = useMemo(() => expenses.reduce((s, e) => s + Number(e.amount || 0), 0), [expenses]);
  
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        const d = new Date(e.date);
        const yearMatch = selectedYear ? d.getFullYear().toString() === selectedYear : true;
        const monthMatch = selectedMonth ? (d.getMonth() + 1).toString().padStart(2, '0') === selectedMonth : true;
        const sMatch = [e.category, e.group, e.notes, e.vendor].some(field => 
          field?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const maxCategorySpent = Math.max(...Object.values(categorySummary), 1);

  /* ========================================= */
  /* 1. LOGIN SCREEN SUB-RENDER CODE BLOCK    */
  /* ========================================= */
  if (!user) {
    return (
      <div className="modern-login-wrapper">
        <div className="left-panel">
          <div>
            <div className="brand-section">
              <div className="logo-box">🏗️</div>
              <div>
                <h1 className="brand-title">BuildNest</h1>
                <p className="brand-sub">Smart Construction Dashboard</p>
              </div>
            </div>

            <div style={{ marginTop: 80 }}>
              <h1 className="hero-title">
                Build Better.<br />
                Track <span style={{ color: '#f59e0b' }}>Smarter.</span>
              </h1>
              <p className="hero-text">
                Monitor budgets, expenses, vendors and construction progress in real time.
              </p>

              <div style={{ marginTop: 50 }}>
                <div className="feature-item">
                  <div className="feature-icon">📊</div>
                  <div>
                    <div className="feature-title">Real-time Insights</div>
                    <div className="feature-desc">Track every rupee instantly</div>
                  </div>
                </div>

                <div className="feature-item">
                  <div className="feature-icon">🏗️</div>
                  <div>
                    <div className="feature-title">Smart Tracking</div>
                    <div className="feature-desc">Manage vendors and materials</div>
                  </div>
                </div>

                <div className="feature-item">
                  <div className="feature-icon">🔒</div>
                  <div>
                    <div className="feature-title">Secure Access</div>
                    <div className="feature-desc">Protected project dashboard</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="login-modern-card">
            <div className="login-logo">🏠</div>
            <h1 className="welcome-title">Welcome Back</h1>
            <p className="welcome-sub">Login to your BuildNest account</p>

            <input
              className="modern-input"
              placeholder="Enter your name"
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && loginName.trim()) {
                  localStorage.setItem('user', loginName);
                  setUser(loginName);
                }
              }}
            />

            <button
              className="modern-login-btn"
              onClick={() => {
                if (loginName.trim()) {
                  localStorage.setItem('user', loginName);
                  setUser(loginName);
                }
              }}
            >
              Enter Dashboard →
            </button>

            <div className="secure-box">
              🔐 Secure access to your construction dashboard
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================= */
  /* 2. MAIN DASHBOARD CONTENT VIEW PANEL     */
  /* ========================================= */
  return (
    <div className="dashboard-bg">
      <div className="container">
        
        {/* HEADER BLOCK */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
            <h1 style={{ fontSize: '38px', fontWeight: '800', margin: 0, color: '#0f172a' }}>Expense Dashboard</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span className="user-badge">👤 {user}</span>
              <button onClick={() => { localStorage.clear(); setUser(''); }} className="btn-delete" style={{ padding: '8px 15px' }}>Logout</button>
            </div>
        </div>

        {/* CUMULATIVE PROJECT BUDGET BANNER */}
        <div className="dashboard-card" style={{ marginBottom: 25, borderTop: '4px solid #16a34a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong style={{ fontSize: '16px', color: '#0f172a' }}>Project Budget Progress</strong>
            <strong style={{ color: '#16a34a' }}>{Math.round((totalProjectSpent / PROJECT_TOTAL_BUDGET) * 100)}%</strong>
          </div>
          <div className="progress-bg">
            <div className="progress-bar" style={{ width: `${Math.min((totalProjectSpent / PROJECT_TOTAL_BUDGET) * 100, 100)}%` }} />
          </div>
          <div className="muted" style={{ marginTop: 8 }}>Spent: {formatINR(totalProjectSpent)} / {formatINR(PROJECT_TOTAL_BUDGET)}</div>
        </div>

        {/* BALANCED CONFIG ROW: GAUGE & VIEW FILTERS */}
        <div className="dashboard-row">
          <div className="dashboard-card metric-item" style={{ textAlign: 'center' }}>
            <div className="muted">Monthly Budget Spent</div>
            <CircularGauge percent={Math.min(Math.round((currentViewTotal / MONTH_BUDGET) * 100), 100)} />
            <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{formatINR(currentViewTotal)} / {formatINR(MONTH_BUDGET)}</div>
          </div>

          <div className="dashboard-card filters-item">
            <h3 className="section-title" style={{ marginBottom: 12 }}>View Filters</h3>
            <div style={{ display: 'flex', gap: 12 }}>
              <select className="select-style" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                <option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option><option value="2027">2027</option>
              </select>
              <select className="select-style" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                <option value="">Full Year</option>
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                  <option key={i} value={(i + 1).toString().padStart(2, '0')}>{m}</option>
                ))}
              </select>
            </div>
            <input className="search-input" placeholder="🔍 Search vendor, material or category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {/* CONDITIONAL ADD ENTRY GRID INTERFACE */}
        {canEdit && (
          <div className="dashboard-card" style={{ marginBottom: 30, borderLeft: '5px solid #16a34a' }}>
            <h3 className="section-title">{editing ? '📝 Edit Entry' : '➕ Add Expense'}</h3>
            <div className="form-grid">
              
              <div className="input-group">
                <label className="label-style">Date & Year</label>
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="form-input" />
              </div>

              <div className="input-group">
                <label className="label-style">Vendor / Payee</label>
                <input className="form-input" placeholder="Shop/Supplier Name" value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})} />
              </div>
              
              <div className="input-group">
                <label className="label-style">Qty</label>
                <input className="form-input" placeholder="0" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
              </div>
              
              <div className="input-group">
                <label className="label-style">Unit</label>
                <select className="form-input" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                  <option value="Units" hidden>Units (Default)</option>
                  <option>Ton</option><option>Load</option><option>Bags</option><option>Kg</option><option>CFT</option><option>Sqft</option>
                </select>
              </div>

              <div className="input-group">
                <label className="label-style">Category</label>
                <select className="form-input" value={form.category} onChange={e => {
                    const opt = e.target.selectedOptions[0];
                    setForm({...form, category: e.target.value, group: opt ? opt.dataset.group : ''})
                }}>
                  <option value="">Select Category</option>
                  {Object.entries(categories).map(([g, items]) => (
                    <optgroup key={g} label={g}>{items.map(c => <option key={c._id} value={c.name} data-group={g}>{c.name}</option>)}</optgroup>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="label-style">Amount</label>
                <input className="form-input" type="number" placeholder="₹" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
              </div>

              <div className="input-group wide-input">
                <label className="label-style">Notes</label>
                <input className="form-input" placeholder="Reference details..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>

              <div className="input-group full-width-input">
                <label className="label-style">Attach Bill Image</label>
                <input type="file" onChange={e => setForm({...form, Image: e.target.files[0]})} style={{ display: 'block', marginTop: 8 }} />
              </div>

              <div className="form-actions-row">
                {editing && <button onClick={resetForm} className="clear-btn">Cancel</button>}
                <button className="btn-add" style={{ height: '48px', width: '140px', fontSize: '15px' }} onClick={submit}>{editing ? 'Update' : 'Add'}</button>
              </div>
            </div>
          </div>
        )}

        {/* RUNTIME CATEGORY EXPENDITURES DISPLAY */}
        <div style={{ marginBottom: 40 }}>
          <h3 className="section-title">Category Wise Expenses</h3>
          <div className="category-grid">
            {Object.entries(categorySummary).map(([group, total]) => (
              <div key={group} className="category-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontWeight: '700', color: '#1e293b' }}>{CATEGORY_ICONS[group] || '📦'} {group}</span>
                  <span style={{ fontWeight: '700', color: '#0f172a' }}>{formatINR(total)}</span>
                </div>
                <div className="cat-progress-bg">
                  <div className="cat-progress-bar" style={{ width: `${(total / maxCategorySpent) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LOGGED TRANSACTIONS METRICS LEDGER */}
        <div className="dashboard-card" style={{ padding: '10px 0px' }}>
          <h3 className="section-title" style={{ padding: '14px 24px 4px' }}>Recent Transactions</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="expense-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Vendor</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Amount</th>
                  <th>Notes</th>
                  <th>Bill</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map(e => (
                  <tr key={e._id}>
                    <td>{new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                    <td>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>{e.group}</div>
                        <strong style={{ color: '#0f172a' }}>{e.category}</strong>
                    </td>
                    <td style={{ color: '#475569', fontWeight: '500' }}>{e.vendor || '—'}</td>
                    <td>{e.quantity || '0'}</td>
                    <td style={{ color: '#64748b' }}>{e.unit || '—'}</td>
                    <td><strong style={{ color: '#0f172a' }}>{formatINR(e.amount)}</strong></td>
                    <td style={{ color: '#64748b', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}> {e.notes || '—'} </td>
                    <td>
                        {getImageUrl(e.Image) ? 
                            <img src={getImageUrl(e.Image)} onClick={() => setPreviewImage(getImageUrl(e.Image))} style={{ width: 40, height: 40, cursor: 'pointer', borderRadius: 8, objectFit: 'cover', border: '1px solid #e2e8f0' }} alt="bill" /> 
                        : '—'}
                    </td>
                    <td>
                      {canEdit && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn-add" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => {
                              setEditing(e); 
                              setForm({...e, date: e.date ? e.date.split('T')[0] : getToday(), Image: null}); 
                              window.scrollTo({top: 0, behavior: 'smooth'})
                          }}>Edit</button>
                          <button className="btn-delete" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => remove(e._id)}>Del</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BILL PREVIEW FULL OVERLAY MODAL */}
        {previewImage && <div className="overlay-view" onClick={() => setPreviewImage(null)}><img src={previewImage} className="preview-img-tag" alt="Preview" /></div>}
      </div>
    </div>
  );
}

const CircularGauge = ({ percent }) => (
  <div style={{ width: 100, height: 100, borderRadius: '50%', background: `conic-gradient(#16a34a ${percent}%, #f1f5f9 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '16px auto' }}>
    <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '16px', color: '#0f172a' }}>{percent}%</div>
  </div>
);

export default App;