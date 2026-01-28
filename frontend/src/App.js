import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const API = '/api';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
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

  /* =======================
     Load categories & expenses
     ======================= */
  useEffect(() => {
    fetch(`${API}/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch(console.error);

    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/expenses`);
      setExpenses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     Group categories for UI
     ======================= */
  const groupedCategories = categories.reduce((acc, cat) => {
    const group = cat.group || 'Others';
    if (!acc[group]) acc[group] = [];
    acc[group].push(cat);
    return acc;
  }, {});

  /* =======================
     Add expense
     ======================= */
  const addExpense = async () => {
    if (!form.quantity || !form.category || !form.amount) {
      alert('Fill required fields');
      return;
    }

    const formData = new FormData();
    formData.append('quantity', form.quantity);
    formData.append('category', form.category);
    formData.append('group', form.group);
    formData.append('amount', form.amount);
    formData.append('notes', form.notes);
    if (form.Image) formData.append('Image', form.Image);

    try {
      const res = await axios.post(`${API}/expenses`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setExpenses([res.data, ...expenses]);
      setForm({
        quantity: '',
        category: '',
        group: '',
        amount: '',
        notes: '',
        Image: null,
      });

      document.querySelector('input[type="file"]').value = '';
    } catch (err) {
      console.error(err);
    }
  };

  /* =======================
     Delete expense
     ======================= */
  const removeExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    await axios.delete(`${API}/expenses/${id}`);
    setExpenses(expenses.filter((e) => e._id !== id));
  };

  const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  /* =======================
     UI
     ======================= */
  return (
    <div className="container">
      <h1>Expense Dashboard</h1>

      {/* ===== Form ===== */}
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

          {Object.entries(groupedCategories).map(([group, items]) => (
            <optgroup key={group} label={group}>
              {items.map((cat) => (
                <option
                  key={cat._id}
                  value={cat.name}
                  data-group={group}
                >
                  {cat.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <input
          placeholder="Amount"
          type="number"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />

        <input
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />

        <input
          type="file"
          onChange={(e) => setForm({ ...form, Image: e.target.files[0] })}
        />

        <button className="btn-add" onClick={addExpense}>
          Add
        </button>
      </div>

      <div className="total">Total: ₹{total}</div>

      {/* ===== Table ===== */}
      {loading ? (
        <div>Loading...</div>
      ) : (
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
                <td>{e.notes}</td>
                <td>
                  {e.Image ? (
                    <img
                      src={e.Image}
                      alt="Bill"
                      width="50"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setPreviewImage(e.Image)}
                    />
                  ) : (
                    'No Bill'
                  )}
                </td>
                <td>
                  <button
                    className="btn-delete"
                    onClick={() => removeExpense(e._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ===== Image Preview ===== */}
      {previewImage && (
        <div
          className="modal"
          onClick={() => setPreviewImage(null)}
        >
          <img src={previewImage} alt="Preview" />
        </div>
      )}
    </div>
  );
}

export default App;