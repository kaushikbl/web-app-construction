import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const API = '/api';

/* ===== PROJECT CONFIG ===== */
const PROJECT_BUDGET = 11200000;
const PROJECT_DURATION_MONTHS = 12;
const MONTH_BUDGET = Math.round(PROJECT_BUDGET / PROJECT_DURATION_MONTHS);

/* ===== ADMINS ===== */
const ADMINS = ['kaushik', 'shruthi'];

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

export default function App() {
  /* ===== LOGIN ===== */
  const [username, setUsername] = useState(
    localStorage.getItem('username') || ''
  );
  const [inputName, setInputName] = useState('');

  const isAdmin = ADMINS.includes(username?.toLowerCase());

  /* ===== DATA ===== */
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

  /* ===== LOAD ===== */
  useEffect(() => {
    if (username) {
      loadCategories();
      loadExpenses();
    }
  }, [username]);

  const loadCategories = async () => {
    const res = await axios.get(`${API}/categories`);
    setCategories(res.data || {});
  };

  const loadExpenses = async () => {
    const res = await axios.get(`${API}/expenses`);
    setExpenses(res.data);
  };

  /* ===== LOGIN UI ===== */
  if (!username) {
    return (
      <div className="container">
        <h1>Expense Dashboard</h1>
        <div style={card}>
          <h3>Login</h3>
          <input
            placeholder="Enter your name"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
          />
          <button
            className="btn-add"
            onClick={() => {
              if (!inputName) return;
              localStorage.setItem('username', inputName);
              setUsername(inputName);
            }}
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  /* ===== IMAGE PATH FIX ===== */
  const getImageUrl = (img) => {
    if (!img) return null;
    if (img.includes('/uploads/')) {
      return img.substring(img.indexOf('/uploads/'));
    }
    return img;
  };

  /* ===== ADD / UPDATE ===== */
  const submit = async () => {
    if (!isAdmin) return;

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));

    if (editing) {
      const res = await axios.put(`${API}/expenses/${editing._id}`, fd);
      setExpenses((p) => p.map((e) => (e._id === editing._id ? res.data : e)));
      setEditing(null);
    } else {
      const res = await axios.post(`${API}/expenses`, fd);
      setExpenses((p) => [res.data, ...p]);
    }

    resetForm();
  };

  const editExpense = (e) => {
    if (!isAdmin) return;
    setEditing(e);
    setForm({ ...e, Image: null });
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
    if (!isAdmin) return;
    if (!window.confirm('Delete expense?')) return;
    await axios.delete(`${API}/expenses/${id}`);
    setExpenses((p) => p.filter((e) => e._id !== id));
  };

  /* ===== MONTHS ===== */
  const year = new Date().getFullYear();
  const months = Array.from({ length: 12 }, (_, i) =>
    `${year}-${String(i + 1).padStart(2, '0')}`
  );

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

  const totalSpent = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const projectPercent = Math.round((totalSpent / PROJECT_BUDGET) * 100);

  const projectStatus =
    projectPercent >= 100
      ? 'Over Budget'
      : projectPercent >= 85
      ? 'At Risk'
      : 'On Track';

  /* ===== CATEGORY TOTALS ===== */
  const categoryTotals = filteredExpenses.reduce((acc, e) => {
    acc[e.group] = (acc[e.group] || 0) + Number(e.amount || 0);
    return acc;
  }, {});

  const maxCategory = Math.max(...Object.values(categoryTotals), 1);

  const topDrivers = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  /* ===== MONTHLY TREND ===== */
  const monthTotals = months.map((m) => {
    const total = expenses
      .filter((e) => {
        const d = new Date(e.date);
        return (
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === m
        );
      })
      .reduce((s, e) => s + Number(e.amount || 0), 0);

    return { month: m, total };
  });

  const maxMonth = Math.max(...monthTotals.map((m) => m.total), 1);
  const currentMonth = `${year}-${String(new Date().getMonth() + 1).padStart(
    2,
    '0'
  )}`;

  return (
    <div className="container">
      <h1>Expense Dashboard</h1>

      {/* ===== SUMMARY ===== */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={card}>
          <h3>Good Day 👋</h3>
          <strong>{username}</strong>
          <div style={muted}>Residential Building (G+3)</div>
          <div style={muted}>
            Access: {isAdmin ? 'Admin' : 'Read Only'}
          </div>
          <button
            className="btn-delete"
            onClick={() => {
              localStorage.removeItem('username');
              setUsername('');
            }}
          >
            Logout
          </button>
        </div>

        <div style={card}>
          <div style={muted}>Monthly Budget</div>
          <CircularGauge percent={monthlyPercent} />
          <div style={muted}>
            ₹{monthlySpent.toLocaleString()} / ₹
            {MONTH_BUDGET.toLocaleString()}
          </div>
        </div>

        <div style={card}>
          <h4>🏗 Project Status</h4>
          <div>Used: {projectPercent}%</div>
          <strong
            style={{
              color:
                projectStatus === 'Over Budget'
                  ? '#dc3545'
                  : projectStatus === 'At Risk'
                  ? '#ffc107'
                  : '#28a745',
            }}
          >
            {projectStatus}
          </strong>
        </div>

        <div style={card}>
          <h4>🔥 Top Cost Drivers</h4>
          {topDrivers.map(([g, amt]) => (
            <div key={g}>
              {CATEGORY_ICONS[g]} {g}
              <div style={muted}>₹{amt.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== MONTH TREND ===== */}
      <h3 style={{ marginTop: 30 }}>📊 Month-wise Trend</h3>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        {monthTotals.map((m) => (
          <div
            key={m.month}
            style={{
              width: 22,
              height: `${(m.total / maxMonth) * 120}px`,
              background:
                m.month === currentMonth ? '#007bff' : '#adb5bd',
              borderRadius: 4,
            }}
            title={`₹${m.total}`}
          />
        ))}
      </div>

      {/* ===== MONTH FILTER ===== */}
      <select
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
        style={{ margin: '20px 0' }}
      >
        <option value="">All Months</option>
        {months.map((m) => (
          <option key={m} value={m}>
            {new Date(m + '-01').toLocaleString('default', {
              month: 'short',
              year: 'numeric',
            })}
          </option>
        ))}
      </select>

      {/* ===== ADD / EDIT ===== */}
      {isAdmin && (
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
            <input
              type="file"
              onChange={(e) =>
                setForm({ ...form, Image: e.target.files[0] })
              }
            />
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

      {/* ===== RECENT ===== */}
      <h3 style={{ marginTop: 30 }}>Recent Expenses</h3>
      <table className="expense-table">
        <thead>
          <tr>
            <th>Qty</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Notes</th>
            <th>Bill</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredExpenses.slice(0, 6).map((e) => {
            const imgUrl = getImageUrl(e.Image);
            return (
              <tr key={e._id}>
                <td>{e.quantity}</td>
                <td>
                  <div style={muted}>{CATEGORY_ICONS[e.group]} {e.group}</div>
                  <strong>{e.category}</strong>
                </td>
                <td>₹{e.amount.toLocaleString()}</td>
                <td>{new Date(e.date).toLocaleDateString()}</td>
                <td>{e.notes || '—'}</td>
                <td>
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      className="bill-thumb"
                      onClick={() => setPreviewImage(imgUrl)}
                    />
                  ) : '—'}
                </td>
                <td>
                  {isAdmin && (
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

/* ===== UI ===== */
const CircularGauge = ({ percent }) => (
  <div style={{
    width: 120, height: 120, borderRadius: '50%',
    background: `conic-gradient(#007bff ${percent}%, #e9ecef 0)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  }}>
    <div style={{
      width: 90, height: 90, borderRadius: '50%',
      background: 'white', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
    }}>
      {percent}%
    </div>
  </div>
);

const card = { background: 'white', padding: 15, borderRadius: 10 };
const muted = { fontSize: 12, color: '#777' };
const progressBg = { height: 6, background: '#e9ecef', borderRadius: 4, marginTop: 6 };
const progressBar = { height: '100%', background: '#28a745', borderRadius: 4 };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 };
const previewImg = { maxWidth: '90%', maxHeight: '90%', borderRadius: 8 };
