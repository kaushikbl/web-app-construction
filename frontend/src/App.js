import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const API = '/api';

/* ===== PROJECT CONFIG ===== */
const PROJECT_BUDGET = 11200000; // Approved / working budget
const PROJECT_INFO = {
  name: 'Residential House Construction',
  location: 'Bengaluru',
  type: 'Independent House (Split / G+1 / G+2 / G+3)',
  estimatedCost: 11200000, // Estimated total cost
};

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

  /* ===== ADD / UPDATE ===== */
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

  /* ===== FILTERS ===== */
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

  /* ===== PROJECT METRICS ===== */
  const totalProjectSpent = expenses.reduce(
    (s, e) => s + Number(e.amount || 0),
    0
  );

  const remainingBudget = PROJECT_BUDGET - totalProjectSpent;

  const projectPercent = Math.min(
    Math.round((totalProjectSpent / PROJECT_BUDGET) * 100),
    100
  );

  const projectStatus =
    projectPercent >= 100
      ? 'Over Budget'
      : projectPercent >= 85
      ? 'At Risk'
      : 'On Track';

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
      style={{ maxWidth: 1200, width: '100%', margin: '0 auto' }}
    >
      <h1>Construction Expense Dashboard</h1>

      {/* ===== TOP ROW ===== */}
      <div style={row}>
        {/* PROJECT OVERVIEW */}
        <div style={card}>
          <h3 style={{ marginBottom: 10 }}>🏗️ Project Overview</h3>

          <div style={overviewRow}>
            <span>Project Name</span>
            <strong>{PROJECT_INFO.name}</strong>
          </div>

          <div style={overviewRow}>
            <span>Location</span>
            <strong>{PROJECT_INFO.location}</strong>
          </div>

          <div style={overviewRow}>
            <span>Project Type</span>
            <strong>{PROJECT_INFO.type}</strong>
          </div>

          <hr style={{ margin: '8px 0', borderColor: '#eee' }} />

          <div style={overviewRow}>
            <span>Estimated Cost</span>
            <strong>₹{PROJECT_INFO.estimatedCost.toLocaleString()}</strong>
          </div>

          <div style={overviewRow}>
            <span>Approved Budget</span>
            <strong>₹{PROJECT_BUDGET.toLocaleString()}</strong>
          </div>

          <div style={overviewRow}>
            <span>Total Spent</span>
            <strong>₹{totalProjectSpent.toLocaleString()}</strong>
          </div>

          <div style={overviewRow}>
            <span>Remaining</span>
            <strong
              style={{
                color: remainingBudget < 0 ? '#dc3545' : '#28a745',
              }}
            >
              ₹{remainingBudget.toLocaleString()}
            </strong>
          </div>

          <div style={overviewRow}>
            <span>Budget Used</span>
            <strong>{projectPercent}%</strong>
          </div>

          <div
            style={{
              marginTop: 8,
              fontWeight: 600,
              color:
                projectStatus === 'Over Budget'
                  ? '#dc3545'
                  : projectStatus === 'At Risk'
                  ? '#ffc107'
                  : '#28a745',
            }}
          >
            Status: {projectStatus}
          </div>
        </div>

        {/* GAUGE */}
        <div style={{ ...card, textAlign: 'center' }}>
          <CircularGauge percent={projectPercent} />
          <div style={{ fontSize: 12 }}>
            ₹{totalProjectSpent.toLocaleString()} spent
          </div>
        </div>
      </div>

      {/* ===== FILTER BAR ===== */}
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

      {/* ===== ADD / EDIT ===== */}
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

      {/* ===== CATEGORY GRID ===== */}
      <h3>Category Wise Expenses</h3>
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
    </div>
  );
}

/* ===== UI HELPERS ===== */

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

const overviewRow = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 13,
  marginBottom: 4,
  gap: 8,
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

export default App;
