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

  /* ===== ADD / UPDATE ===== */
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

    if (form.Image) fd.append('Image', form.Image);

    try {
      if (editing) {
        const res = await axios.put(
          `${API}/expenses/${editing._id}`,
          fd
        );
        setExpenses((prev) =>
          prev.map((e) => (e._id === editing._id ? res.data : e))
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

          <div style={{ fontWeight: 600, marginTop: 6 }}>
            Status:{' '}
            <span
              style={{
                color:
                  status === 'Over Budget'
                    ? '#dc3545'
                    : status === 'At Risk'
                    ? '#ffc107'
                    : '#28a745',
              }}
            >
              {status}
            </span>
          </div>
        </div>

        <div style={{ ...card, textAlign: 'center' }}>
          <CircularGauge percent={percentUsed} />
          <div style={muted}>Project Budget Utilization</div>
          <strong>₹{totalSpent.toLocaleString()} spent</strong>
        </div>
      </div>

      {/* FILTERS */}
      <div style={row}>
        <div>
          <label>Month</label>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            <option value="">All</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {new Date(m + '-01').toLocaleString('default', {
                  month: 'long',
                  year: 'numeric',
                })}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label>Search Notes</label>
          <input
            placeholder="cement, advance, labour..."
            value={noteSearch}
            onChange={(e) => setNoteSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ADD / EDIT */}
      <div style={{ ...card, marginBottom: 20 }}>
        <h3>{editing ? 'Edit Expense' : 'Add Expense'}</h3>

        <div className="form-row">
          <input placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />

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

          <input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>

        <div className="form-row">
          <input type="file" onChange={(e) => setForm({ ...form, Image: e.target.files[0] })} />
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

      {/* EXPENSE TABLE */}
      <h3 style={{ marginTop: 30 }}>Expense Details</h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="expense-table">
          <thead>
            <tr>
              <th>Qty</th>
              <th>Category</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th>Date</th>
              <th>Notes</th>
              <th>Bill</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map((e) => (
              <tr key={e._id}>
                <td>{e.quantity}</td>
                <td>
                  <div style={muted}>{e.group}</div>
                  <strong>{e.category}</strong>
                </td>
                <td style={{ textAlign: 'right' }}>₹{Number(e.amount).toLocaleString()}</td>
                <td>{new Date(e.date).toLocaleDateString()}</td>
                <td style={muted}>{e.notes || '—'}</td>
                <td>
                  {e.Image ? (
                    <img
                      src={e.Image}
                      alt="Bill"
                      className="bill-thumb"
                      style={{ cursor: 'pointer' }}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setPreviewImage(e.Image);
                      }}
                    />
                  ) : (
                    '—'
                  )}
                </td>
                <td>
                  <button className="btn-add" onClick={() => editExpense(e)}>Edit</button>{' '}
                  <button className="btn-delete" onClick={() => remove(e._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* IMAGE PREVIEW */}
      {previewImage && (
        <div
          style={{ ...overlay, zIndex: 9999 }}
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Preview"
            style={previewImg}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

/* ===== SMALL COMPONENTS & STYLES ===== */

const OverviewRow = ({ label, value, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
    <span>{label}</span>
    <strong style={{ color }}>{value}</strong>
  </div>
);

const CircularGauge = ({ percent }) => (
  <div
    style={{
      width: 120,
      height: 120,
      borderRadius: '50%',
      background: `conic-gradient(#28a745 ${percent}%, #e9ecef 0)`,
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

const row = { display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' };
const card = { background: 'white', padding: 16, borderRadius: 10 };
const muted = { fontSize: 12, color: '#777' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const previewImg = { maxWidth: '90%', maxHeight: '90%', borderRadius: 8 };

export default App;
