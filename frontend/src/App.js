import React, { useEffect, useState } from 'react';
import axios from 'axios';

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
      alert('Fill required fields');
      return;
    }

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));

    const res = await axios.post(`${API}/expenses`, fd);
    setExpenses((p) => [res.data, ...p]);

    setForm({
      quantity: '',
      category: '',
      group: '',
      amount: '',
      notes: '',
      Image: null,
    });
  };

  const remove = async (id) => {
    if (!window.confirm('Delete expense?')) return;
    await axios.delete(`${API}/expenses/${id}`);
    setExpenses((p) => p.filter((e) => e._id !== id));
  };

  /* ---------- DASHBOARD CALCULATIONS ---------- */

  const totalAmount = expenses.reduce(
    (s, e) => s + Number(e.amount || 0),
    0
  );

  const highestExpense =
    expenses.length > 0
      ? Math.max(...expenses.map((e) => e.amount))
      : 0;

  const categoryTotals = expenses.reduce((acc, e) => {
    acc[e.group] = (acc[e.group] || 0) + Number(e.amount || 0);
    return acc;
  }, {});

  /* ---------- UI ---------- */

  return (
    <div style={page}>
      <h1 style={{ marginBottom: 20 }}>Expense Dashboard</h1>

      {/* SUMMARY ROW */}
      <div style={summaryRow}>
        <SummaryCard title="Total Spent" value={`₹${totalAmount}`} />
        <SummaryCard title="Entries" value={expenses.length} />
        <SummaryCard title="Highest Expense" value={`₹${highestExpense}`} />
      </div>

      {/* ADD EXPENSE CARD */}
      <div style={card}>
        <h3>Add Expense</h3>
        <div style={formGrid}>
          <input
            placeholder="Qty"
            type="number"
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
            placeholder="Amount"
            type="number"
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

        <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
          <input
            type="file"
            onChange={(e) =>
              setForm({ ...form, Image: e.target.files[0] })
            }
          />
          <button onClick={add} style={addBtn}>
            Add Expense
          </button>
        </div>
      </div>

      {/* CATEGORY WISE CARDS */}
      <h3 style={{ marginTop: 30 }}>Category Wise Expenses</h3>
      <div style={categoryGrid}>
        {Object.entries(categoryTotals).map(([g, amt]) => (
          <div key={g} style={categoryCard}>
            <div style={{ fontSize: 12, color: '#777' }}>{g}</div>
            <div style={{ fontSize: 18, fontWeight: 'bold' }}>
              ₹{amt}
            </div>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div style={card}>
        <table style={table}>
          <thead>
            <tr style={thead}>
              <th>Qty</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Bill</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e._id} style={row}>
                <td>{e.quantity}</td>
                <td>
                  <div style={groupText}>{e.group}</div>
                  <b>{e.category}</b>
                </td>
                <td>₹{e.amount}</td>
                <td>
                  {new Date(e.date).toLocaleDateString()}
                </td>
                <td>
                  {e.Image ? (
                    <img
                      src={e.Image}
                      alt=""
                      style={bill}
                      onClick={() =>
                        setPreviewImage(e.Image)
                      }
                    />
                  ) : (
                    '—'
                  )}
                </td>
                <td>
                  <button
                    style={deleteBtn}
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

      {/* IMAGE PREVIEW */}
      {previewImage && (
        <div style={overlay} onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="" style={preview} />
        </div>
      )}
    </div>
  );
}

/* ---------- SMALL COMPONENT ---------- */
const SummaryCard = ({ title, value }) => (
  <div style={summaryCard}>
    <div style={{ fontSize: 12, color: '#777' }}>{title}</div>
    <div style={{ fontSize: 20, fontWeight: 'bold' }}>{value}</div>
  </div>
);

/* ---------- STYLES ---------- */

const page = { maxWidth: 1200, margin: '30px auto', fontFamily: 'Arial' };
const card = {
  background: '#fff',
  padding: 16,
  borderRadius: 10,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  marginBottom: 20,
};

const summaryRow = { display: 'flex', gap: 16 };
const summaryCard = {
  flex: 1,
  background: '#fff',
  padding: 16,
  borderRadius: 10,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

const formGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 2fr 1fr 2fr',
  gap: 10,
};

const addBtn = {
  background: '#28a745',
  color: '#fff',
  border: 'none',
  padding: '8px 16px',
  borderRadius: 6,
  cursor: 'pointer',
};

const categoryGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: 16,
};

const categoryCard = {
  background: '#fff',
  padding: 16,
  borderRadius: 10,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

const table = { width: '100%', borderCollapse: 'collapse' };
const thead = { background: '#f4f6f8' };
const row = { borderTop: '1px solid #eee' };
const groupText = { fontSize: 12, color: '#777' };
const bill = { width: 40, cursor: 'pointer' };
const deleteBtn = {
  background: '#dc3545',
  color: '#fff',
  border: 'none',
  padding: '5px 10px',
  borderRadius: 5,
};

const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.8)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const preview = { maxWidth: '90%', maxHeight: '90%' };

export default App;
