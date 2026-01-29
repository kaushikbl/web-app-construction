import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const API = '/api';

/* 🔧 SET YOUR TOTAL PROJECT BUDGET HERE */
const PROJECT_BUDGET = 1650000; // 1.65 crores

const CATEGORY_ICONS = {
  'Foundation & Structure': '🏗️',
  'Masonry': '🧱',
  'Roofing': '🏠',
  'Plumbing': '🚰',
  'Electrical': '💡',
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

  /* ADD / UPDATE */
  const submit = async () => {
    if (!form.quantity || !form.category || !form.group || !form.amount) {
      alert('Fill required fields');
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

  /* 🔍 FILTER (Month + Notes) */
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

  /* 💰 TOTAL PROJECT SPENT (NOT MONTHLY) */
  const totalProjectSpent = expenses.reduce(
    (s, e) => s + Number(e.amount || 0),
    0
  );

  const projectPercent = Math.min(
    Math.round((totalProjectSpent / PROJECT_BUDGET) * 100),
    100
  );

  /* CATEGORY TOTALS (filtered view) */
  const categoryTotals = filteredExpenses.reduce((a, e) => {
    a[e.group] = (a[e.group] || 0) + Number(e.amount || 0);
    return a;
  }, {});

  const maxCat = Math.max(...Object.values(categoryTotals), 1);

  const months = [
    ...new Set(
      expenses.map((e) => {
        const d = new Date(e.date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      })
    ),
  ];

  return (
    <div
      className="container"
      style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      <h1>Construction Expense Dashboard</h1>

      {/* TOP ROW */}
      <div style={row}>
        <div style={card}>
          <h3>Project Overview</h3>
          <strong>Total Budget</strong>
          <div>₹{PROJECT_BUDGET.toLocaleString()}</div>
        </div>

        <div style={{ ...card, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#777' }}>
            Project Budget Utilization
          </div>
          <CircularGauge percent={projectPercent} />
          <div style={{ fontSize: 12 }}>
            ₹{totalProjectSpent.toLocaleString()} spent
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={row}>
        <div style={{ width: 180 }}>
          <label style={label}>Filter by Month</label>
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
        </div>

        <div style={{ flex: 1 }}>
          <label style={label}>Search Notes</label>
          <input
            placeholder="cement, advance, labour..."
            value={noteSearch}
            onChange={(e) => setNoteSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ADD / EDIT */}
      <div style={{ ...card, marginBottom: 25 }}>
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
            <button
              className="btn-delete"
              onClick={() => {
                setEditing(null);
                resetForm();
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* CATEGORY GRID */}
      <h3>Category Wise (Filtered View)</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
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
                  width: `${(amt / maxCat) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <h3>Transactions</h3>
      <div style={{ overflowX: 'auto' }}>
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
            {filteredExpenses.map((e) => (
              <tr key={e._id}>
                <td>{e.quantity}</td>
                <td>
                  <div style={{ fontSize: 12, color: '#777' }}>
                    {CATEGORY_ICONS[e.group] || '📦'} {e.group}
                  </div>
                  <strong>{e.category}</strong>
                </td>
                <td>₹{e.amount}</td>
                <td>{new Date(e.date).toLocaleDateString()}</td>
                <td>{e.notes || '—'}</td>
                <td>
                  {e.Image ? (
                    <img
                      src={e.Image}
                      alt="Bill"
                      className="bill-thumb"
                      onClick={() => setPreviewImage(e.Image)}
                    />
                  ) : '—'}
                </td>
                <td>
                  <button className="btn-add" onClick={() => editExpense(e)}>
                    Edit
                  </button>{' '}
                  <button
                    className="btn-delete"
                    onClick={() => remove(e._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {previewImage && (
        <div style={overlay} onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="Preview" style={previewImg} />
        </div>
      )}
    </div>
  );
}

/* UI HELPERS */

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

const row = {
  display: 'flex',
  gap: 16,
  marginBottom: 20,
  flexWrap: 'wrap',
};

const card = {
  background: 'white',
  padding: 15,
  borderRadius: 10,
  flex: 1,
};

const label = {
  fontSize: 12,
  color: '#777',
  marginBottom: 4,
  display: 'block',
};

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
};

const previewImg = {
  maxWidth: '90%',
  maxHeight: '90%',
  borderRadius: 8,
};

export default App;
