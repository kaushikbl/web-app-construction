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
  'Carpentry & Wood Work': '🪚',
  'Flooring': '🪵',
  'Metal & Fabrication': '🔩',
  'Exterior Works': '🌳',
  'Labor & Services': '👷',
  'Professional & Government': '📄',
  'Transport & Miscellaneous': '🚚',
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

  const add = async () => {
    if (!form.quantity || !form.category || !form.group || !form.amount) {
      alert('Please fill required fields');
      return;
    }

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));

    const res = await axios.post(`${API}/expenses`, fd);
    setExpenses((prev) => [res.data, ...prev]);

    setForm({
      quantity: '',
      category: '',
      group: '',
      amount: '',
      notes: '',
      Image: null,
    });

    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    await axios.delete(`${API}/expenses/${id}`);
    setExpenses((prev) => prev.filter((e) => e._id !== id));
  };

  /* ---------- MONTH FILTER ---------- */
  const filteredExpenses = selectedMonth
    ? expenses.filter((e) => {
        const d = new Date(e.date);
        return (
          d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') ===
          selectedMonth
        );
      })
    : expenses;

  /* ---------- METRICS ---------- */
  const total = filteredExpenses.reduce(
    (sum, e) => sum + Number(e.amount || 0),
    0
  );

  const groupTotals = filteredExpenses.reduce((acc, e) => {
    acc[e.group] = (acc[e.group] || 0) + Number(e.amount || 0);
    return acc;
  }, {});

  const maxGroupValue = Math.max(...Object.values(groupTotals), 1);

  /* ---------- AVAILABLE MONTHS ---------- */
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

      {/* SUMMARY */}
      <div className="form-row">
        <SummaryCard label="💰 Total Spent" value={`₹${total}`} />
        <SummaryCard label="📊 Entries" value={filteredExpenses.length} />
      </div>

      {/* ADD EXPENSE */}
      <div style={{ background: 'white', padding: 15, borderRadius: 8 }}>
        <h3>Add Expense</h3>
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
          <button className="btn-add" onClick={add}>
            Add Expense
          </button>
        </div>
      </div>

      {/* CATEGORY PROGRESS */}
      <h3 style={{ marginTop: 25 }}>Category Wise Expenses</h3>
      <div>
        {Object.entries(groupTotals).map(([g, amt]) => (
          <div
            key={g}
            style={{
              background: 'white',
              padding: 12,
              borderRadius: 8,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 6,
              }}
            >
              <span>
                {CATEGORY_ICONS[g] || '📦'} {g}
              </span>
              <strong>₹{amt}</strong>
            </div>

            {/* PROGRESS BAR */}
            <div
              style={{
                height: 8,
                background: '#e9ecef',
                borderRadius: 4,
              }}
            >
              <div
                style={{
                  width: `${(amt / maxGroupValue) * 100}%`,
                  height: '100%',
                  background: '#28a745',
                  borderRadius: 4,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* TABLE */}
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
              <td>
                {new Date(e.date).toLocaleDateString()}
              </td>
              <td>{e.notes}</td>
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

/* SUMMARY CARD */
const SummaryCard = ({ label, value }) => (
  <div
    style={{
      background: 'white',
      padding: 15,
      borderRadius: 8,
      flex: 1,
    }}
  >
    <div style={{ fontSize: 12, color: '#777' }}>{label}</div>
    <div style={{ fontSize: 18, fontWeight: 'bold' }}>{value}</div>
  </div>
);

export default App;
