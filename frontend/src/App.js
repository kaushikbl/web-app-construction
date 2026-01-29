import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = '/api';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    const res = await axios.get(`${API}/expenses`);
    setExpenses(res.data);
    setLoading(false);
  };

  const add = async () => {
    if (!form.quantity || !form.category || !form.group || !form.amount) {
      alert('Please fill all required fields');
      return;
    }

    const fd = new FormData();
    Object.keys(form).forEach((k) => {
      if (form[k]) fd.append(k, form[k]);
    });

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

    const f = document.querySelector('input[type="file"]');
    if (f) f.value = '';
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    await axios.delete(`${API}/expenses/${id}`);
    setExpenses((prev) => prev.filter((e) => e._id !== id));
  };

  const total = expenses.reduce(
    (sum, e) => sum + Number(e.amount || 0),
    0
  );

  return (
    <div style={page}>
      <h1 style={{ marginBottom: 20 }}>Expense Dashboard</h1>

      {/* FORM CARD */}
      <div style={card}>
        <div style={formGrid}>
          <input
            type="number"
            placeholder="Quantity"
            value={form.quantity}
            onChange={(e) =>
              setForm({ ...form, quantity: e.target.value })
            }
            style={input}
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
            style={input}
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
            style={input}
          />

          <input
            placeholder="Notes"
            value={form.notes}
            onChange={(e) =>
              setForm({ ...form, notes: e.target.value })
            }
            style={input}
          />
        </div>

        <div style={formBottom}>
          <input
            type="file"
            onChange={(e) =>
              setForm({ ...form, Image: e.target.files[0] })
            }
          />

          <button onClick={add} style={addBtn}>
            Add
          </button>

          <div style={totalBox}>Total: ₹{total}</div>
        </div>
      </div>

      {/* TABLE CARD */}
      <div style={card}>
        <table style={table}>
          <thead>
            <tr style={thead}>
              <th style={th}>Qty</th>
              <th style={th}>Category</th>
              <th style={th}>Amount</th>
              <th style={th}>Date</th>
              <th style={th}>Notes</th>
              <th style={th}>Bill</th>
              <th style={th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={center}>
                  Loading...
                </td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan="7" style={center}>
                  No expenses yet
                </td>
              </tr>
            ) : (
              expenses.map((e) => (
                <tr key={e._id} style={row}>
                  <td style={td}>{e.quantity}</td>

                  <td style={td}>
                    <div style={groupText}>{e.group}</div>
                    <div style={categoryText}>{e.category}</div>
                  </td>

                  <td style={{ ...td, fontWeight: 'bold' }}>
                    ₹{e.amount}
                  </td>
                  <td style={td}>
                    {new Date(e.date).toLocaleDateString()}
                  </td>
                  <td style={td}>{e.notes}</td>
                  <td style={td}>
                    {e.Image ? (
                      <img
                        src={e.Image}
                        alt="Bill"
                        style={bill}
                        onClick={() => setPreviewImage(e.Image)}
                      />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={td}>
                    <button
                      onClick={() => remove(e._id)}
                      style={deleteBtn}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* IMAGE PREVIEW */}
      {previewImage && (
        <div style={overlay} onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="Preview" style={preview} />
        </div>
      )}
    </div>
  );
}

/* ---------- STYLES (INLINE, SAFE) ---------- */

const page = {
  maxWidth: 1200,
  margin: '30px auto',
  fontFamily: 'Arial, sans-serif',
};

const card = {
  background: '#fff',
  padding: 16,
  borderRadius: 10,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  marginBottom: 20,
};

const formGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 2fr 1fr 2fr',
  gap: 12,
};

const formBottom = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginTop: 12,
};

const input = {
  padding: 8,
  borderRadius: 6,
  border: '1px solid #ccc',
};

const addBtn = {
  background: '#28a745',
  color: '#fff',
  border: 'none',
  padding: '8px 18px',
  borderRadius: 6,
  cursor: 'pointer',
  fontWeight: 'bold',
};

const totalBox = {
  marginLeft: 'auto',
  fontSize: 18,
  fontWeight: 'bold',
  color: '#28a745',
};

const table = {
  width: '100%',
  borderCollapse: 'collapse',
};

const thead = {
  background: '#f4f6f8',
};

const th = {
  padding: 12,
  textAlign: 'left',
};

const td = {
  padding: 12,
  fontSize: 14,
};

const row = {
  borderTop: '1px solid #eee',
};

const center = {
  textAlign: 'center',
  padding: 20,
};

const groupText = {
  fontSize: 12,
  color: '#777',
};

const categoryText = {
  fontWeight: 600,
};

const bill = {
  width: 40,
  borderRadius: 4,
  cursor: 'pointer',
};

const deleteBtn = {
  background: '#dc3545',
  color: '#fff',
  border: 'none',
  padding: '6px 12px',
  borderRadius: 6,
  cursor: 'pointer',
};

const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.8)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,
};

const preview = {
  maxWidth: '90%',
  maxHeight: '90%',
  borderRadius: 8,
};

export default App;
