import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const API = '/api';

/* ===== PROJECT CONFIG ===== */
const PROJECT_BUDGET = 11200000;
const PROJECT_DURATION_MONTHS = 12;
const MONTH_BUDGET = Math.round(PROJECT_BUDGET / PROJECT_DURATION_MONTHS);

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
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [editing, setEditing] = useState(null);

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

  /* ===== IMAGE PATH FIX ===== */
  const getImageUrl = (img) => {
    if (!img) return null;
    if (img.includes('/uploads/')) {
      return img.substring(img.indexOf('/uploads/'));
    }
    return img;
  };

  /* ADD / UPDATE */
  const submit = async () => {
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
    if (!window.confirm('Delete this expense?')) return;
    await axios.delete(`${API}/expenses/${id}`);
    setExpenses((p) => p.filter((e) => e._id !== id));
  };

  /* MONTH FILTER */
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

  /* METRICS */
  const monthlySpent = filteredExpenses.reduce(
    (s, e) => s + Number(e.amount || 0),
    0
  );

  const monthlyPercent = Math.min(
    Math.round((monthlySpent / MONTH_BUDGET) * 100),
    100
  );

  const totalProjectSpent = expenses.reduce(
    (s, e) => s + Number(e.amount || 0),
    0
  );

  const projectPercent = Math.round(
    (totalProjectSpent / PROJECT_BUDGET) * 100
  );

  const projectStatus =
    projectPercent >= 100
      ? 'Over Budget'
      : projectPercent >= 85
      ? 'At Risk'
      : 'On Track';

  /* CATEGORY TOTALS */
  const categoryTotals = filteredExpenses.reduce((acc, e) => {
    acc[e.group] = (acc[e.group] || 0) + Number(e.amount || 0);
    return acc;
  }, {});

  const topDrivers = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

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
    <div className="container">
      <h1>Expense Dashboard</h1>

      {/* TOP ROW */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div style={card}>
          <h3>Good Morning 👋</h3>
          <strong>Kaushik</strong>
          <div style={{ fontSize: 12, color: '#777' }}>
            Track your construction expenses
          </div>
        </div>

        <div style={{ ...card, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#777' }}>
            Monthly Budget Utilization
          </div>
          <CircularGauge percent={monthlyPercent} />
          <div style={{ fontSize: 12 }}>
            ₹{monthlySpent.toLocaleString()} / ₹{MONTH_BUDGET.toLocaleString()}
          </div>
        </div>

        {/* 🏗 PROJECT STATUS */}
        <div style={card}>
          <h4>🏗 Project Status</h4>
          <div>Total Budget: ₹{PROJECT_BUDGET.toLocaleString()}</div>
          <div>Spent: ₹{totalProjectSpent.toLocaleString()}</div>
          <div>Used: {projectPercent}%</div>
          <div
            style={{
              marginTop: 6,
              fontWeight: 600,
              color:
                projectStatus === 'Over Budget'
                  ? '#dc3545'
                  : projectStatus === 'At Risk'
                  ? '#ffc107'
                  : '#28a745',
            }}
          >
            {projectStatus}
          </div>
        </div>

        {/* 🔥 TOP COST DRIVERS */}
        <div style={card}>
          <h4>🔥 Top Cost Drivers</h4>
          {topDrivers.length === 0 && (
            <div style={{ fontSize: 12, color: '#777' }}>
              No expenses yet
            </div>
          )}
          {topDrivers.map(([g, amt]) => (
            <div key={g} style={{ marginBottom: 6 }}>
              {CATEGORY_ICONS[g] || '📦'} {g}
              <div style={{ fontSize: 12, color: '#777' }}>
                ₹{amt.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MONTH FILTER */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12, color: '#777' }}>Month</label>
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

      {/* CATEGORY WISE */}
      <h3>Category Wise Expenses</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {Object.entries(categoryTotals).map(([g, amt]) => (
          <div key={g} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{CATEGORY_ICONS[g] || '📦'} {g}</span>
              <strong>₹{amt.toLocaleString()}</strong>
            </div>
            <div style={{ height: 6, background: '#e9ecef', borderRadius: 4 }}>
              <div
                style={{
                  width: `${(amt / maxCategory) * 100}%`,
                  height: '100%',
                  background: '#28a745',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* IMAGE PREVIEW */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <img
            src={previewImage}
            alt="Preview"
            style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: 8 }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

/* COMPONENTS */

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
  padding: 15,
  borderRadius: 10,
};

export default App;
