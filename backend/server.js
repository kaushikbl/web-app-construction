require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Category = require('./models/Category');

const app = express();
app.use(cors());
app.use(express.json());

/* ===== UPLOADS CONFIG ===== */
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

/* ===== DATABASE CONNECTION ===== */
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/house_expenses')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(console.error);

/* ===== UPDATED SCHEMA (With Vendor & Unit) ===== */
const expenseSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  vendor: { type: String, default: 'N/A' }, // Added Vendor support
  quantity: { type: Number, required: true },
  unit: { type: String, default: '' },      // Added Unit as text (not restricted to Ton)
  category: { type: String, required: true },
  group: { type: String, required: true },
  amount: { type: Number, required: true },
  notes: String,
  Image: String,
});

const Expense = mongoose.model('Expense', expenseSchema);

/* ===== MULTER STORAGE ===== */
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

/* ===== ADD EXPENSE ===== */
app.post('/api/expenses', upload.single('Image'), async (req, res) => {
  try {
    const { date, vendor, quantity, unit, category, group, amount, notes } = req.body;

    // Basic validation
    if (!quantity || !category || !group || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const imageUrl = req.file
      ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
      : null;

    const expense = new Expense({
      date: date || Date.now(),
      vendor: vendor || 'N/A',
      quantity: Number(quantity),
      unit: unit || '', // Saves custom units like 'Bags', 'CFT', etc.
      category,
      group,
      amount: Number(amount),
      notes,
      Image: imageUrl,
    });

    await expense.save();
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===== UPDATE EXPENSE ===== */
app.put('/api/expenses/:id', upload.single('Image'), async (req, res) => {
  try {
    const exp = await Expense.findById(req.params.id);
    if (!exp) return res.sendStatus(404);

    // Image cleanup logic
    if (req.file && exp.Image) {
      const oldFileName = path.basename(exp.Image);
      const oldPath = path.join(uploadDir, oldFileName);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    // Update fields
    exp.date = req.body.date || exp.date;
    exp.vendor = req.body.vendor || exp.vendor;
    exp.quantity = Number(req.body.quantity);
    exp.unit = req.body.unit || exp.unit;
    exp.category = req.body.category;
    exp.group = req.body.group;
    exp.amount = Number(req.body.amount);
    exp.notes = req.body.notes || exp.notes;

    if (req.file) {
      exp.Image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    await exp.save();
    res.json(exp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===== GET ALL EXPENSES ===== */
app.get('/api/expenses', async (_, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===== DELETE EXPENSE ===== */
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const exp = await Expense.findById(req.params.id);
    if (!exp) return res.sendStatus(404);

    if (exp.Image) {
      const imgPath = path.join(uploadDir, path.basename(exp.Image));
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await exp.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===== CATEGORIES LOGIC ===== */
app.get('/api/categories', async (_, res) => {
  try {
    const cats = await Category.find().sort({ name: 1 });
    const grouped = {};
    cats.forEach((c) => {
      if (!grouped[c.group]) grouped[c.group] = [];
      grouped[c.group].push(c);
    });
    res.json(grouped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===== SEED DATA ===== */
app.get('/api/seed/categories', async (_, res) => {
  const defaults = [
    { name: 'Carpenter Charges', group: 'Labor & Services' },
    { name: 'Mason Charges', group: 'Labor & Services' },
    { name: 'Water Tank', group: 'Plumbing' },
    { name: 'Steel (Fe 550)', group: 'Foundation & Structure' },
    { name: 'Cement', group: 'Foundation & Structure' },
    { name: 'M-Sand', group: 'Foundation & Structure' },
    { name: 'Plan Sanction', group: 'Government Fees' },
    { name: 'Architect Design', group: 'Architect Fees' },
    { name: 'Drilling & Casing', group: 'Borewell' }
  ];

  try {
    await Category.deleteMany({}); // Clear existing to prevent duplicates
    await Category.insertMany(defaults);
    res.json({ message: 'Categories seeded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===== SERVER START ===== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);