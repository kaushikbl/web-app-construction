require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Category = require('./models/Category');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Expense = require('./models/Expense');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// MongoDB connection
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/house_expenses';
mongoose.connect(mongoUri)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Expense Schema
 const expenseSchema = new mongoose.Schema({
  quantity: { type: String, required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  notes: { type: String },
  Image: { type: String }
 });
  const Expense = mongoose.model('Expense', expenseSchema);

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Serve static uploads
app.use('/uploads', express.static(uploadDir));

/**
 * Add Expense
 */
app.post('/api/expenses', upload.single('Image'), async (req, res) => {
  try {
    const host = `${req.protocol}://${req.get('host')}`;
    const expense = new Expense({
      quantity: req.body.quantity,
      category: req.body.category,
      amount: req.body.amount,
      notes: req.body.notes || '',
    //  Image: req.file ? `${host}/uploads/${req.file.filename}` : null,
      Image: req.file ? `/uploads/${req.file.filename}` : null,
      date: new Date()
    });
    await expense.save();
    res.status(201).json(expense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


/**
 * Get Expenses (with filters)
 */
app.get('/api/expenses', async (req, res) => {
  try {
    const { start, end, category } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (start || end) filter.date = {};
    if (start) filter.date.$gte = new Date(start);
    if (end) filter.date.$lte = new Date(end);

    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
app.get('/', (req, res) => {
  res.status(200).send('Backend is up');
});



/**
 * Update Expense (with optional image replacement)
 */
app.put('/api/expenses/:id', upload.single('Image'), async (req, res) => {
  try {
    const exp = await Expense.findById(req.params.id);
    if (!exp) return res.status(404).json({ error: 'Expense not found' });

    // Delete old image if new one is uploaded
    if (req.file && exp.Image) {
      const oldImagePath = path.join(__dirname, exp.Image.replace(`${req.protocol}://${req.get('host')}`, ''));
      if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
    }
    
    const host = `${req.protocol}://${req.get('host')}`;
    exp.quantity = req.body.quantity || exp.quantity;
    exp.category = req.body.category || exp.category;
    exp.amount = req.body.amount || exp.amount;
    exp.notes = req.body.notes || exp.notes;
    if (req.file) {
    //  exp.Image = `${host}/uploads/${req.file.filename}`;
      exp.Image = `/uploads/${req.file.filename}`;
    }

    await exp.save();
    res.json(exp);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * Delete Expense
 */
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const exp = await Expense.findById(req.params.id);
    if (!exp) return res.status(404).json({ error: 'Expense not found' });

    // Delete image file if exists
    if (exp.Image) {
      const imgPath = path.join(__dirname, exp.Image.replace('/uploads', 'uploads'));
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await Expense.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * Get All Categories
 */
app.get('/api/categories', async (req, res) => {
  try {
    const cats = await Category.find().sort({ name: 1 });
    res.json(cats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


app.get('/api/seed/categories', async (req, res) => {
  try {
    const defaults = [
      { name: 'Borewell' },
      { name: 'Steel' },
      { name: 'Sand' },
      { name: 'Bricks' },
      { name: 'Labor' }
    ];

    await Category.insertMany(defaults, { ordered: false });
    res.json({ message: 'Categories seeded!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});



/**
 * Add Category
 */
app.post('/api/categories', async (req, res) => {
  try {
    const cat = new Category({ name: req.body.name });
    await cat.save();
    res.status(201).json(cat);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
