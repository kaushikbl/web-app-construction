import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const API = '/api';

/* ===== PROJECT CONFIG ===== */
const PROJECT_BUDGET = 11200000; // ₹1.12 Cr
const PROJECT_DURATION_MONTHS = 12;
const MONTHLY_BUDGET = Math.round(PROJECT_BUDGET / PROJECT_DURATION_MONTHS);

/* CATEGORY ICONS */
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

  /* ===== ADD / UPDATE ===== */
  const submit = async () => {
    if (!form.quantity || !form.category || !form.group || !form.amount) {
      alert('Please fill required fields');
      return;
    }

    const fd = new FormData();
    fd.append('quantity', form.quantity);
    fd.append('category', form.category);
    fd.append('group', form.group);
    fd.append('amount', form.amount);
    fd.append('notes', form.notes || '');
    if (form.Image) fd.append('Image', form.Image);

    if (editing) {
      const res = await axios.put(
        `${API}/expenses/${editing._id}`,
        fd
      );
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
    setEditing(e);
    setForm({
      quantity: e.quantity,
      category: e.category,
      group: e.group,
      amount: e.amount,
      notes: e.notes || '',
      Image: null,
    });
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
    const f = document.querySelector('input[type="file"]');
    if (f) f.value = '';
  };

  const remove = async (id) => {
    if (!window.confirm('Delete expense?')) return;
    await axios.delete(`${API}/expenses/${id}`);
    setExpenses((p) => p.filter((e) => e._id !== id));
  };

  /* ===== MONTH FILTER ===== */
  const filteredExpenses = selectedMonth
    ? expenses.filter((e) => {
        const d = new Date(e.date);
        return (
          d.getFullYear() +
            '-' +
            String(d.getMonth() + 1).padStart(2, '0') ===
          selectedMonth
        );
      })
    : expenses;

  /* ===== MONTHLY METRICS ===== */
  const monthlySpent = filteredExpenses.reduce(
    (s, e) => s + Number(e.amount || 0),
    0
  );

  const monthlyRemaining = MONTHLY_BUDGET - monthlySpent;
  const isOverBudget = monthlyRemaining < 0;

  const monthlyPercent = Math.min(
    Math.round((monthlySpent / MONTHLY_BUDGET) * 100),
    100
  );

  /* ===== CATEGORY TOTALS ===== */
  const categoryTotals = filteredExpenses.reduce((acc, e) => {
    acc[e.group] = (acc[e.group] || 0) + Number(e.amount || 0);
    return acc;
  }, {});

  const maxCategory = Math.max(...Object.values(categoryTotals), 1);

  const months = [
    ...new Set(
      expenses.map((e) => {
        const d = new Date(e.date);
        return (
          d.getFullYear() +
          '-' +
          String(d.getMonth() + 1).padStart(2, '0')
        );
      })
    ),
  ];

  return (
    <div className="container" style={{ maxWidth: 1200 }}>
      <h1>Expense Dashboard</h1>

      {/* ===== TOP SECTION ===== */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div style={card}>
          <h3>Good Morning 👋</h3>
          <strong>Kaushik</strong>
          <div style={muted}>Track your construction expenses</div>
        </div>

        <div style={{ ...card, textAlign: 'center' }}>
          <div style={muted}>Monthly Budget Utilization</div>
          <CircularGauge percent={monthlyPercent} />
          <div style={{ fontSize: 13 }}>
            <strong>Budget:</strong> ₹{MONTHLY_BUDGET.toLocaleString()}
          </div>
          <div style={{ fontSize: 13 }}>
            <strong>Spent:</strong> ₹{monthlySpent.toLocaleString()}
          </div>
          <div
            style={{
              fontWeight: 600,
              marginTop: 4,
              color: isOverBudget ? '#dc3545' : '#28a745',
            }}
          >
            {isOverBudget
              ? `Over by ₹${Math.abs(monthlyRemaining).toLocaleString()}`
              : `Remaining ₹${monthlyRemaining.toLocaleString()}`}
          </div>
        </div>
      </div>

      {/* ===== MONTH SELECT ===== */}
      <div style={{ marginBottom: 20 }}>
        <label style={muted}>Month</label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          <option value="">All Months</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {new Date(m + '-01').toLocaleString('default', {
                month: 'long',
                year: 'numeric',
              })}
            </option>
          ))}
        </select>
        <div style={{ fontSize: 12, color: '#777', marginTop: 4 }}>
          Monthly budget based on ₹{PROJECT_BUDGET.toLocaleString()} / {PROJECT_DURATION_MONTHS} months
        </div>
      </div>

      {/* ===== ADD / EDIT ===== */}
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
            onChange={(e) => setForm({ ...form, Image: e.target.files[0] })}
          />

          <button className="btn-add" onClick={submit}>
            {editing ? 'Update' : 'Add'}
          </button>

          {editing && (
            <button className="btn-delete" onClick={() => setEditing(null)}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* ===== CATEGORY SUMMARY ===== */}
      <h3>Category Wise Expenses</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {Object.entries(categoryTotals).map(([g, amt]) => (
          <div key={g} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{CATEGORY_ICONS[g] || '📦'} {g}</span>
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

      {/* ===== TRANSACTIONS ===== */}
      <h3 style={{ marginTop: 30 }}>Recent Transactions</h3>
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
          {filteredExpenses.slice(0, 6).map((e) => (
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
                {e.Image ? (
                  <img
                    src={e.Image}
                    className="bill-thumb"
                    alt="Bill"
                    onClick={() => setPreviewImage(e.Image)}
                  />
                ) : (
                  '—'
                )}
              </td>
              <td>
                <button className="btn-add" onClick={() => editExpense(e)}>
                  Edit
                </button>{' '}
                <button className="btn-delete" onClick={() => remove(e._id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* IMAGE PREVIEW */}
      {previewImage && (
        <div style={overlay} onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="Preview" style={previewImg} />
        </div>
      )}
    </div>
  );
}

/* ===== SMALL COMPONENTS & STYLES ===== */

const CircularGauge = ({ percent }) => (
  <div
    style={{
      width: 120,
      height: 120,
      borderRadius: '50%',
      background: `conic-gradient(#007bff ${percent}%, #e9ecef 0)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '10px auto',
    }}
  >
    <div
      style={{
        width: 90,
        height: 90,
        borderRadius: '50%',
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
      }}
    >
      {percent}%
    </div>
  </div>
);

const card = {
  background: 'white',
  padding: 16,
  borderRadius: 10,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

const muted = { fontSize: 12, color: '#777' };

const progressBg = {
  height: 6,
  background: '#e9ecef',
  borderRadius: 4,
  marginTop: 6,
};

const progressBar = {
  height: '100%',
  background: '#28a745',
  borderRadius: 4,
};

const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.8)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
};

const previewImg = {
  maxWidth: '90%',
  maxHeight: '90%',
  borderRadius: 8,
};

export default App;
