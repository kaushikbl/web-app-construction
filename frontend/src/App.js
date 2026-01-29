import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const API = '/api';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState({}); // ✅ FIX: must be object
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const [form, setForm] = useState({
    quantity: '',
    category: '',
    group: '', // ✅ REQUIRED BY BACKEND
    amount: '',
    notes: '',
    Image: null,
  });

  useEffect(() => {
    loadCategories();
    loadExpenses();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await axios.get(`${API}/categories`);
      setCategories(res.data || {});
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

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

  const add = async () => {
    if (!form.quantity || !form.category || !form.amount || !form.group) {
      alert('Fill required fields');
      return;
    }

    const formData = new FormData();
    formData.append('quantity', form.quantity);
    formData.append('category', form.category);
    formData.append('group', form.group); // ✅ FIX
    formData.append('amount', Number(form.amount));
    formData.append('notes', form.notes);
    if (form.Image) {
      formData.append('Image', form.Image);
    }

    try {
      const res = await axios.post(`${API}/expenses`, formData);

      // ✅ SAFE STATE UPDATE
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
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this expense?')) return;

    try {
      await axios.delete(`${API}/expenses/${id}`);
      setExpenses((prev) => prev.filter((e) => e._id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete expense');
    }
  };

  const total = expenses.reduce(
    (sum, e) => sum + Number(e.amount || 0),
    0
  );

  return (
    <div className="container">
      <h1>Expense Dashboard</h1>

      <div className="form-row">
        <input
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

          {Object.entries(categories).map(([group, items]) =>
            Array.isArray(items) ? (
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
            ) : null
          )}
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
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={(e) =>
            setForm({ ...form, notes: e.target.value })
          }
        />

        <input
          type="file"
          onChange={(e) =>
            setForm({ ...form, Image: e.target.files[0] })
          }
        />

        <button className="btn-add" onClick={add}>
          Add
        </button>
      </div>

      <div className="total">Total: ₹{total}</div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="expense-table">
          <thead>
            <tr>
              <th>Quantity</th>
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
                <td>{e.notes || ''}</td>
                <td style={{ textAlign: 'center' }}>
                  {e.Image ? (
                    <img
                      src={e.Image}
                      alt="Bill"
                      style={{
                        width: '60px',
                        cursor: 'pointer',
                        borderRadius: '5px',
                      }}
                      onClick={() => setPreviewImage(e.Image)}
                    />
                  ) : (
                    <span style={{ color: '#999' }}>No Bill</span>
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
      )}

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
            zIndex: 9999,
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

export default App;
