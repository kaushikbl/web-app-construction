import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const API = '/api';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState({});
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

  /* ---------- DASHBOARD METRICS ---------- */

  const total = expenses.reduce(
    (sum, e) => sum + Number(e.amount || 0),
    0
  );

  const highest =
    expenses.length > 0
      ? Math.max(...expenses.map((e) => e.amount))
      : 0;

  const groupTotals = expenses.reduce((acc, e) => {
    acc[e.group] = (acc[e.group] || 0) + Number(e.amount || 0);
    return acc;
  }, {});

  return (
    <div className="container">
      <h1>Expense Dashboard</h1>

      {/* SUMMARY CARDS */}
      <div className="form-row">
        <SummaryCard label="Total Spent" value={`₹${total}`} />
        <SummaryCard label="Entries" value={expenses.length} />
        <SummaryCard label="Highest Expense" value={`₹${highest}`} />
      </div>

      {/* ADD EXPENSE */}
      <div
        style={{
          background: 'white',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        <h3 style={{ marginBottom: '10px' }}>Add Expense</h3>

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
            {Object.entries(categories).map(([group, items]) => (
              <optgroup key={group} label={group}>
                {items.map((c) => (
                  <option
                    key={c._id}
                    value={c.name}
                    data-group={group}
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

      {/* CATEGORY WISE SUMMARY */}
      <h3>Category Wise Expenses</h3>
      <div className="form-row">
        {Object.entries(groupTotals).map(([g, amt]) => (
          <SummaryCard key={g} label={g} value={`₹${amt}`} />
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
          {expenses.map((e) => (
            <tr key={e._id}>
              <td>{e.quantity}</td>
              <td>
                <div style={{ fontSize: '12px', color: '#777' }}>
                  {e.group}
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
              borderRadius: '8px',
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ---------- SMALL CARD ---------- */
const SummaryCard = ({ label, value }) => (
  <div
    style={{
      background: 'white',
      padding: '15px',
      borderRadius: '8px',
      flex: 1,
    }}
  >
    <div style={{ fontSize: '12px', color: '#777' }}>
      {label}
    </div>
    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
      {value}
    </div>
  </div>
);

export default App;
