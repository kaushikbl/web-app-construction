import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import './App.css'; // Your shared CSS file

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editing, setEditing] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const getToday = () => new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    date: getToday(),
    category: '', 
    group: '', 
    amount: '', 
    vendor: '', 
    quantity: '1',
    notes: '',
    Image: null,
  });

  const canEdit = EDIT_USERS.includes(user.toLowerCase());

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [catRes, expRes] = await Promise.all([
        axios.get(`${API}/categories`),
        axios.get(`${API}/expenses`)
      ]);
      setCategories(catRes.data || {});
      setExpenses(expRes.data || []);
    } catch (e) {
      setError("Sync Error: Could not connect to database.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const resetForm = () => {
    setEditing(null);
    setForm({ date: getToday(), category: '', group: '', amount: '', vendor: '', quantity: '1', notes: '', Image: null });
  };

  const submit = async () => {
    if (!canEdit) return alert('Read-only access');
    const amt = Number(form.amount);
    if (!form.vendor || !form.category || isNaN(amt) || amt <= 0) return alert('Valid Vendor, Category, and Amount required');

    const fd = new FormData();
    Object.keys(form).forEach(key => {
      if (key === 'Image' && form[key]) fd.append('Image', form[key]);
      else if (form[key] !== null) fd.append(key, form[key]);
    });

    try {
      setLoading(true);
      if (editing) {
        const res = await axios.put(`${API}/expenses/${editing._id}`, fd);
        setExpenses(p => p.map(e => e._id === editing._id ? res.data : e));
      } else {
        const res = await axios.post(`${API}/expenses`, fd);
        setExpenses(p => [res.data, ...p]);
      }
      resetForm();
    } catch (err) {
      alert("Error saving record.");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    if (!canEdit || !window.confirm('Delete record?')) return;
    try {
      await axios.delete(`${API}/expenses/${id}`);
      setExpenses(p => p.filter(e => e._id !== id));
    } catch (err) { alert("Delete failed."); }
  };

  // Memoized Totals
  const totalProjectSpent = useMemo(() => expenses.reduce((s, e) => s + Number(e.amount || 0), 0), [expenses]);
  
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        const d = new Date(e.date);
        const yearMatch = selectedYear ? d.getFullYear().toString() === selectedYear : true;
        const monthMatch = selectedMonth ? (d.getMonth() + 1).toString().padStart(2, '0') === selectedMonth : true;
        const sMatch = [e.category, e.group, e.vendor].some(f => f?.toLowerCase().includes(searchTerm.toLowerCase()));
        return yearMatch && monthMatch && sMatch;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [expenses, selectedYear, selectedMonth, searchTerm]);

  const currentViewTotal = filteredExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  const categorySummary = useMemo(() => {
    return filteredExpenses.reduce((acc, exp) => {
      const g = exp.group || "Other";
      acc[g] = (acc[g] || 0) + Number(exp.amount || 0);
      return acc;
    }, {});
  }, [filteredExpenses]);

  const maxSpent = Math.max(...Object.values(categorySummary), 1);

  if (!user) return <LoginScreen loginName={loginName} setLoginName={setLoginName} onLogin={() => { if(loginName.trim()){ localStorage.setItem('user', loginName); setUser(loginName); }}} />;

  return (
    <div className="dashboard-bg">
      <div className="container">
        
        {/* TOP BAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 className="brand-title">BuildNest Dashboard</h1>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            {loading && <span className="muted">Syncing...</span>}
            <span className="user-badge">👤 {user}</span>
            <button onClick={() => { localStorage.clear(); setUser(''); }} className="btn-delete">Logout</button>
          </div>
        </div>

        {/* PROGRESS BLOCK */}
        <div className="dashboard-card" style={{ marginBottom: '25px', borderTop: '4px solid #16a34a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span>Total Project Budget Status</span>
            <span style={{ color: '#16a34a' }}>{Math.round((totalProjectSpent / PROJECT_TOTAL_BUDGET) * 100)}%</span>
          </div>
          <div className="progress-bg">
            <div className="progress-bar" style={{ width: `${(totalProjectSpent / PROJECT_TOTAL_BUDGET) * 100}%` }} />
          </div>
          <div className="muted" style={{ marginTop: '10px' }}>{formatINR(totalProjectSpent)} / {formatINR(PROJECT_TOTAL_BUDGET)}</div>
        </div>

        <div className="dashboard-row">
          <div className="dashboard-card metric-item">
            <div className="label-style">Monthly Burn Rate</div>
            <h2 style={{ margin: '15px 0' }}>{formatINR(currentViewTotal)}</h2>
            <div className="cat-progress-bg">
               <div className="cat-progress-bar" style={{ width: `${Math.min((currentViewTotal / MONTH_BUDGET) * 100, 100)}%`, background: '#f59e0b' }} />
            </div>
            <div className="muted" style={{ marginTop: '8px' }}>Target: {formatINR(MONTH_BUDGET)}</div>
          </div>

          <div className="dashboard-card filters-item">
            <div className="label-style">Reporting Filters</div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <select className="select-style" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                <option value="2024">2024</option><option value="2025">2025</option>
              </select>
              <select className="select-style" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
                <option value="">Whole Year</option>
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                  <option key={i} value={(i + 1).toString().padStart(2, '0')}>{m}</option>
                ))}
              </select>
            </div>
            <input className="search-input" placeholder="Search transactions..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {/* DATA ENTRY FORM */}
        {canEdit && (
          <div className="dashboard-card" style={{ marginBottom: '25px' }}>
            <div className="section-title">{editing ? 'Edit Record' : 'Log New Expense'}</div>
            <div className="form-grid">
              <div className="input-group">
                <label className="label-style">Date</label>
                <input type="date" className="form-input" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="label-style">Vendor / Payee</label>
                <input className="form-input" value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="label-style">Category</label>
                <select className="form-input" value={form.category} onChange={e => {
                   const opt = e.target.selectedOptions[0];
                   setForm({...form, category: e.target.value, group: opt?.dataset.group || ''});
                }}>
                  <option value="">Select Category</option>
                  {Object.entries(categories).map(([g, items]) => (
                    <optgroup key={g} label={g}>{items.map(c => <option key={c._id} value={c.name} data-group={g}>{c.name}</option>)}</optgroup>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label className="label-style">Amount (₹)</label>
                <input type="number" className="form-input" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
              </div>
              <div className="input-group wide-input">
                <label className="label-style">Notes / Description</label>
                <input className="form-input" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              <div className="form-actions-row">
                {editing && <button className="clear-btn" onClick={resetForm}>Cancel</button>}
                <button className="btn-add" style={{ height: '48px', padding: '0 30px' }} onClick={submit}>{editing ? 'Update' : 'Post Transaction'}</button>
              </div>
            </div>
          </div>
        )}

        {/* LEDGER & CATEGORIES */}
        <div className="category-grid" style={{ marginBottom: '25px' }}>
           {Object.entries(categorySummary).map(([group, total]) => (
              <div key={group} className="category-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span>{CATEGORY_ICONS[group] || '📦'} {group}</span>
                  <strong>{formatINR(total)}</strong>
                </div>
                <div className="cat-progress-bg">
                  <div className="cat-progress-bar" style={{ width: `${(total/maxSpent)*100}%` }} />
                </div>
              </div>
           ))}
        </div>

        <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="expense-table">
            <thead>
              <tr>
                <th>Date</th><th>Description</th><th>Category</th><th>Amount</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(e => (
                <tr key={e._id}>
                  <td className="muted">{new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                  <td><strong>{e.vendor}</strong><br/><span className="muted">{e.notes}</span></td>
                  <td><span className="user-badge" style={{ background: '#f1f5f9' }}>{e.category}</span></td>
                  <td><strong>{formatINR(e.amount)}</strong></td>
                  <td>
                    {canEdit && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-add" style={{ background: '#f1f5f9', color: '#1e293b' }} onClick={() => {
                          setEditing(e);
                          setForm({...e, date: e.date.split('T')[0], Image: null});
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}>Edit</button>
                        <button className="btn-delete" onClick={() => remove(e._id)}>Del</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

const LoginScreen = ({ loginName, setLoginName, onLogin }) => (
  <div className="modern-login-wrapper">
    <div className="left-panel">
      <div>
        <div className="brand-section">
          <div className="logo-box">🏗️</div>
          <div>
            <h1 className="brand-title" style={{ color: 'white' }}>BuildNest</h1>
            <div className="brand-sub">Infrastructure Management</div>
          </div>
        </div>
        <div style={{ marginTop: '80px' }}>
          <h2 className="hero-title">Track every brick and rupee.</h2>
          <p className="hero-text">Real-time expenditure tracking for high-budget construction projects.</p>
        </div>
      </div>
    </div>
    <div className="right-panel">
      <div className="login-modern-card">
        <div className="login-logo">👷</div>
        <h2 className="welcome-title">Welcome Back</h2>
        <p className="welcome-sub">Enter your name to access the ledger</p>
        <input className="modern-input" placeholder="User Name" value={loginName} onChange={e => setLoginName(e.target.value)} onKeyPress={e => e.key === 'Enter' && onLogin()} />
        <button className="modern-login-btn" onClick={onLogin}>Sign In to Dashboard</button>
        <div className="secure-box">🔒 Read-only access for unauthorized users.</div>
      </div>
    </div>
  </div>
);

export default App;