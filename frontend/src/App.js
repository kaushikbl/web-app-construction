import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const API = 'http://backend:5000';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({
    quantity: '',
    category: '',
    amount: '',
    notes: '',
    Image: null
  });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [previewImage, setPreviewImage] = useState(null); // For modal preview

  useEffect(() => {
    load();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await axios.get(`${API}/api/categories`);
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/expenses`);
      setExpenses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const add = async () => {
    if (!form.quantity || !form.category || !form.amount) {
      return alert('Fill required fields');
    }

    const formData = new FormData();
    formData.append('quantity', form.quantity);
    formData.append('category', form.category);
    formData.append('amount', form.amount);
    formData.append('notes', form.notes);
    if (form.Image) {
      formData.append('Image', form.Image);
    }

    try {
      const res = await axios.post(`${API}/api/expenses`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setExpenses([res.data, ...expenses]);
      setForm({ quantity: '', category: '', amount: '', notes: '', Image: null });
      document.querySelector('input[type="file"]').value = ''; // clear file preview
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    await axios.delete(`${API}/api/expenses/${id}`);
    setExpenses(expenses.filter(e => e._id !== id));
  };

  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div className="container">
      <h1>🏗 House Construction Expenses</h1>

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
          {categories.map(cat => (
            <option key={cat._id} value={cat.name}>{cat.name}</option>
          ))}
        </select>

        <input
          placeholder="Amount"
          type="number"
          value={form.amount}
          onChange={e => setForm({ ...form, amount: e.target.value })}
        />

        <input
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
        />

        <input
          type="file"
          onChange={e => setForm({ ...form, Image: e.target.files[0] })}
        />

        <button className="btn-add" onClick={add}>Add</button>
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
            {expenses.map(e => (
              <tr key={e._id}>
                <td>{e.quantity}</td>
                <td>{e.category}</td>
                <td>₹{e.amount}</td>
                <td>{new Date(e.date).toLocaleDateString()}</td>
                <td>{e.notes || ''}</td>
                <td style={{ textAlign: 'center', verticalAlign: 'middle', width: '80px' }}>
                  {e.Image ? (
                    <img
                      src={e.Image}
                      alt="Bill"
                      style={{
                        width: '60px',
                        height: 'auto',
                        cursor: 'pointer',
                        borderRadius: '5px',
                        transition: 'transform 0.2s'
                      }}
                      onClick={() => setPreviewImage(e.Image)}
                      onMouseOver={e => e.target.style.transform = 'scale(1.2)'}
                      onMouseOut={e => e.target.style.transform = 'scale(1)'}
                    />
                  ) : (
                    <span style={{ color: '#999', fontSize: '0.85em' }}>No Bill</span>
                  )}
                </td>
                <td>
                  <button className="btn-delete" onClick={() => remove(e._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal Preview */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <img
            src={previewImage}
            alt="Preview"
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              borderRadius: '8px'
            }}
          />
        </div>
      )}
    </div>
  );
}

export default App;
