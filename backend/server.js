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

/* ===== UPLOADS ===== */
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

/* ===== DB ===== */
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/house_expenses')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(console.error);

/* ===== MODEL ===== */
const expenseSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  vendor: { type: String, default: '' },   // Added Vendor
  quantity: { type: Number, required: true },
  unit: { type: String, default: '' },     // Added Unit as String (not Ton only)
  category: { type: String, required: true },
  group: { type: String, required: true },
  amount: { type: Number, required: true },
  notes: String,
  Image: String,
});

const Expense = mongoose.model('Expense', expenseSchema);

/* ===== MULTER ===== */
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

    if (!category || !group || !amount || !quantity) {
  return res.status(400).json({
    error: 'Category, Group, Quantity and Amount are required'
  });
}
    
    const imageUrl = req.file
      ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
      : null;

    const expense = new Expense({
      date: date || Date.now(),
      vendor: vendor || 'N/A',
      quantity: Number(quantity),
      unit: unit || '',
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

    if (req.file && exp.Image) {
      const oldPath = path.join(uploadDir, path.basename(exp.Image));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

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

app.get('/api/expenses', async (_, res) => {
  const expenses = await Expense.find().sort({ date: -1 });
  res.json(expenses);
});

app.delete('/api/expenses/:id', async (req, res) => {
  const exp = await Expense.findById(req.params.id);
  if (!exp) return res.sendStatus(404);
  if (exp.Image) {
    const img = path.join(uploadDir, path.basename(exp.Image));
    if (fs.existsSync(img)) fs.unlinkSync(img);
  }
  await exp.deleteOne();
  res.json({ success: true });
});

app.get('/api/categories', async (_, res) => {
  const cats = await Category.find().sort({ name: 1 });
  const grouped = {};
  cats.forEach((c) => {
    if (!grouped[c.group]) grouped[c.group] = [];
    grouped[c.group].push(c);
  });
  res.json(grouped);
});

/* ===== FULL CONSTRUCTION SEED ===== */
app.get('/api/seed/categories', async (_, res) => {
  const defaults = [
    { name: 'Steel', group: 'Foundation & Structure' },
    { name: 'Cement', group: 'Foundation & Structure' },
    { name: 'M-Sand', group: 'Foundation & Structure' },
    { name: 'Red Bricks', group: 'Masonry' },
    { name: 'Labor Wages', group: 'Labor & Services' },
    { name: 'Contractor Payment', group: 'Labor & Services' },
    { name: 'Plan Sanction Fee', group: 'Government Fees' },
    { name: 'Electrical Wiring', group: 'Electrical' },
    { name: 'Architect Fee', group: 'Architect Fees' },
    { name: 'Casing Pipe', group: 'Borewell' }
  ];
  await Category.deleteMany({});
  await Category.insertMany(defaults);
  res.json({ message: 'Construction Categories seeded' });
});


app.get('/health', (_, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'backend'
  });
});
app.listen(5000, () => console.log('🚀 Server running on http://localhost:5000'));