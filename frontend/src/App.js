import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const API = '/api';

/* ===== PROJECT INFO ===== */
const PROJECT_BUDGET = 11200000;
const PROJECT_INFO = {
  name: 'Residential House Construction',
  location: 'Bengaluru',
  type: 'Independent House (Split / G+1 / G+2 / G+3)',
};

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
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState({});
  const [selectedMonth, setSelectedMonth] = useState('');
  const [noteSearch, setNoteSearch] = useState('');
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
    loadExpenses();
    loadCategories();
  }, []);

  const loadExpenses = async () => {
    const res = await axios.get(`${API}/expenses`);
    setExpenses(res.data);
  };

  const loadCategories = async () => {
    const res = await axios.get(`${API}/categories`);
    setCategories(res.data || {});
  };

  /* ===== ADD / UPDATE (FIXED) ===== */
  const submit = async () => {
    if (!form.quantity || !form.category || !form.group || !form.amount) {
      alert('Fill required fields');
      return;
    }

    const fd = new FormData();
    fd.append('quantity', form.quantity);
    fd.append('category', form.category);
    fd.append('group', form.group);
    fd.append('amount', form.amount);
    fd.append('notes', form.notes || '');

    // Append image only if user selected a new one
    if (form.Image) {
      fd.append('Image', form.Image);
    }

    try {
      if (editing) {
        const res = await axios.put(
          `${API}/expenses/${editing._id}`,
          fd
        );

        setExpenses((prev) =>
          prev.map((e) =>
            e._id === editing._id ? res.data : e
          )
        );
        setEditing(null);
      } else {
        const res = await axios.post(`${API}/expenses`, fd);
        setExpenses((prev) => [res.data, ...prev]);
      }

      resetForm();
    } catch (err) {
      console.error(err);
      alert('Failed to save expense');
    }
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

  /* ===== FILTERING ===== */
  const filteredExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    const monthOK = selectedMonth
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` ===
        selectedMonth
      : true;

    const noteOK = noteSearch
      ? (e.notes || '').toLowerCase().includes(noteSearch.toLowerCase())
      : true;

    return monthOK && noteOK;
  });

  /* ===== METRICS ===== */
  const totalSpent = expenses.reduce(
    (s, e) => s + Number(e.amount || 0),
    0
  );

  const remaining = PROJECT_BUDGET - totalSpent;
  const percentUsed = Math.round((totalSpent / PROJECT_BUDGET) * 100);

  const status =
    percentUsed >= 100
      ? 'Over Budget'
      : percentUsed >= 85
      ? 'At Risk'
      : 'On Track';

  const categoryTotals = filteredExpenses.reduce((a, e) => {
    a[e.group] = (a[e.group] || 0) + Number(e.amount || 0);
    return a;
  }, {});

  const sortedCategories = Object.entries(categoryTotals).sort(
    (a, b) => b[1] - a[1]
  );

  const months = [
    ...new Set(
      expenses.map((e) => {
        const d = new Date(e.date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      })
    ),
  ];

  return (
    <div className="container" style={{ maxWidth: 1200 }}>
      <h1>Construction Expense Dashboard</h1>

      {/* PROJECT OVERVIEW */}
      <div style={row}>
        <div style={card}>
          <h3>🏗️ Project Overview</h3>
          <strong>{PROJECT_INFO.name}</strong>
          <div style={muted}>
            {PROJECT_INFO.location} · {PROJECT_INFO.type}
          </div>

          <OverviewRow label="Budget" value={`₹${PROJECT_BUDGET.toLocaleString()}`} />
          <OverviewRow label="Spent" value={`₹${totalSpent.toLocaleString()}`} />
          <OverviewRow
            label="Remaining"
            value={`₹${remaining.toLocaleString()}`}
            color={remaining < 0 ? '#dc3545' : '#28a745'}
          />
          <OverviewRow label="Used" value={`${percentUsed}%`} />

          <span style={{ fontWeight: 600, color: '#28a745' }}>
            Status: {status}
          </span>
        </div>
      </div>

      {/* ADD / EDIT */}
      <div style={card}>
        <h3>{editing ? 'Edit Expense' : 'Add Expense'}</h3>

        <div className="form-row">
          <input
            placeholder="Quantity"
            value={form.quantity}
            onChange={(e) =>
              setForm({ ...form, quantity: e.target.value })
            }
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
            onChange={(e) =>
              setForm({ ...form, amount: e.target.value })
            }
          />

          <input
            placeholder="Notes"
            value={form.notes}
            onChange={(e) =>
              setForm({ ...form, notes: e.target.value })
            }
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

          {editing && (
            <button className="btn-delete" onClick={() => setEditing(null)}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===== SMALL COMPONENT ===== */
const OverviewRow = ({ label, value, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
    <span>{label}</span>
    <strong style={{ color }}>{value}</strong>
  </div>
);

const row = { display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' };
const card = { background: 'white', padding: 16, borderRadius: 10 };
const muted = { fontSize: 12, color: '#777' };

export default App;
