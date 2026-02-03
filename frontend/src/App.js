import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import './App.css';

const API = 'http://localhost:5000/api';

/* ===== CONFIG & ICONS ===== */
const PROJECT_TOTAL_BUDGET = 11200000;
const MONTH_BUDGET = 700000; 
const EDIT_USERS = ['kaushik', 'shruthi'];

const CATEGORY_ICONS = {
  'Foundation & Structure': '🏗️',
  'Masonry': '🧱',
  'Roofing': '🏠',
  'Plumbing': '🚰',
  'Electrical': '💡',
  'Labor & Services': '👷',
  'Transport & Miscellaneous': '🚚',
  'Government Fees': '🏛️',
  'Architect Fees': '📐',
  'Borewell': '🕳️',
  'Site Preparation': '🚜',
  'Carpentry & Wood Work': '🪚',
  'Metal & Fabrication': '🔩',
  'Exterior Works': '🌳',
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
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [searchTerm, setSearchTerm] = useState('');
  
  // UI STATE
  const [editing, setEditing] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    quantity: '',
    unit: '', // Text input for flexibility
    category: '',
    group: '',
    amount: '',
    notes: '',
    Image: null,
  });

  const canEdit = EDIT_USERS.includes(user.toLowerCase());

  useEffect(() => {
    loadCategories();
    loadExpenses();
  }, []);

  const loadCategories = async () => {
    const res = await axios.get(`${API}/categories`);
    setCategories(res.data || {});
  };

  const loadExpenses = async () => {
    const res = await axios.get(`${API}/expenses`);
    setExpenses(res.data || []);
  };

  const handleYearShortcut = (year) => {
    const currentParts = form.date.split('-');
    setForm({ ...form, date: `${year}-${currentParts[1]}-${currentParts[2]}` });
  };

  const submit = async () => {
    if (!canEdit) return alert('Read-only access');
    if (!form.vendor || !form.amount) return alert('Vendor and Amount are required');

    const fd = new FormData();
    Object.keys(form).forEach(key => {
        if (key === 'Image' && form[key]) fd.append(key, form[key]);
        else if (key !== 'Image') fd.append(key, form[key]);
    });

    try {
      if (editing) {
        const res = await axios.put(`${API}/expenses/${editing._id}`, fd);
        setExpenses(prev => prev.map(e => e._id === editing._id ? res.data : e));
      } else {
        const res = await axios.post(`${API}/expenses`, fd);
        setExpenses(prev => [res.data, ...prev]);
      }
      setEditing(null);
      setForm({ ...form, vendor: '', quantity: '', unit: '', amount: '', notes: '', Image: null });
    } catch (err) {
      alert("Error saving record. Check Backend Console.");
    }
  };

  const totalProjectSpent = useMemo(() => expenses.reduce((s, e) => s + Number(e.amount || 0), 0), [expenses]);
  
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
        const d = new Date(e.date);
        const yMatch = d.getFullYear().toString() === selectedYear;
        const mMatch = selectedMonth ? (d.getMonth() + 1).toString().padStart(2, '0') === selectedMonth : true;
        const sMatch = [e.category, e.vendor, e.notes].some(f => f?.toLowerCase().includes(searchTerm.toLowerCase()));
        return yMatch && mMatch && sMatch;
    });
  }, [expenses, selectedYear, selectedMonth, searchTerm]);

  const categoryTotals = useMemo(() => {
    return filteredExpenses.reduce((a, e) => {
      a[e.group] = (a[e.group] || 0) + Number(e.amount || 0);
      return a;
    }, {});
  }, [filteredExpenses]);

  if (!user) {
    return (
      <div style={loginOverlay}>
        <div style={loginCard}>
          <h2>🏗️ BuildTrack AI</h2>
          <input style={loginInput} placeholder="Your Name" value={loginName} onChange={(e) => setLoginName(e.target.value)} />
          <button style={loginBtn} onClick={() => { localStorage.setItem('user', loginName); setUser(loginName); }}>Enter Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f4f7f9', minHeight: '100vh', padding: '20px' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* TOP STATS */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Total Construction Spent</strong>
            <strong>{formatINR(totalProjectSpent)} / {formatINR(PROJECT_TOTAL_BUDGET)}</strong>
          </div>
          <div style={progressBg}><div style={{ ...progressBar, width: `${(totalProjectSpent / PROJECT_TOTAL_BUDGET) * 100}%` }} /></div>
        </div>

        {/* FILTERS */}
        <div style={{ display: 'flex', gap: '15px', margin: '20px 0' }}>
            <select style={selectStyle} value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                <option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option>
            </select>
            <select style={selectStyle} value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
                <option value="">All Months</option>
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                    <option key={i} value={(i + 1).toString().padStart(2, '0')}>{m}</option>
                ))}
            </select>
            <input style={{ ...selectStyle, flex: 2 }} placeholder="🔍 Search vendor or material..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>

        {/* ADD FORM */}
        {canEdit && (
          <div style={{ ...card, background: '#fff', borderLeft: '5px solid #28a745' }}>
            <h3>{editing ? 'Edit Entry' : 'Add New Expense'}</h3>
            <div style={formGrid}>
              <div style={inputGroup}>
                <label>Date & Year</label>
                <div style={{ display: 'flex', gap: '5px' }}>
                    <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                    <select value={form.date.split('-')[0]} onChange={e => handleYearShortcut(e.target.value)}>
                        <option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option>
                    </select>
                </div>
              </div>
              <div style={inputGroup}><label>Vendor</label><input placeholder="Shop Name" value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})} /></div>
              <div style={inputGroup}><label>Qty</label><input type="number" placeholder="0" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} /></div>
              <div style={inputGroup}><label>Unit</label><input placeholder="e.g. Bags, Kg, CFT" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} /></div>
              
              <div style={inputGroup}><label>Category</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value, group: e.target.selectedOptions[0].dataset.group})}>
                  <option value="">Select Category</option>
                  {Object.entries(categories).map(([g, items]) => (
                    <optgroup key={g} label={g}>{items.map(c => <option key={c._id} value={c.name} data-group={g}>{c.name}</option>)}</optgroup>
                  ))}
                </select>
              </div>
              <div style={inputGroup}><label>Amount</label><input type="number" placeholder="₹" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} /></div>
              <div style={{ ...inputGroup, gridColumn: 'span 2' }}><label>Notes</label><input placeholder="Details..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
            </div>
            <button onClick={submit} className="btn-add" style={{ marginTop: '15px', width: '200px' }}>{editing ? 'Update' : 'Save Expense'}</button>
          </div>
        )}

        {/* CATEGORY SUMMARY */}
        <div style={gridSummary}>
          {Object.entries(categoryTotals).map(([group, amt]) => (
            <div key={group} style={summaryCard}>
              <span style={{ fontSize: '24px' }}>{CATEGORY_ICONS[group] || '📦'}</span>
              <div>
                <div style={{ fontSize: '12px', color: '#666' }}>{group}</div>
                <div style={{ fontWeight: 'bold' }}>{formatINR(amt)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* DATA TABLE */}
        <div style={{ ...card, marginTop: '30px', padding: '0' }}>
          <table className="expense-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Vendor</th>
                <th>Qty / Unit</th>
                <th>Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(e => (
                <tr key={e._id}>
                  <td>{new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td><small style={{ color: '#888' }}>{e.group}</small><br/><strong>{e.category}</strong></td>
                  <td style={{ color: '#28a745', fontWeight: 'bold' }}>{e.vendor}</td>
                  <td>{e.quantity} {e.unit}</td>
                  <td><strong>{formatINR(e.amount)}</strong></td>
                  <td>
                    <button onClick={() => { setEditing(e); setForm({...e, date: e.date.split('T')[0]}); window.scrollTo(0,0); }} className="btn-add">Edit</button>
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

/* ===== STYLES ===== */
const card = { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '20px' };
const formGrid = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginTop: '10px' };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '5px' };
const progressBg = { height: '10px', background: '#eee', borderRadius: '10px', marginTop: '10px' };
const progressBar = { height: '100%', background: '#28a745', borderRadius: '10px' };
const selectStyle = { padding: '10px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' };
const gridSummary = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', marginTop: '20px' };
const summaryCard = { background: 'white', padding: '15px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' };
const loginOverlay = { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2c3e50' };
const loginCard = { background: 'white', padding: '40px', borderRadius: '15px', textAlign: 'center' };
const loginInput = { width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #ddd' };
const loginBtn = { width: '100%', padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' };

export default App;