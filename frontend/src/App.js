import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import './App.css';

const API = '/api';

/* ===== PROJECT CONFIG ===== */
const PROJECT_TOTAL_BUDGET = 11200000;
const MONTH_BUDGET = Math.round(PROJECT_TOTAL_BUDGET / 12);
const EDIT_USERS = ['kaushik', 'shruthi'];

// Updated Icons to include your specific bifurcated entities
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
  const [selectedMonth, setSelectedMonth] = useState('');
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

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

  const resetForm = () => {
    setEditing(null);
    setForm({ 
      date: getToday(), quantity: '', unit: 'Units', category: '', 
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
      alert("Error saving expense");
    }
  };

  const remove = async (id) => {
    if (!canEdit || !window.confirm('Delete this record?')) return;
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
          <input style={loginInput} placeholder="Your Name" value={loginName} onChange={(e) => setLoginName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && loginName && setUser(loginName)} />
          <button style={loginBtn} onClick={() => { if(loginName) { localStorage.setItem('user', loginName); setUser(loginName); }}}>Access Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div style={mainBg}>
      <div className="container">
        {/* BUDGET PROGRESS */}
        <div style={{ ...card, marginBottom: 20, borderTop: '4px solid #28a745' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <strong>Project Budget (G+3)</strong>
            <strong>{Math.round((totalProjectSpent / PROJECT_TOTAL_BUDGET) * 100)}% Spent</strong>
          </div>
          <div style={progressBg}><div style={{ ...progressBar, width: `${(totalProjectSpent / PROJECT_TOTAL_BUDGET) * 100}%` }} /></div>
          <div style={{ ...muted, marginTop: 5 }}>Spent {formatINR(totalProjectSpent)} of {formatINR(PROJECT_TOTAL_BUDGET)}</div>
        </div>

        {/* FILTERS (2024-2026) */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 25 }}>
          <div style={{ ...card, flex: 1, textAlign: 'center' }}>
            <div style={muted}>Monthly Budget</div>
            <CircularGauge percent={Math.min(Math.round((monthlySpent / MONTH_BUDGET) * 100), 100)} />
            <div style={{ fontWeight: 'bold' }}>{formatINR(monthlySpent)}</div>
          </div>
          <div style={{ ...card, flex: 2 }}>
            <h3>View Filters</h3>
            <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ flex: 1 }}>
                {[2024, 2025, 2026].map(year => (
                  Array.from({ length: 12 }, (_, i) => {
                    const d = new Date(year, i);
                    const val = `${year}-${String(i + 1).padStart(2, '0')}`;
                    return <option key={val} value={val}>{d.toLocaleString('default', { month: 'short', year: 'numeric' })}</option>;
                  })
                ))}
              </select>
              <input style={searchInput} placeholder="🔍 Search records..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={() => {setSearchTerm(''); setSelectedMonth('');}} style={clearBtn}>Reset Filters</button>
          </div>
        </div>

        {/* ADD FORM */}
        {canEdit && (
          <div style={{ ...card, marginBottom: 25, background: '#f8f9fa' }}>
            <h3>{editing ? '📝 Edit Record' : '➕ Add Construction Expense'}</h3>
            <div className="form-row">
              <div style={inputGroup}><label style={labelStyle}>Date</label>
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
              </div>
              <div style={inputGroup}><label style={labelStyle}>Qty & Unit</label>
                <div style={{ display: 'flex', gap: 5 }}>
                  <input placeholder="Qty" style={{ width: '60px' }} value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
                  <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                    <option>Units</option><option>Bags</option><option>Kg</option><option>CFT</option><option>Load</option><option>Sqft</option>
                  </select>
                </div>
              </div>
              <div style={inputGroup}><label style={labelStyle}>Category</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value, group: e.target.selectedOptions[0].dataset.group})}>
                  <option value="">Select Material</option>
                  {Object.entries(categories).map(([g, items]) => (
                    <optgroup key={g} label={g}>{items.map(c => <option key={c._id} value={c.name} data-group={g}>{c.name}</option>)}</optgroup>
                  ))}
                </select>
              </div>
              <div style={inputGroup}><label style={labelStyle}>Vendor / Payee</label>
                <input placeholder="Who was paid?" value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})} />
              </div>
            </div>
            <div className="form-row" style={{ marginTop: 15 }}>
              <div style={{ ...inputGroup, flex: 1 }}><label style={labelStyle}>Amount</label>
                <input type="number" placeholder="₹" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
              </div>
              <div style={{ ...inputGroup, flex: 2 }}><label style={labelStyle}>Notes</label>
                <input placeholder="Additional details..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              <div style={inputGroup}><label style={labelStyle}>Attach Bill</label>
                <input type="file" onChange={e => setForm({...form, Image: e.target.files[0]})} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="btn-add" style={{ height: '40px' }} onClick={submit}>{editing ? 'Update' : 'Save Entry'}</button>
                {editing && <button onClick={resetForm} style={{ ...clearBtn, height: '40px', marginLeft: 10 }}>Cancel</button>}
              </div>
            </div>
          </div>
        )}

        {/* BIFURCATED CATEGORY CARDS */}
        <h3 style={{ marginBottom: 15 }}>Category Wise Expense</h3>
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

        {/* EXPENSE LOG TABLE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 15 }}>
            <h3>Recent Expense Log</h3>
            <span style={{ ...roleBadge, background: '#6c757d' }}>{filteredExpenses.length} Records</span>
        </div>
        
        <table className="expense-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Vendor</th>
              <th>Unit (Qty)</th>
              <th>Amount</th>
              <th>Notes</th>
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
                  <td style={{ minWidth: '160px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{e.group}</div>
                    <div style={{ fontWeight: 'bold' }}>{e.category}</div>
                  </td>
                  <td style={{ color: '#28a745', fontWeight: '500' }}>{e.vendor}</td>
                  <td style={{ fontWeight: '600' }}>{e.quantity} <span style={{ fontSize: '11px', color: '#64748b' }}>{e.unit}</span></td>
                  <td style={{ fontWeight: 'bold' }}>{formatINR(e.amount)}</td>
                  <td style={muted}>{e.notes || '—'}</td>
                  <td>{img ? <img src={img} className="bill-thumb" onClick={() => setPreviewImage(img)} style={{ width: 30, height: 30, cursor: 'pointer', borderRadius: 4 }} alt="bill" /> : '—'}</td>
                  <td>
                    {canEdit && (
                      <div style={{ display: 'flex', gap: '5px' }}>
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

        {/* SUMMARY FOOTER */}
        <div style={{ marginTop: 10, padding: 15, background: '#fff', borderRadius: 8, textAlign: 'right', border: '1px solid #eee' }}>
            <span style={muted}>Total View Amount: </span>
            <strong style={{ fontSize: 18 }}>{formatINR(monthlySpent)}</strong>
        </div>

        {previewImage && <div style={overlay} onClick={() => setPreviewImage(null)}><img src={previewImage} style={previewImg} alt="Preview" /></div>}
      </div>
    </div>
  );
}

const mainBg = { backgroundColor: '#f4f7f9', minHeight: '100vh', paddingBottom: '60px' };
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
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const previewImg = { maxWidth: '90%', maxHeight: '90%', borderRadius: 8 };

const CircularGauge = ({ percent }) => (
  <div style={{ width: 80, height: 80, borderRadius: '50%', background: `conic-gradient(#28a745 ${percent}%, #e9ecef 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '10px auto' }}>
    <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>{percent}%</div>
  </div>
);

export default App;