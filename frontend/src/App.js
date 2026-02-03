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
  
  // FILTERS
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [searchTerm, setSearchTerm] = useState('');
  
  // UI STATE
  const [editing, setEditing] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const getToday = () => new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    date: getToday(),
    quantity: '', unit: 'Ton', category: '', group: '', amount: '', notes: '', vendor: '', Image: null,
  });

  const canEdit = EDIT_USERS.includes(user.toLowerCase());

  useEffect(() => {
    loadCategories(); loadExpenses();
  }, []);

  const loadCategories = async () => {
    const res = await axios.get(`${API}/categories`);
    setCategories(res.data || {});
  };

  const loadExpenses = async () => {
    const res = await axios.get(`${API}/expenses`);
    setExpenses(res.data);
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ 
      date: getToday(), quantity: '', unit: 'Ton', category: '', 
      group: '', amount: '', notes: '', vendor: '', Image: null 
    });
  };

  const submit = async () => {
    if (!canEdit) return alert('Read-only access');
    if (!form.vendor) return alert('Please enter Vendor/Payee name');

    const fd = new FormData();
    fd.append('date', form.date);
    fd.append('quantity', form.quantity);
    fd.append('unit', form.unit);
    fd.append('category', form.category);
    fd.append('group', form.group);
    fd.append('amount', form.amount);
    fd.append('vendor', form.vendor);
    fd.append('notes', form.notes);
    if (form.Image) fd.append('Image', form.Image);

    try {
      if (editing) {
        const res = await axios.put(`${API}/expenses/${editing._id}`, fd);
        setExpenses(p => p.map(e => e._id === editing._id ? res.data : e));
      } else {
        const res = await axios.post(`${API}/expenses`, fd);
        setExpenses(p => [res.data, ...p]);
      }
      resetForm();
    } catch (err) {
      alert("Error saving record");
    }
  };

  const remove = async (id) => {
    if (!canEdit || !window.confirm('Delete record?')) return;
    await axios.delete(`${API}/expenses/${id}`);
    setExpenses(p => p.filter(e => e._id !== id));
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
  const categoryTotals = filteredExpenses.reduce((a, e) => { a[e.group] = (a[e.group] || 0) + Number(e.amount || 0); return a; }, {});
  const maxCategory = Math.max(...Object.values(categoryTotals), 1);

  if (!user) {
    return (
      <div style={loginOverlay}>
        <div style={loginCard}>
          <h2 style={{ color: '#2c3e50' }}>🏗️ BuildTrack AI</h2>
          <input style={loginInput} placeholder="Your Name" value={loginName} onChange={(e) => setLoginName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && loginName && setUser(loginName)} />
          <button style={loginBtn} onClick={() => { if(loginName) { localStorage.setItem('user', loginName); setUser(loginName); }}}>Access Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div style={mainBg}>
      <div className="container">
        {/* BUDGET HEADER */}
        <div style={{ ...card, marginBottom: 20, borderTop: '4px solid #28a745' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <strong>Total Construction Budget Usage</strong>
            <strong>{Math.round((totalProjectSpent / PROJECT_TOTAL_BUDGET) * 100)}%</strong>
          </div>
          <div style={progressBg}><div style={{ ...progressBar, width: `${(totalProjectSpent / PROJECT_TOTAL_BUDGET) * 100}%` }} /></div>
          <div style={{ ...muted, marginTop: 5 }}>Overall: {formatINR(totalProjectSpent)} / {formatINR(PROJECT_TOTAL_BUDGET)}</div>
        </div>

        {/* FILTERS */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 25 }}>
          <div style={{ ...card, flex: 1, textAlign: 'center' }}>
            <div style={muted}>Filter Total</div>
            <CircularGauge percent={Math.min(Math.round((currentViewTotal / MONTH_BUDGET) * 100), 100)} />
            <div style={{ fontWeight: 'bold' }}>{formatINR(currentViewTotal)}</div>
          </div>
          <div style={{ ...card, flex: 2 }}>
            <h3>Search & Filters</h3>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <select style={selectStyle} value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                <option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option>
              </select>
              <select style={selectStyle} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                <option value="">All Months</option>
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                  <option key={i} value={(i + 1).toString().padStart(2, '0')}>{m}</option>
                ))}
              </select>
            </div>
            <input style={searchInput} placeholder="🔍 Filter by Vendor or Material..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {/* ENTRY FORM */}
        {canEdit && (
          <div style={{ ...card, marginBottom: 25, background: '#f8f9fa' }}>
            <h3>{editing ? '📝 Edit Transaction' : '➕ New Entry'}</h3>
            <div className="form-row">
              <div style={inputGroup}><label style={labelStyle}>Date</label>
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
              </div>
              <div style={inputGroup}><label style={labelStyle}>Vendor</label>
                <input placeholder="Shop Name" value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})} />
              </div>
              <div style={inputGroup}><label style={labelStyle}>Qty</label>
                <input placeholder="0" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
              </div>
              <div style={inputGroup}><label style={labelStyle}>Unit</label>
                <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                  <option>Ton</option><option>Load</option><option>Bags</option><option>Kg</option><option>CFT</option><option>Sqft</option><option>Units</option>
                </select>
              </div>
            </div>
            <div className="form-row" style={{ marginTop: 15 }}>
              <div style={inputGroup}><label style={labelStyle}>Category</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value, group: e.target.selectedOptions[0].dataset.group})}>
                  <option value="">Select Category</option>
                  {Object.entries(categories).map(([g, items]) => (
                    <optgroup key={g} label={g}>{items.map(c => <option key={c._id} value={c.name} data-group={g}>{c.name}</option>)}</optgroup>
                  ))}
                </select>
              </div>
              <div style={inputGroup}><label style={labelStyle}>Amount</label>
                <input type="number" placeholder="₹" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
              </div>
              <div style={{ ...inputGroup, flex: 2 }}><label style={labelStyle}>Notes</label>
                <input placeholder="Payment details..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              <div style={inputGroup}><label style={labelStyle}>Bill</label>
                <input type="file" onChange={e => setForm({...form, Image: e.target.files[0]})} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                <button className="btn-add" style={{ height: '40px' }} onClick={submit}>Save</button>
                {editing && <button onClick={resetForm} style={clearBtn}>Cancel</button>}
              </div>
            </div>
          </div>
        )}

        {/* CATEGORY CARDS */}
        <div style={grid}>
          {Object.entries(categoryTotals).map(([g, amt]) => (
            <div key={g} style={{ ...card, cursor: 'pointer', borderLeft: '4px solid #28a745' }} onClick={() => setSearchTerm(g)}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{CATEGORY_ICONS[g] || '📦'} {g}</span>
                <strong>{formatINR(amt)}</strong>
              </div>
              <div style={progressBg}><div style={{ ...progressBar, width: `${(amt / maxCategory) * 100}%` }} /></div>
            </div>
          ))}
        </div>

        {/* DATA TABLE */}
        <h3 style={{ marginTop: 40, marginBottom: 15 }}>Expense Log</h3>
        <table className="expense-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Vendor</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Amount</th>
              <th>Bill</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map(e => {
              const img = getImageUrl(e.Image);
              return (
                <tr key={e._id}>
                  <td>{new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                  <td>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>{e.group}</div>
                    <strong>{e.category}</strong>
                  </td>
                  <td style={{ color: '#28a745', fontWeight: '500' }}>{e.vendor}</td>
                  <td>{e.quantity}</td>
                  <td style={{ color: '#64748b' }}>{e.unit}</td>
                  <td><strong>{formatINR(e.amount)}</strong></td>
                  <td>{img ? <img src={img} className="bill-thumb" onClick={() => setPreviewImage(img)} style={{ width: 30, height: 30, cursor: 'pointer', borderRadius: 4 }} alt="bill" /> : '—'}</td>
                  <td>
                    {canEdit && (
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="btn-add" onClick={() => {setEditing(e); setForm({...e, date: e.date.split('T')[0], Image: null}); window.scrollTo({top: 0, behavior: 'smooth'})}}>Edit</button>
                        <button className="btn-delete" onClick={() => remove(e._id)}>Del</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {previewImage && <div style={overlay} onClick={() => setPreviewImage(null)}><img src={previewImage} style={previewImg} alt="Preview" /></div>}
      </div>
    </div>
  );
}

// STYLES
const mainBg = { backgroundColor: '#f4f7f9', minHeight: '100vh', paddingBottom: '60px' };
const loginOverlay = { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2c3e50' };
const loginCard = { background: 'white', padding: '40px', borderRadius: '15px', textAlign: 'center' };
const loginInput = { width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #ddd' };
const loginBtn = { width: '100%', padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' };
const card = { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 };
const labelStyle = { fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' };
const muted = { fontSize: 12, color: '#777' };
const progressBg = { height: 8, background: '#e9ecef', borderRadius: 10, marginTop: 10 };
const progressBar = { height: '100%', background: '#28a745', borderRadius: 10 };
const searchInput = { padding: '10px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', width: '100%', marginTop: '10px' };
const selectStyle = { flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd' };
const clearBtn = { padding: '5px 10px', fontSize: 11, background: '#eee', border: 'none', borderRadius: 4, cursor: 'pointer' };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginTop: 10 };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const previewImg = { maxWidth: '90%', maxHeight: '90%', borderRadius: 8 };

const CircularGauge = ({ percent }) => (
  <div style={{ width: 80, height: 80, borderRadius: '50%', background: `conic-gradient(#28a745 ${percent}%, #e9ecef 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '10px auto' }}>
    <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{percent}%</div>
  </div>
);

export default App;