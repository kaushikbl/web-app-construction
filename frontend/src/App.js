import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css'; // we'll create this file
const API = 'http://localhost:5000/api';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ item: '', category: '', amount: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    load();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await axios.get(`${API}/categories`);
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const load = async () => {
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
    if (!form.item || !form.category || !form.amount) return alert('Fill required fields');
    const payload = { ...form, amount: Number(form.amount) };
    const res = await axios.post(`${API}/expenses`, payload);
    setExpenses([res.data, ...expenses]);
    setForm({ item: '', category: '', amount: '', notes: '' });
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    await axios.delete(`${API}/expenses/${id}`);
    setExpenses(expenses.filter(e => e._id !== id));
  };

  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div className="container">
      <h1>🏗 House Construction Expenses</h1>

      <div className="form-row">
        <input placeholder="Item" value={form.item} onChange={e => setForm({ ...form, item: e.target.value })} />
        
        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
          <option value="">Select Category</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat.name}>{cat.name}</option>
          ))}
        </select>

        <input placeholder="Amount" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
        
        <input placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        
        <button className="btn-add" onClick={add}>Add</button>
      </div>

      <div className="total">Total: ₹{total}</div>

      {loading ? <div>Loading...</div> : (
        <table className="expense-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Notes</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(e => (
              <tr key={e._id}>
                <td>{e.item}</td>
                <td>{e.category}</td>
                <td>₹{e.amount}</td>
                <td>{new Date(e.date).toLocaleDateString()}</td>
                <td>{e.notes || ''}</td>
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
