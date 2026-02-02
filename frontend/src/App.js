import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const API = '/api';

/* ===== PROJECT CONFIG ===== */
const PROJECT_BUDGET = 11200000;
const PROJECT_DURATION_MONTHS = 12;
const MONTH_BUDGET = Math.round(PROJECT_BUDGET / PROJECT_DURATION_MONTHS);

/* ===== ROLE CONFIG ===== */
const ADMIN_USERS = ['kaushik', 'shruthi'];

/* ===== CATEGORY ICONS ===== */
const CATEGORY_ICONS = {
  'Foundation & Structure': '🏗️',
  Masonry: '🧱',
  Roofing: '🏠',
  Plumbing: '🚰',
  Electrical: '💡',
  'Labor & Services': '👷',
  'Transport & Miscellaneous': '🚚',
  'Professional & Government': '📄',
  'Site Preparation': '🚜',
  'Carpentry & Wood Work': '🪚',
  'Metal & Fabrication': '🔩',
  'Exterior Works': '🌳',
};

function App() {
  /* ===== LOGIN ===== */
  const [user, setUser] = useState(
    localStorage.getItem('userName')
      ? { name: localStorage.getItem('userName') }
      : null
  );
  const [loginName, setLoginName] = useState('');

  const isAdmin =
    user && ADMIN_USERS.includes(user.name.toLowerCase());

  /* ===== DATA ===== */
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState({});
  const [selectedMonth, setSelectedMonth] = useState('');
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

  /* ===== LOAD ===== */
  useEffect(() => {
    if (user) {
      loadCategories();
      loadExpenses();
    }
  }, [user]);

  const loadCategories = async () => {
    const res = await axios.get(`${API}/categories`);
    setCategories(res.data || {});
  };

  const loadExpenses = async () => {
    const res = await axios.get(`${API}/expenses`);
    setExpenses(res.data);
  };

  /* ===== LOGIN HANDLERS ===== */
  const handleLogin = () => {
    if (!loginName.trim()) {
      alert('Enter name');
      return;
    }
    localStorage.setItem('userName', loginName);
    setUser({ name: loginName });
  };

  const handleLogout = () => {
    localStorage.removeItem('userName');
    setUser(null);
  };

  /* ===== IMAGE FIX ===== */
  const getImageUrl = (img) => {
    if (!img) return null;
    if (img.includes('/uploads/')) {
      return img.substring(img.indexOf('/uploads/'));
    }
    return img;
  };

  /* ===== ADD / UPDATE (ADMIN ONLY) ===== */
  const submit = async () => {
    if (!isAdmin) return;

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
    if (!isAdmin) return;
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

  const remove = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm('Delete expense?')) return;
    await axios.delete(`${API}/expenses/${id}`);
    setExpenses((p) => p.filter((e) => e._id !== id));
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
  };

  /* ===== MONTH FILTER ===== */
  const year = new Date().getFullYear();
  const months = Array.from({ length: 12 }, (_, i) =>
    `${year}-${String(i + 1).padStart(2, '0')}`
  );

  const filteredExpenses = selectedMonth
    ? expenses.filter((e) => {
        const d = new Date(e.date);
        return (
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` ===
          selectedMonth
        );
      })
    : expenses;

  /* ===== METRICS ===== */
  const monthlySpent = filteredExpenses.reduce(
    (s, e) => s + Number(e.amount || 0),
    0
  );

  const monthlyPercent = Math.min(
    Math.round((monthlySpent / MONTH_BUDGET) * 100),
    100
  );

  const totalProjectSpent = expenses.reduce(
    (s, e) => s + Number(e.amount || 0),
    0
  );

  const projectPercent = Math.round(
    (totalProjectSpent / PROJECT_BUDGET) * 100
  );

  const projectStatus =
    projectPercent >= 100
      ? 'Over Budget'
      : projectPercent >= 85
      ? 'At Risk'
      : 'On Track';

  /* ===== LOGIN PAGE ===== */
  if (!user) {
    return (
      <div className="container" style={{ maxWidth: 400, marginTop: 120 }}>
        <div style={card}>
          <h2>Login</h2>
          <input
            placeholder="Enter name"
            value={loginName}
            onChange={(e) => setLoginName(e.target.value)}
          />
          <button className="btn-add" onClick={handleLogin} style={{ width: '100%', marginTop: 10 }}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  /* ===== DASHBOARD ===== */
  return (
    <div className="container">
      <h1>Expense Dashboard</h1>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div style={card}>
          <strong>{user.name}</strong>
          <div style={muted}>Residential Building (G+3)</div>
          <div style={muted}>
            Access: {isAdmin ? 'Admin' : 'Read Only'}
          </div>
          <button className="btn-delete" onClick={handleLogout} style={{ marginTop: 10 }}>
            Logout
          </button>
        </div>

        <div style={{ ...card, textAlign: 'center' }}>
          <div style={muted}>Monthly Budget</div>
          <CircularGauge percent={monthlyPercent} />
          <div style={muted}>
            ₹{monthlySpent.toLocaleString()} / ₹{MONTH_BUDGET.toLocaleString()}
          </div>
        </div>

        <div style={card}>
          <h4>Project Status</h4>
          <div>Spent: ₹{totalProjectSpent.toLocaleString()}</div>
          <div>Used: {projectPercent}%</div>
          <strong style={{ color: projectStatus === 'Over Budget' ? '#dc3545' : projectStatus === 'At Risk' ? '#ffc107' : '#28a745' }}>
            {projectStatus}
          </strong>
        </div>
      </div>

      {/* ===== ADD FORM (ADMIN ONLY) ===== */}
      {isAdmin && (
        <div style={{ ...card, marginBottom: 20 }}>
          <h3>{editing ? 'Edit Expense' : 'Add Expense'}</h3>
          <div className="form-row">
            <input placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, group: e.target.selectedOptions[0].dataset.group })}>
              <option value="">Category</option>
              {Object.entries(categories).map(([g, items]) => (
                <optgroup key={g} label={g}>
                  {items.map((c) => (
                    <option key={c._id} value={c.name} data-group={g}>{c.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="form-row">
            <input type="file" onChange={(e) => setForm({ ...form, Image: e.target.files[0] })} />
            <button className="btn-add" onClick={submit}>{editing ? 'Update' : 'Add'}</button>
          </div>
        </div>
      )}

      {/* ===== TABLE ===== */}
      <table className="expense-table">
        <thead>
          <tr>
            <th>Qty</th><th>Category</th><th>Amount</th><th>Date</th><th>Notes</th><th>Bill</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredExpenses.map((e) => {
            const imgUrl = getImageUrl(e.Image);
            return (
              <tr key={e._id}>
                <td>{e.quantity}</td>
                <td><strong>{e.category}</strong></td>
                <td>₹{e.amount.toLocaleString()}</td>
                <td>{new Date(e.date).toLocaleDateString()}</td>
                <td>{e.notes || '—'}</td>
                <td>{imgUrl ? <img src={imgUrl} className="bill-thumb" onClick={() => setPreviewImage(imgUrl)} /> : '—'}</td>
                <td>
                  {isAdmin ? (
                    <>
                      <button className="btn-add" onClick={() => editExpense(e)}>Edit</button>{' '}
                      <button className="btn-delete" onClick={() => remove(e._id)}>Delete</button>
                    </>
                  ) : (
                    <span style={muted}>View only</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {previewImage && (
        <div style={overlay} onClick={() => setPreviewImage(null)}>
          <img src={previewImage} style={previewImg} />
        </div>
      )}
    </div>
  );
}

/* ===== COMPONENTS ===== */
const CircularGauge = ({ percent }) => (
  <div style={{
    width: 120, height: 120, borderRadius: '50%',
    background: `conic-gradient(#007bff ${percent}%, #e9ecef 0)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  }}>
    <div style={{
      width: 90, height: 90, borderRadius: '50%',
      background: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 'bold'
    }}>
      {percent}%
    </div>
  </div>
);

const card = { background: 'white', padding: 15, borderRadius: 10 };
const muted = { fontSize: 12, color: '#777' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 };
const previewImg = { maxWidth: '90%', maxHeight: '90%', borderRadius: 8 };

export default App;
