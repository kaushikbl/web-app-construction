import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const API = '/api';

/* ===== PROJECT CONFIG ===== */
const PROJECT_BUDGET = 11200000;
const PROJECT_DURATION_MONTHS = 12;
const MONTH_BUDGET = Math.round(PROJECT_BUDGET / PROJECT_DURATION_MONTHS);

/* ===== ACCESS CONTROL ===== */
const EDIT_USERS = ['kaushik', 'shruthi'];

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
  'Carpentry & Wood Work': '🪚',
  'Metal & Fabrication': '🔩',
  'Exterior Works': '🌳',
};

function App() {
  /* ===== LOGIN ===== */
  const [user, setUser] = useState(localStorage.getItem('user') || '');
  const [loginName, setLoginName] = useState('');

  const canEdit = EDIT_USERS.includes(user.toLowerCase());
  const roleLabel = canEdit ? 'Editor' : 'Viewer';

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
  }, []);

  const loadCategories = async () => {
    const res = await axios.get(`${API}/categories`);
    setCategories(res.data || {});
  };

  const loadExpenses = async () => {
    const res = await axios.get(`${API}/expenses`);
    setExpenses(res.data);
  };

  /* ===== AUTO SELECT CURRENT MONTH ===== */
  useEffect(() => {
    const now = new Date();
    setSelectedMonth(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    );
  }, []);

  /* ===== IMAGE FIX ===== */
  const getImageUrl = (img) => {
    if (!img) return null;
    return img.includes('/uploads/')
      ? img.substring(img.indexOf('/uploads/'))
      : img;
  };

  /* ===== ADD / UPDATE ===== */
  const submit = async () => {
    if (!canEdit) return alert('Read-only access');

    if (!form.quantity || !form.category || !form.group || !form.amount) {
      alert('Please fill required fields');
      return;
    }

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));

    if (editing) {
      const res = await axios.put(`${API}/expenses/${editing._id}`, fd);
      setExpenses((p) =>
        p.map((e) => (e._id === editing._id ? res.data : e))
      );
      setEditing(null);
    } else {
      const res = await axios.post(`${API}/expenses`, fd);
      setExpenses((p) => [res.data, ...p]);
    }

    resetForm();
  };

  const editExpense = (e) => {
    if (!canEdit) return;
    setEditing(e);
    setForm({
      quantity: e.quantity,
      category: e.category,
      group: e.group,
      amount: e.amount,
      notes: e.notes || '',
      Image: null,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    if (!canEdit) return;
    if (!window.confirm('Delete this expense?')) return;
    await axios.delete(`${API}/expenses/${id}`);
    setExpenses((p) => p.filter((e) => e._id !== id));
  };

  /* ===== MONTH LIST (SHORT + YEAR) ===== */
  const year = new Date().getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(year, i);
    return {
      value: `${year}-${String(i + 1).padStart(2, '0')}`,
      label: d.toLocaleString('default', { month: 'short', year: 'numeric' }),
    };
  });

  /* ===== FILTER ===== */
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

  /* ===== CATEGORY TOTALS ===== */
  const categoryTotals = filteredExpenses.reduce((a, e) => {
    a[e.group] = (a[e.group] || 0) + Number(e.amount || 0);
    return a;
  }, {});

  /* ===== TOP COST DRIVERS (TOP 3) ===== */
  const topDrivers = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const maxCategory = Math.max(...Object.values(categoryTotals), 1);

  /* ===== LOGIN SCREEN ===== */
  if (!user) {
    return (
      <div className="container">
        <h1>Expense Dashboard</h1>
        <div style={card}>
          <h3>Login</h3>
          <input
            placeholder="Enter your name"
            value={loginName}
            onChange={(e) => setLoginName(e.target.value)}
          />
          <button
            className="btn-add"
            onClick={() => {
              if (!loginName) return;
              localStorage.setItem('user', loginName);
              setUser(loginName);
            }}
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  /* ===== MAIN UI ===== */
  return (
    <div className="container">
      <h1>Expense Dashboard</h1>

      {/* ===== USER BAR ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
        <div>
          <strong>{user}</strong>{' '}
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 12,
              fontSize: 12,
              background: canEdit ? '#28a745' : '#0d6efd',
              color: 'white',
            }}
          >
            {roleLabel}
          </span>
        </div>
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

      {/* ===== SUMMARY ROW ===== */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div style={card}>
          <h3>Residential Building</h3>
          <div style={muted}>G+3 Construction</div>
        </div>

        <div style={{ ...card, textAlign: 'center' }}>
          <div style={muted}>Monthly Budget</div>
          <CircularGauge percent={monthlyPercent} />
          <div style={muted}>
            ₹{monthlySpent.toLocaleString()} / ₹{MONTH_BUDGET.toLocaleString()}
          </div>
        </div>

        {/* ===== TOP COST DRIVERS ===== */}
        <div style={card}>
          <h4>🔥 Top Cost Drivers</h4>
          {topDrivers.length === 0 && <div style={muted}>No data</div>}
          {topDrivers.map(([g, amt]) => (
            <div key={g} style={{ marginBottom: 6 }}>
              {CATEGORY_ICONS[g] || '📦'} {g}
              <div style={muted}>₹{amt.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== MONTH SELECT ===== */}
      <select
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
        style={{ marginBottom: 20 }}
      >
        {months.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>

      {/* ===== ADD / EDIT ===== */}
      {canEdit && (
        <div style={{ ...card, marginBottom: 25 }}>
          <h3>{editing ? 'Edit Expense' : 'Add Expense'}</h3>
          <div className="form-row">
            <input
              placeholder="Quantity"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
            <select
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category: e.target.value,
                  group: e.target.selectedOptions[0].dataset.group,
                })
              }
            >
              <option value="">Select Category</option>
              {Object.entries(categories).map(([g, items]) => (
                <optgroup key={g} label={g}>
                  {items.map((c) => (
                    <option key={c._id} value={c.name} data-group={g}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <input
              type="number"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
            <input
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="form-row">
            <input type="file" onChange={(e) => setForm({ ...form, Image: e.target.files[0] })} />
            <button className="btn-add" onClick={submit}>
              {editing ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {/* ===== CATEGORY WISE ===== */}
      <h3>Category Wise Expenses</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {Object.entries(categoryTotals).map(([g, amt]) => (
          <div key={g} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{CATEGORY_ICONS[g] || '📦'} {g}</span>
              <strong>₹{amt.toLocaleString()}</strong>
            </div>
            <div style={progressBg}>
              <div style={{ ...progressBar, width: `${(amt / maxCategory) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* ===== RECENT TRANSACTIONS ===== */}
      <h3 style={{ marginTop: 30 }}>Recent Transactions</h3>
      <table className="expense-table">
        <thead>
          <tr>
            <th>Qty</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Notes</th>
            <th>Bill</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredExpenses.slice(0, 6).map((e) => {
            const img = getImageUrl(e.Image);
            return (
              <tr key={e._id}>
                <td>{e.quantity}</td>
                <td>
                  <div style={muted}>{e.group}</div>
                  <strong>{e.category}</strong>
                </td>
                <td>₹{e.amount.toLocaleString()}</td>
                <td>{e.notes || '—'}</td>
                <td>
                  {img ? (
                    <img
                      src={img}
                      className="bill-thumb"
                      onClick={() => setPreviewImage(img)}
                    />
                  ) : '—'}
                </td>
                <td>
                  {canEdit && (
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

      {previewImage && (
        <div style={overlay} onClick={() => setPreviewImage(null)}>
          <img src={previewImage} style={previewImg} />
        </div>
      )}
    </div>
  );
}

/* ===== SMALL COMPONENTS ===== */
const CircularGauge = ({ percent }) => (
  <div style={{
    width: 120, height: 120, borderRadius: '50%',
    background: `conic-gradient(#28a745 ${percent}%, #e9ecef 0)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  }}>
    <div style={{
      width: 90, height: 90, borderRadius: '50%',
      background: 'white', fontWeight: 'bold',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      {percent}%
    </div>
  </div>
);

const card = { background: 'white', padding: 15, borderRadius: 10 };
const muted = { fontSize: 12, color: '#777' };
const progressBg = { height: 6, background: '#e9ecef', borderRadius: 4, marginTop: 6 };
const progressBar = { height: '100%', background: '#28a745', borderRadius: 4 };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const previewImg = { maxWidth: '90%', maxHeight: '90%', borderRadius: 8 };

export default App;
