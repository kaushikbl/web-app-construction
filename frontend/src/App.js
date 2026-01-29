import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const API = '/api';

/* ===== PROJECT INFO ===== */
const PROJECT_BUDGET = 11200000;
const PROJECT_INFO = {
  name: 'Residential House Construction',
  location: 'Bengaluru',
  type: 'Independent House (Split / G+1 / G+2 / G+3)',
};

function App() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState({});
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

  return (
    <div className="container" style={{ maxWidth: 1200 }}>
      <h1>Construction Expense Dashboard</h1>

      {/* ===== ADD / EDIT ===== */}
      <div className="card">
        <h3>{editing ? 'Edit Expense' : 'Add Expense'}</h3>

        <div className="form-row">
          <input
            placeholder="Quantity"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
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
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />

          <input
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <div className="form-row">
          <input
            type="file"
            onChange={(e) => setForm({ ...form, Image: e.target.files[0] })}
          />

          <button className="btn-add" onClick={submit}>
            {editing ? 'Update' : 'Add'}
          </button>

          {editing && (
            <button className="btn-delete" onClick={() => setEditing(null)}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* ===== TABLE ===== */}
      <h3 style={{ marginTop: 30 }}>Expense Details</h3>
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
              <td>{e.category}</td>
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
                ) : (
                  '—'
                )}
              </td>
              <td>
                <button className="btn-add" onClick={() => editExpense(e)}>
                  Edit
                </button>{' '}
                <button className="btn-delete" onClick={() => remove(e._id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ===== IMAGE PREVIEW MODAL ===== */}
      {previewImage && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <button
              style={closeBtn}
              onClick={() => setPreviewImage(null)}
            >
              ✕
            </button>
            <img src={previewImage} alt="Preview" style={modalImg} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== MODAL STYLES ===== */
const modalOverlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.85)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 99999,
};

const modalBox = {
  position: 'relative',
  background: '#fff',
  padding: 10,
  borderRadius: 8,
  maxWidth: '90%',
  maxHeight: '90%',
};

const modalImg = {
  maxWidth: '100%',
  maxHeight: '80vh',
  borderRadius: 6,
};

const closeBtn = {
  position: 'absolute',
  top: 6,
  right: 10,
  border: 'none',
  background: 'transparent',
  fontSize: 22,
  cursor: 'pointer',
};

export default App;
