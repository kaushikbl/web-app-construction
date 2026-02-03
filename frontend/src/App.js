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
    unit: 'Units', // Default set to Units internally
    category: '', 
    group: '', 
    amount: '', 
    notes: '', 
    vendor: '', 
    Image: null,
  });

  const canEdit = EDIT_USERS.includes(user.toLowerCase());

  useEffect(() => {
    loadCategories(); loadExpenses();
  }, []);

  const loadCategories = async () => {
    try {
        const res = await axios.get(`${API}/categories`);
        setCategories(res.data || {});
    } catch (e) { console.error("Error loading categories"); }
  };

  const loadExpenses = async () => {
    try {
        const res = await axios.get(`${API}/expenses`);
        setExpenses(res.data || []);
    } catch (e) { console.error("Error loading expenses"); }
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

  const categorySummary = useMemo(() => {
    return filteredExpenses.reduce((acc, exp) => {
      const groupName = exp.group || "Other";
      acc[groupName] = (acc[groupName] || 0) + Number(exp.amount || 0);
      return acc;
    }, {});
  }, [filteredExpenses]);

  const maxCategorySpent = Math.max(...Object.values(categorySummary), 1);

  if (!user) {
    return (
      <div style={loginOverlay}>
        <div style={loginCard}>
          <h2>🏗️ BuildTrack AI</h2>
          <input style={loginInput} placeholder="Your Name" value={loginName} onChange={(e) => setLoginName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && loginName && setUser(loginName)} />
          <button style={loginBtn} onClick={() => { if(loginName) { localStorage.setItem('user', loginName); setUser(loginName); }}}>Enter</button>
        </div>
      </div>
    );
  }

  return (
    <div style={mainBg}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h1>Expense Dashboard</h1>
            <button onClick={() => { localStorage.clear(); setUser(''); }} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 15px', borderRadius: 5, cursor: 'pointer' }}>Logout</button>
        </div>

        <div style={{ ...card, marginBottom: 25, borderTop: '4px solid #28a745' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Project Budget Progress</strong>
            <strong>{Math.round((totalProjectSpent / PROJECT_TOTAL_BUDGET) * 100)}%</strong>
          </div>
          <div style={progressBg}><div style={{ ...progressBar, width: `${(totalProjectSpent / PROJECT_TOTAL_BUDGET) * 100}%` }} /></div>
          <div style={{ ...muted, marginTop: 5 }}>Spent: {formatINR(totalProjectSpent)} / {formatINR(PROJECT_TOTAL_BUDGET)}</div>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 25 }}>
          <div style={{ ...card, flex: 1, textAlign: 'center' }}>
            <div style={muted}>Monthly Budget Spent</div>
            <CircularGauge percent={Math.min(Math.round((currentViewTotal / MONTH_BUDGET) * 100), 100)} />
            <div style={{ fontWeight: 'bold' }}>{formatINR(currentViewTotal)} / {formatINR(MONTH_BUDGET)}</div>
          </div>
          <div style={{ ...card, flex: 2 }}>
            <h3>View Filters</h3>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <select style={selectStyle} value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                <option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option><option value="2027">2027</option>
              </select>
              <select style={selectStyle} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                <option value="">Full Year</option>
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                  <option key={i} value={(i + 1).toString().padStart(2, '0')}>{m}</option>
                ))}
              </select>
            </div>
            <input style={searchInput} placeholder="🔍 Search vendor, material or category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {canEdit && (
          <div style={{ ...card, marginBottom: 30, background: '#fff', borderLeft: '5px solid #28a745' }}>
            <h3>{editing ? '📝 Edit Entry' : '➕ Add Expense'}</h3>
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginTop: 15 }}>
              
              <div style={inputGroup}>
                <label style={labelStyle}>Date & Year</label>
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} style={formInput} />
              </div>

              <div style={inputGroup}><label style={labelStyle}>Vendor / Payee</label>
                <input style={formInput} placeholder="Shop/Supplier Name" value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})} />
              </div>
              
              <div style={inputGroup}><label style={labelStyle}>Qty</label>
                <input style={formInput} placeholder="0" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
              </div>
              
              <div style={inputGroup}><label style={labelStyle}>Unit</label>
                <select style={formInput} value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                  {/* Default Units remains active but removed from selection list */}
                  <option value="Units" hidden>Units (Default)</option>
                  <option>Ton</option><option>Load</option><option>Bags</option><option>Kg</option><option>CFT</option><option>Sqft</option>
                </select>
              </div>

              <div style={inputGroup}><label style={labelStyle}>Category</label>
                <select style={formInput} value={form.category} onChange={e => {
                    const opt = e.target.selectedOptions[0];
                    setForm({...form, category: e.target.value, group: opt.dataset.group})
                }}>
                  <option value="">Select Category</option>
                  {Object.entries(categories).map(([g, items]) => (
                    <optgroup key={g} label={g}>{items.map(c => <option key={c._id} value={c.name} data-group={g}>{c.name}</option>)}</optgroup>
                  ))}
                </select>
              </div>
              <div style={inputGroup}><label style={labelStyle}>Amount</label>
                <input style={formInput} type="number" placeholder="₹" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
              </div>
              <div style={{ ...inputGroup, gridColumn: 'span 2' }}><label style={labelStyle}>Notes</label>
                <input style={formInput} placeholder="Reference details..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              <div style={{ gridColumn: 'span 3' }}>
                <label style={labelStyle}>Attach Bill Image</label>
                <input type="file" onChange={e => setForm({...form, Image: e.target.files[0]})} style={{ display: 'block', marginTop: 5 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', gap: 10 }}>
                {editing && <button onClick={resetForm} style={{ ...clearBtn, height: '40px' }}>Cancel</button>}
                <button className="btn-add" style={{ height: '40px', width: '120px' }} onClick={submit}>{editing ? 'Update' : 'Add'}</button>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 40 }}>
          <h3 style={{ marginBottom: 15 }}>Category Wise Expenses</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {Object.entries(categorySummary).map(([group, total]) => (
              <div key={group} style={categoryCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 'bold' }}>{CATEGORY_ICONS[group] || '📦'} {group}</span>
                  <span style={{ fontWeight: 'bold' }}>{formatINR(total)}</span>
                </div>
                <div style={categoryProgressBg}>
                  <div style={{ ...categoryProgressBar, width: `${(total / maxCategorySpent) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={card}>
          <h3 style={{ marginBottom: 15 }}>Recent Transactions</h3>
          <table className="expense-table" style={{ width: '100%' }}>
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
              {filteredExpenses.map(e => (
                <tr key={e._id}>
                  <td>{new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                  <td>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>{e.group}</div>
                      <strong>{e.category}</strong>
                  </td>
                  <td style={{ color: '#475569' }}>{e.vendor || '—'}</td>
                  <td>{e.quantity || '0'}</td>
                  <td style={{ color: '#64748b' }}>{e.unit || '—'}</td>
                  <td><strong>{formatINR(e.amount)}</strong></td>
                  <td>
                      {getImageUrl(e.Image) ? 
                          <img src={getImageUrl(e.Image)} onClick={() => setPreviewImage(getImageUrl(e.Image))} style={{ width: 35, height: 35, cursor: 'pointer', borderRadius: 4, objectFit: 'cover' }} alt="bill" /> 
                      : '—'}
                  </td>
                  <td>
                    {canEdit && (
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="btn-add" style={{ padding: '4px 8px' }} onClick={() => {
                            setEditing(e); 
                            setForm({...e, date: e.date.split('T')[0], Image: null}); 
                            window.scrollTo({top: 0, behavior: 'smooth'})
                        }}>Edit</button>
                        <button className="btn-delete" style={{ padding: '4px 8px' }} onClick={() => remove(e._id)}>Del</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {previewImage && <div style={overlay} onClick={() => setPreviewImage(null)}><img src={previewImage} style={previewImg} alt="Preview" /></div>}
      </div>
    </div>
  );
}

const mainBg = { backgroundColor: '#f4f7f9', minHeight: '100vh', paddingBottom: '60px' };
const loginOverlay = { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2c3e50' };
const loginCard = { background: 'white', padding: '40px', borderRadius: '15px', textAlign: 'center' };
const loginInput = { width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #ddd' };
const loginBtn = { width: '100%', padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' };
const card = { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '5px' };
const labelStyle = { fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' };
const muted = { fontSize: 12, color: '#777' };
const progressBg = { height: 8, background: '#e9ecef', borderRadius: 10, marginTop: 10 };
const progressBar = { height: '100%', background: '#28a745', borderRadius: 10 };
const searchInput = { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', width: '100%', marginTop: '10px' };
const selectStyle = { flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd' };
const formInput = { padding: '10px', borderRadius: '4px', border: '1px solid #ddd', width: '100%' };
const clearBtn = { padding: '5px 15px', background: '#eee', border: 'none', borderRadius: 4, cursor: 'pointer' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const previewImg = { maxWidth: '90%', maxHeight: '90%', borderRadius: 8 };

const categoryCard = { background: 'white', padding: '15px 20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' };
const categoryProgressBg = { height: '6px', background: '#e9ecef', borderRadius: '10px', overflow: 'hidden' };
const categoryProgressBar = { height: '100%', background: '#28a745', borderRadius: '10px', transition: 'width 0.4s ease' };

const CircularGauge = ({ percent }) => (
  <div style={{ width: 80, height: 80, borderRadius: '50%', background: `conic-gradient(#28a745 ${percent}%, #e9ecef 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '10px auto' }}>
    <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{percent}%</div>
  </div>
);

export default App;