import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './App.css';

const API = '/api';

/* ===== PROJECT CONFIG ===== */
const PROJECT_BUDGET = 11200000;
const PROJECT_DURATION_MONTHS = 12;
const MONTH_BUDGET = Math.round(PROJECT_BUDGET / PROJECT_DURATION_MONTHS);

const EDIT_USERS = ['kaushik', 'shruthi'];

const CATEGORY_ICONS = {
  'Foundation & Structure': '🏗️',
  Masonry: '🧱',
  Roofing: '🏠',
  Plumbing: '🚰',
  Electrical: '💡',
  'Labor & Services': '👷',
  'Transport & Miscellaneous': '🚚',
  'Professional & Government': '📄',
  'Site Preparation': '🚜',
  'Carpentry & Wood Work': '🪚',
  'Metal & Fabrication': '🔩',
  'Exterior Works': '🌳',
};

const formatINR = (val) => 
  new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    maximumFractionDigits: 0 
  }).format(val);

function App() {
  const [user, setUser] = useState(localStorage.getItem('user') || '');
  const [loginName, setLoginName] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState({});
  const [selectedMonth, setSelectedMonth] = useState('');
  const [editing, setEditing] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState({
    quantity: '', category: '', group: '', amount: '', notes: '', Image: null,
  });

  const canEdit = EDIT_USERS.includes(user.toLowerCase());
  const roleLabel = canEdit ? 'Editor' : 'Viewer';

  useEffect(() => {
    loadCategories();
    loadExpenses();
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

  /* ===== PDF EXPORT LOGIC ===== */
  const exportPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Qty", "Category", "Group", "Amount", "Notes", "Date"];
    const tableRows = [];

    filteredExpenses.forEach(exp => {
      const expenseData = [
        exp.quantity,
        exp.category,
        exp.group,
        formatINR(exp.amount),
        exp.notes || '-',
        new Date(exp.date).toLocaleDateString('en-IN')
      ];
      tableRows.push(expenseData);
    });

    doc.setFontSize(18);
    doc.text("Construction Expense Report", 14, 15);
    doc.setFontSize(11);
    doc.text(`Project: Residential Building (G+3) | Month: ${selectedMonth}`, 14, 22);
    doc.text(`Total Spent: ${formatINR(monthlySpent)}`, 14, 28);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'striped',
      headStyles: { fillColor: [40, 167, 69] }
    });

    doc.save(`Expenses_${selectedMonth}.pdf`);
  };

  /* ===== DATA HANDLING ===== */
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
    setForm({ quantity: '', category: '', group: '', amount: '', notes: '', Image: null });
  };

  const remove = async (id) => {
    if (!canEdit || !window.confirm('Delete?')) return;
    await axios.delete(`${API}/expenses/${id}`);
    setExpenses(p => p.filter(e => e._id !== id));
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const d = new Date(e.date);
      const mMatch = selectedMonth ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === selectedMonth : true;
      const sMatch = e.category.toLowerCase().includes(searchTerm.toLowerCase()) || (e.notes && e.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      return mMatch && sMatch;
    });
  }, [expenses, selectedMonth, searchTerm]);

  const monthlySpent = filteredExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const monthlyPercent = Math.min(Math.round((monthlySpent / MONTH_BUDGET) * 100), 100);
  const categoryTotals = filteredExpenses.reduce((a, e) => { a[e.group] = (a[e.group] || 0) + Number(e.amount || 0); return a; }, {});
  const maxCategory = Math.max(...Object.values(categoryTotals), 1);

  /* ===== IMPROVED LOGIN SCREEN ===== */
  if (!user) {
    return (
      <div style={loginOverlay}>
        <div style={loginCard}>
          <h2 style={{ marginBottom: 10, color: '#333' }}>🏗️ BuildTrack AI</h2>
          <p style={{ color: '#666', marginBottom: 20 }}>Enter your name to access the dashboard</p>
          <input
            style={loginInput}
            placeholder="Username (e.g. Kaushik)"
            value={loginName}
            onChange={(e) => setLoginName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && loginName && setUser(loginName)}
          />
          <button style={loginBtn} onClick={() => { if(loginName) { localStorage.setItem('user', loginName); setUser(loginName); }}}>
            Enter Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Expense Dashboard</h1>
        <button onClick={exportPDF} style={pdfBtn}>📄 Export PDF</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
        <div>
          <strong>{user}</strong> <span style={{ ...roleBadge, background: canEdit ? '#28a745' : '#0d6efd' }}>{roleLabel}</span>
        </div>
        <button className="btn-delete" onClick={() => { localStorage.removeItem('user'); setUser(''); }}>Logout</button>
      </div>

      {/* SUMMARY BOXES */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div style={card}><h3>Residential Building</h3><div style={muted}>G+3 Construction</div></div>
        <div style={{ ...card, textAlign: 'center' }}>
          <div style={muted}>Monthly Budget</div>
          <CircularGauge percent={monthlyPercent} />
          <div style={muted}>{formatINR(monthlySpent)} / {formatINR(MONTH_BUDGET)}</div>
        </div>
      </div>

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ flex: 1 }}>
          {Array.from({ length: 12 }, (_, i) => {
            const d = new Date(new Date().getFullYear(), i);
            const val = `${d.getFullYear()}-${String(i + 1).padStart(2, '0')}`;
            return <option key={val} value={val}>{d.toLocaleString('default', { month: 'short', year: 'numeric' })}</option>;
          })}
        </select>
        <input style={{ flex: 2, padding: '8px' }} placeholder="🔍 Search expenses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {/* ADD FORM */}
      {canEdit && (
        <div style={{ ...card, marginBottom: 25 }}>
          <h3>{editing ? '📝 Edit Expense' : '➕ Add Expense'}</h3>
          <div className="form-row">
            <input placeholder="Qty" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value, group: e.target.selectedOptions[0].dataset.group})}>
              <option value="">Select Category</option>
              {Object.entries(categories).map(([g, items]) => (
                <optgroup key={g} label={g}>{items.map(c => <option key={c._id} value={c.name} data-group={g}>{c.name}</option>)}</optgroup>
              ))}
            </select>
            <input type="number" placeholder="Amount" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
            <input placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>
          <div className="form-row">
             <input type="file" onChange={e => setForm({...form, Image: e.target.files[0]})} />
             <button className="btn-add" onClick={submit}>{editing ? 'Update' : 'Add Expense'}</button>
          </div>
        </div>
      )}

      {/* CATEGORY PROGRESS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {Object.entries(categoryTotals).map(([g, amt]) => (
          <div key={g} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{CATEGORY_ICONS[g] || '📦'} {g}</span><strong>{formatINR(amt)}</strong></div>
            <div style={progressBg}><div style={{ ...progressBar, width: `${(amt / maxCategory) * 100}%` }} /></div>
          </div>
        ))}
      </div>

      {/* DATA TABLE */}
      <table className="expense-table" style={{ marginTop: 20 }}>
        <thead><tr><th>Qty</th><th>Category</th><th>Amount</th><th>Notes</th><th>Action</th></tr></thead>
        <tbody>
          {filteredExpenses.map(e => (
            <tr key={e._id}>
              <td>{e.quantity}</td>
              <td><div style={muted}>{e.group}</div><strong>{e.category}</strong></td>
              <td>{formatINR(e.amount)}</td>
              <td>{e.notes}</td>
              <td>
                {canEdit && <><button className="btn-add" onClick={() => {setEditing(e); setForm({ ...e, Image: null });}}>Edit</button> <button className="btn-delete" onClick={() => remove(e._id)}>Del</button></>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ===== STYLES ===== */
const loginOverlay = { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' };
const loginCard = { background: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center', width: '100%', maxWidth: '400px' };
const loginInput = { width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' };
const loginBtn = { width: '100%', padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const pdfBtn = { background: '#dc3545', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' };
const roleBadge = { padding: '2px 8px', borderRadius: 12, fontSize: 12, color: 'white' };
const card = { background: 'white', padding: 15, borderRadius: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const muted = { fontSize: 12, color: '#777' };
const progressBg = { height: 6, background: '#e9ecef', borderRadius: 4, marginTop: 6 };
const progressBar = { height: '100%', background: '#28a745', borderRadius: 4 };

const CircularGauge = ({ percent }) => (
  <div style={{ width: 100, height: 100, borderRadius: '50%', background: `conic-gradient(#28a745 ${percent}%, #e9ecef 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '10px auto' }}>
    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{percent}%</div>
  </div>
);

export default App;