import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import './App.css';

const API = "/api";

function App() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const [form, setForm] = useState({
    quantity: '',
    category: '',
    amount: '',
    notes: '',
    Image: null,
  });

  useEffect(() => {
    fetch(`${API}/categories`)
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(console.error);

    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/expenses`);
      setExpenses(res.data);
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async () => {
    if (!form.quantity || !form.category || !form.amount) {
      alert('Fill required fields');
      return;
    }

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));

    const res = await axios.post(`${API}/expenses`, fd);
    setExpenses([res.data, ...expenses]);

    setForm({ quantity: '', category: '', amount: '', notes: '', Image: null });
    document.querySelector('input[type="file"]').value = '';
  };

  const removeExpense = async (id) => {
    if (!window.confirm('Delete expense?')) return;
    await axios.delete(`${API}/expenses/${id}`);
    setExpenses(expenses.filter(e => e._id !== id));
  };

  // 🔥 GROUP EXPENSES BY CATEGORY
  const groupedExpenses = useMemo(() => {
    return expenses.reduce((acc, e) => {
      acc[e.category] = acc[e.category] || [];
      acc[e.category].push(e);
      return acc;
    }, {});
  }, [expenses]);

  const grandTotal = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div className="container">
      <h1>Expense Dashboard</h1>

      {/* ================= FORM ================= */}
      <div className="form-row">
        <input
          placeholder="Quantity"
          value={form.quantity}
          onChange={e => setForm({ ...form, quantity: e.target.value })}
        />

        <select
          value={form.category}
          onChange={e => setForm({ ...form, category: e.target.value })}
        >
          <option value="">Select Category</option>
          {Object.entries(categories).map(([group, items]) => (
            <optgroup key={group} label={group}>
              {items.map(cat => (
                <option key={cat._id} value={cat.name}>{cat.name}</option>
              ))}
            </optgroup>
          ))}
        </select>

        <input
          type="number"
          placeholder="Amount"
          value={form.amount}
          onChange={e => setForm({ ...form, amount: e.target.value })}
        />

        <input
          placeholder="Notes"
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
        />

        <input
          type="file"
          onChange={e => setForm({ ...form, Image: e.target.files[0] })}
        />

        <button className="btn-add" onClick={addExpense}>Add</button>
      </div>

      <div className="total">Grand Total: ₹{grandTotal}</div>

      {/* ================= TABLE ================= */}
      {loading ? <div>Loading...</div> : (
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
            {Object.entries(groupedExpenses).map(([category, items]) => {
              const subTotal = items.reduce((s, e) => s + e.amount, 0);

              return (
                <React.Fragment key={category}>
                  {/* CATEGORY HEADER */}
                  <tr className="group-header">
                    <td colSpan="7">
                      <strong>{category}</strong> — Subtotal: ₹{subTotal}
                    </td>
                  </tr>

                  {/* CATEGORY ROWS */}
                  {items.map(e => (
                    <tr key={e._id}>
                      <td>{e.quantity}</td>
                      <td>{e.category}</td>
                      <td>₹{e.amount}</td>
                      <td>{new Date(e.date).toLocaleDateString()}</td>
                      <td>{e.notes}</td>
                      <td>
                        {e.Image ? (
                          <img
                            src={e.Image}
                            alt="bill"
                            style={{ width: 50, cursor: 'pointer' }}
                            onClick={() => setPreviewImage(e.Image)}
                          />
                        ) : 'No Bill'}
                      </td>
                      <td>
                        <button onClick={() => removeExpense(e._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      )}

      {/* ================= IMAGE MODAL ================= */}
      {previewImage && (
        <div className="modal" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="Preview" />
        </div>
      )}
    </div>
  );
}

export default App;
