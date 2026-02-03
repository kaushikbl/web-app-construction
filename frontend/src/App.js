import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const API = '/api';

/* ===== PROJECT CONFIG ===== */
const PROJECT_BUDGET = 11200000;
const PROJECT_DURATION_MONTHS = 12;
const MONTH_BUDGET = Math.round(PROJECT_BUDGET / PROJECT_DURATION_MONTHS);

/* ===== ALLOWED EDITORS ===== */
const EDITORS = ['kaushik', 'shruthi'];

/* ===== CATEGORY ICONS ===== */
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
};

function App() {
  /* ===== LOGIN ===== */
  const [user, setUser] = useState(localStorage.getItem('user') || '');
  const isEditor = EDITORS.includes(user.toLowerCase());

  /* ===== STATE ===== */
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState({});
  const [selectedMonth, setSelectedMonth] = useState('');
  const [editing, setEditing] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const [form, setForm] = useState({
    quantity: '',
    category: '',
    group: '',
    amount: '',
    notes: '',
    Image: null,
  });

  /* ===== LOAD DATA ===== */
  useEffect(() => {
    loadCategories();
    loadExpenses();

    // auto-select current month
    const d = new Date();
    setSelectedMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    );
  }, []);

  const loadCategories = async () => {
    const res = await axios.get(`${API}/categories`);
    setCategories(res.data || {});
  };

  const loadExpenses = async () => {
    const res = await axios.get(`${API}/expenses`);
    setExpenses(res.data);
  };

  /* ===== IMAGE FIX ===== */
  const getImageUrl = (img) => {
    if (!img) return null;
    if (img.includes('/uploads/')) {
      return img.substring(img.indexOf('/uploads/'));
    }
    return img;
  };

  /* ===== ADD / UPDATE ===== */
  const submit = async () => {
    if (!isEditor) return alert('Read-only access');

    if (!form.quantity || !form.category || !form.group || !form.amount) {
      alert('Please fill required fields');
      return;
    }

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));

    const res = editing
      ? await axios.put(`${API}/expenses/${editing._id}`, fd)
      : await axios.post(`${API}/expenses`, fd);

    setExpenses((p) =>
      editing
        ? p.map((e) => (e._id === editing._id ? res.data : e))
        : [res.data, ...p]
    );

    setEditing(null);
    resetForm();
  };

  const editExpense = (e) => {
    if (!isEditor) return;
    setEditing(e);
    setForm({ ...e, Image: null });
  };

  const resetForm = () => {
    setForm({
      quantity: '',
      category: '',
      group: '',
      amount: '',
      notes: '',
      Image: null,
    });
  };

  const remove = async (id) => {
    if (!isEditor) return alert('Read-only access');
    if (!window.confirm('Delete expense?')) return;
    await axios.delete(`${API}/expenses/${id}`);
    setExpenses((p) => p.filter((e) => e._id !== id));
  };

  /* ===== ALL 12 MONTHS (FIXED) ===== */
  const year = new Date().getFullYear();
  const months = Array.from({ length: 12 }, (_, i) =>
    `${year}-${String(i + 1).padStart(2, '0')}`
  );

  /* ===== MONTH FILTER ===== */
  const filteredExpenses = selectedMonth
    ? expenses.filter((e) => {
        const d = new Date(e.date);
        return (
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` ===
          selectedMonth
        );
      })
    : expenses;

  /* ===== METRICS ===== */
  const monthlySpent = filteredExpenses.reduce(
    (s, e) => s + Number(e.amount || 0),
    0
  );

  const monthlyPercent = Math.min(
    Math.round((monthlySpent / MONTH_BUDGET) * 100),
    100
  );

  const categoryTotals = filteredExpenses.reduce((a, e) => {
    a[e.group] = (a[e.group] || 0) + Number(e.amount || 0);
    return a;
  }, {});

  const maxCategory = Math.max(...Object.values(categoryTotals), 1);

  /* ===== LOGIN SCREEN ===== */
  if (!user) {
    return (
      <div className="container" style={{ maxWidth: 400 }}>
        <h2>Login</h2>
        <input
          placeholder="Enter your name"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              localStorage.setItem('user', e.target.value);
              setUser(e.target.value);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="container">
      {/* ===== HEADER BAR (LOGOUT FIXED) ===== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
      }}>
        <h1>Expense Dashboard</h1>

        <button
          className="btn-delete"
          onClick={() => {
            localStorage.removeItem('user');
            setUser('');
          }}
        >
          Logout
        </button>
      </div>

      {/* ===== USER CARD ===== */}
      <div style={{ ...card, marginBottom: 20 }}>
        <strong>{user}</strong>{' '}
        <span style={{ fontSize: 12, color: isEditor ? '#28a745' : '#6c757d' }}>
          {isEditor ? 'Editor' : 'Viewer'}
        </span>
        <div style={muted}>Residential Building (G+3)</div>
      </div>

      {/* ===== MONTH SELECT (ALL MONTHS) ===== */}
      <select
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
        style={{ marginBottom: 20 }}
      >
        {months.map((m) => (
          <option key={m} value={m}>
            {new Date(m + '-01').toLocaleString('default', {
              month: 'short',
              year: 'numeric',
            })}
          </option>
        ))}
      </select>

      {/* ===== MONTHLY BUDGET ===== */}
      <div style={{ ...card, textAlign: 'center', marginBottom: 20 }}>
        <div style={muted}>Monthly Budget</div>
        <CircularGauge percent={monthlyPercent} />
        <div style={muted}>
          ₹{monthlySpent.toLocaleString()} / ₹{MONTH_BUDGET.toLocaleString()}
        </div>
      </div>

      {/* ===== CATEGORY WISE ===== */}
      <h3>Category Wise Expenses</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {Object.entries(categoryTotals).map(([g, amt]) => (
          <div key={g} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{CATEGORY_ICONS[g]} {g}</span>
              <strong>₹{amt.toLocaleString()}</strong>
            </div>
            <div style={progressBg}>
              <div
                style={{
                  ...progressBar,
                  width: `${(amt / maxCategory) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ===== RECENT EXPENSES ===== */}
      <h3 style={{ marginTop: 30 }}>Recent Expenses</h3>
      <table className="expense-table">
        <thead>
          <tr>
            <th>Qty</th><th>Category</th><th>Amount</th>
            <th>Date</th><th>Notes</th><th>Bill</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredExpenses.slice(0, 5).map((e) => {
            const img = getImageUrl(e.Image);
            return (
              <tr key={e._id}>
                <td>{e.quantity}</td>
                <td>
                  <div style={muted}>{CATEGORY_ICONS[e.group]} {e.group}</div>
                  <strong>{e.category}</strong>
                </td>
                <td>₹{e.amount}</td>
                <td>{new Date(e.date).toLocaleDateString()}</td>
                <td>{e.notes || '—'}</td>
                <td>
                  {img && (
                    <img
                      src={img}
                      className="bill-thumb"
                      onClick={() => setPreviewImage(img)}
                    />
                  )}
                </td>
                <td>
                  {isEditor && (
                    <>
                      <button className="btn-add" onClick={() => editExpense(e)}>Edit</button>{' '}
                      <button className="btn-delete" onClick={() => remove(e._id)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ===== IMAGE PREVIEW ===== */}
      {previewImage && (
        <div style={overlay} onClick={() => setPreviewImage(null)}>
          <img src={previewImage} style={previewImg} />
        </div>
      )}
    </div>
  );
}

/* ===== UI HELPERS ===== */
const CircularGauge = ({ percent }) => (
  <div style={{
    width: 110, height: 110, borderRadius: '50%',
    background: `conic-gradient(#007bff ${percent}%, #e9ecef 0)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  }}>
    <strong>{percent}%</strong>
  </div>
);

const card = { background: 'white', padding: 15, borderRadius: 10 };
const muted = { fontSize: 12, color: '#777' };
const progressBg = { height: 6, background: '#e9ecef', borderRadius: 4 };
const progressBar = { height: '100%', background: '#28a745', borderRadius: 4 };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center' };
const previewImg = { maxWidth: '90%', maxHeight: '90%' };

export default App;
