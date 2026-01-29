import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const API = '/api';

/* CATEGORY ICONS */
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

const MONTH_BUDGET = 100000; // 👈 change your monthly budget here

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

  /* ADD / UPDATE */
  const submit = async () => {
    if (!form.quantity || !form.category || !form.group || !form.amount) {
      alert('Please fill required fields');
      return;
    }

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));

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
    setExpenses((prev) => prev.filter((e) => e._id !== id));
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

  const budgetPercent = Math.min(
    Math.round((totalSpent / MONTH_BUDGET) * 100),
    100
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
      <h1>Expense Dashboard</h1>

      {/* TOP DASHBOARD */}
      <div style={{ display: 'flex', gap: 15, marginBottom: 20 }}>
        <DashboardCard
          title="Good Morning 👋"
          value="Kaushik"
          subtitle="Track your construction expenses"
        />

        {/* CIRCULAR BUDGET GAUGE */}
        <div style={card}>
          <div style={{ fontSize: 12, color: '#777' }}>
            Budget vs Expense
          </div>
          <CircularGauge percent={budgetPercent} />
          <div style={{ fontSize: 12, textAlign: 'center' }}>
            ₹{totalSpent} / ₹{MONTH_BUDGET}
          </div>
        </div>
      </div>

      {/* MONTH SELECT */}
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

      {/* ADD / EDIT FORM */}
      <div style={{ background: 'white', padding: 15, borderRadius: 8 }}>
        <h3>{editing ? 'Edit Expense' : 'Add Expense'}</h3>

        <div className="form-row">
          <input
            type="number"
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
                  <option
                    key={c._id}
                    value={c.name}
                    data-group={g}
                  >
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
            {editing ? 'Update Expense' : 'Add Expense'}
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

      {/* CATEGORY PROGRESS */}
      <h3 style={{ marginTop: 20 }}>Category Wise Expenses</h3>
      {Object.entries(categoryTotals).map(([g, amt]) => (
        <div
          key={g}
          style={{
            background: 'white',
            padding: 12,
            borderRadius: 8,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>
              {CATEGORY_ICONS[g] || '📦'} {g}
            </span>
            <strong>₹{amt}</strong>
          </div>

          <div
            style={{
              height: 6,
              background: '#e9ecef',
              borderRadius: 4,
              marginTop: 5,
            }}
          >
            <div
              style={{
                width: `${(amt / maxCategory) * 100}%`,
                height: '100%',
                background: '#28a745',
                borderRadius: 4,
              }}
            />
          </div>
        </div>
      ))}

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
            <th>Action</th>
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
              <td>
                <button
                  className="btn-add"
                  onClick={() => editExpense(e)}
                >
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

/* ---------- COMPONENTS ---------- */

const DashboardCard = ({ title, value, subtitle }) => (
  <div style={card}>
    <div style={{ fontSize: 14 }}>{title}</div>
    <div style={{ fontSize: 18, fontWeight: 'bold' }}>{value}</div>
    <div style={{ fontSize: 12, color: '#777' }}>{subtitle}</div>
  </div>
);

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

/* ---------- STYLES ---------- */
const card = {
  background: 'white',
  padding: 15,
  borderRadius: 10,
  flex: 1,
};

export default App;
