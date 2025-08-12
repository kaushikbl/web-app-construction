import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const API = 'http://localhost:5000';

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
                <td>
                  {e.Image && (
                    <img
                      src={`${e.Image}`}
                      alt="View"
                      width="80"
                      style={{ borderRadius: '5px', cursor: 'pointer' }}
                      onClick={() => window.open(`${e.Image}`, '_blank')}
                    />
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
    </div>
  );
}

export default App;
