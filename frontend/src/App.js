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
    if (!window.confirm('Delete this expense?')) return;
    await axios.delete(`${API}/expenses/${id}`);
    setExpenses((p) => p.filter((e) => e._id !== id));
  };

  /* ===== ALL 12 MONTHS (FIX) ===== */
  const currentYear = new Date().getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    return `${currentYear}-${String(m).padStart(2, '0')}`;
  });

  /* ===== FILTER BY MONTH ===== */
  const filteredExpenses = selectedMonth
    ? expenses.filter((e) => {
        const d = new Date(e.date);
        const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return m === selectedMonth;
      })
    : expenses;

  /* ===== METRICS (MONTH BASED) ===== */
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

  /* ===== CATEGORY TOTALS (MONTH BASED) ===== */
  const categoryTotals = filteredExpenses.reduce((acc, e) => {
    acc[e.group] = (acc[e.group] || 0) + Number(e.amount || 0);
    return acc;
  }, {});

  const topDrivers = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const maxCategory = Math.max(...Object.values(categoryTotals), 1);

  return (
    <div className="container">
      <h1>Expense Dashboard</h1>

      {/* ===== TOP ROW ===== */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div style={card}>
          <h3>Good Morning 👋</h3>
          <strong>Kaushik</strong>
          <div style={muted}>Track your construction expenses</div>
        </div>

        <div style={{ ...card, textAlign: 'center' }}>
          <div style={muted}>Monthly Budget Utilization</div>
          <CircularGauge percent={monthlyPercent} />
          <div style={muted}>
            ₹{monthlySpent.toLocaleString()} / ₹{MONTH_BUDGET.toLocaleString()}
          </div>
        </div>

        <div style={card}>
          <h4>🏗 Project Status</h4>
          <div>Total Budget: ₹{PROJECT_BUDGET.toLocaleString()}</div>
          <div>Spent: ₹{totalProjectSpent.toLocaleString()}</div>
          <div>Used: {projectPercent}%</div>
          <div style={{ fontWeight: 600, color: projectStatus === 'Over Budget' ? '#dc3545' : projectStatus === 'At Risk' ? '#ffc107' : '#28a745' }}>
            {projectStatus}
          </div>
        </div>

        <div style={card}>
          <h4>🔥 Top Cost Drivers</h4>
          {topDrivers.length === 0 && <div style={muted}>No expenses yet</div>}
          {topDrivers.map(([g, amt]) => (
            <div key={g}>
              {CATEGORY_ICONS[g] || '📦'} {g}
              <div style={muted}>₹{amt.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== MONTH FILTER ===== */}
      <div style={{ marginBottom: 20 }}>
        <label style={muted}>Month</label>
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
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
    </div>
  );
}

/* ===== SMALL COMPONENTS ===== */

const CircularGauge = ({ percent }) => (
  <div style={{
    width: 120,
    height: 120,
    borderRadius: '50%',
    background: `conic-gradient(#007bff ${percent}%, #e9ecef 0)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <div style={{
      width: 90,
      height: 90,
      borderRadius: '50%',
      background: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
    }}>
      {percent}%
    </div>
  </div>
);

const card = { background: 'white', padding: 15, borderRadius: 10 };
const muted = { fontSize: 12, color: '#777' };
const progressBg = { height: 6, background: '#e9ecef', borderRadius: 4, marginTop: 6 };
const progressBar = { height: '100%', background: '#28a745', borderRadius: 4 };

export default App;
