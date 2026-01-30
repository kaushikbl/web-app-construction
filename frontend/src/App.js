import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const API = '/api';

/* ICONS */
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
};

function App() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');

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
  const totalSpent = filteredExpenses.reduce(
    (s, e) => s + Number(e.amount || 0),
    0
  );

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
    <div className="container">
      {/* TOP DASHBOARD ROW */}
      <div style={{ display: 'flex', gap: 15, marginBottom: 20 }}>
        {/* GREETING CARD */}
        <div style={card}>
          <h3 style={{ marginBottom: 5 }}>Good Morning 👋</h3>
          <strong>Kaushik</strong>
          <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
            Track your construction expenses easily
          </div>
        </div>

        {/* BUDGET CARD */}
        <div style={card}>
          <div style={{ fontSize: 12, color: '#777' }}>
            Budget vs Expense
          </div>
          <div style={{ fontSize: 22, fontWeight: 'bold' }}>
            ₹{totalSpent}
          </div>
          <div style={{ fontSize: 12, color: '#28a745' }}>
            Total Spent
          </div>
        </div>
      </div>

      {/* MONTH SELECTOR */}
      <div className="form-row">
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

      {/* CATEGORY CARDS */}
      <h3>Category Wise Expenses</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 15,
          marginBottom: 25,
        }}
      >
        {Object.entries(categoryTotals).map(([g, amt]) => (
          <div key={g} style={card}>
            <div style={{ fontSize: 14 }}>
              {CATEGORY_ICONS[g] || '📦'} {g}
            </div>

            <strong>₹{amt}</strong>

            {/* PROGRESS */}
            <div
              style={{
                height: 6,
                background: '#e9ecef',
                borderRadius: 4,
                marginTop: 8,
              }}
            >
              <div
                style={{
                  width: `${(amt / maxCategory) * 100}%`,
                  height: '100%',
                  background: '#007bff',
                  borderRadius: 4,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* RECENT TRANSACTIONS */}
      <h3>Recent Transactions</h3>
      <table className="expense-table">
        <thead>
          <tr>
            <th>Qty</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Bill</th>
          </tr>
        </thead>
        <tbody>
          {filteredExpenses.slice(0, 5).map((e) => (
            <tr key={e._id}>
              <td>{e.quantity}</td>
              <td>
                <div style={{ fontSize: 12, color: '#777' }}>
                  {CATEGORY_ICONS[e.group] || '📦'} {e.group}
                </div>
                <strong>{e.category}</strong>
              </td>
              <td>₹{e.amount}</td>
              <td>
                {new Date(e.date).toLocaleDateString()}
              </td>
              <td>
                {e.Image ? (
                  <img
                    src={e.Image}
                    alt="Bill"
                    className="bill-thumb"
                    onClick={() => setPreviewImage(e.Image)}
                  />
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* IMAGE PREVIEW */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={previewImage}
            alt="Preview"
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              borderRadius: 8,
            }}
          />
        </div>
      )}
    </div>
  );
}

/* CARD STYLE */
const card = {
  background: 'white',
  padding: 15,
  borderRadius: 10,
  boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
};

export default App;
