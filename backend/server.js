require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Category = require('./models/Category');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
//const Expense = require('./models/Expense');

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
  group: { type: String, required: true },
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

    const grouped = cats.reduce((acc, cat) => {
      acc[cat.group] = acc[cat.group] || [];
      acc[cat.group].push(cat);
      return acc;
    }, {});

    res.json(grouped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


app.get('/api/seed/categories', async (req, res) => {
  try {
    const defaults = {
      "Site preparation": [
       { name: 'Borewell', group: 'Site Preparation' },
       { name: 'Earthwork / Excavation', group: 'Site Preparation' },
       { name: 'Soil Filling', group: 'Site Preparation' },
       { name: 'Debris Removal', group: 'Site Preparation' },
       { name: 'Anti-termite Treatment', group: 'Site Preparation' }
      ],

      "Foundation & structure": [ 
       { name: 'Cement', group: 'Foundation & Structure' },
       { name: 'Sand', group: 'Foundation & Structure' },
       { name: 'Aggregate (Jelly)', group: 'Foundation & Structure' },
       { name: 'Steel (TMT)', group: 'Foundation & Structure' },
       { name: 'Binding Wire', group: 'Foundation & Structure' },
       { name: 'RCC Work', group: 'Foundation & Structure' },
       { name: 'Footing Concrete', group: 'Foundation & Structure' },
       { name: 'Shuttering Material', group: 'Foundation & Structure' },
       { name: 'Centering Charges', group: 'Foundation & Structure' },
       { name: 'Scaffolding', group: 'Foundation & Structure' }
      ],

       "Masonry": [
       { name: 'Bricks', group: 'Masonry' },
       { name: 'Solid Blocks', group: 'Masonry' },
       { name: 'Hollow Blocks', group: 'Masonry' },
       { name: 'AAC Blocks', group: 'Masonry' }
       ],

       "Roofing": [
       { name: 'Roof Slab', group: 'Roofing' },
       { name: 'Terrace Waterproofing', group: 'Roofing' },
       { name: 'Heat Insulation', group: 'Roofing' }
       ],

      "Plumbing": [
       { name: 'Plumbing Pipes', group: 'Plumbing' },
       { name: 'Pipe Fittings', group: 'Plumbing' },
       { name: 'Water Tank', group: 'Plumbing' },
       { name: 'Pump & Motor', group: 'Plumbing' },
       { name: 'Sanitary Ware', group: 'Plumbing' },
       { name: 'Bathroom Fittings', group: 'Plumbing' }
      ],

      "Electrical": [
       { name: 'Electrical Wiring', group: 'Electrical' },
       { name: 'Switches & Sockets', group: 'Electrical' },
       { name: 'Lights & Fixtures', group: 'Electrical' },
       { name: 'Fans', group: 'Electrical' },
       { name: 'Distribution Board', group: 'Electrical' },
       { name: 'Earthing', group: 'Electrical' }
      ],

      "Carpentry & wood": [
       { name: 'Wood', group: 'Carpentry & Wood Work' },
       { name: 'Plywood', group: 'Carpentry & Wood Work' },
       { name: 'Doors', group: 'Carpentry & Wood Work' },
       { name: 'Windows', group: 'Carpentry & Wood Work' },
       { name: 'Wardrobes', group: 'Carpentry & Wood Work' },
       { name: 'Kitchen Cabinets', group: 'Carpentry & Wood Work' }
        ],

      "Flooring": [
       { name: 'Floor Tiles', group: 'Flooring' },
       { name: 'Wall Tiles', group: 'Flooring' },
       { name: 'Granite', group: 'Flooring' },
       { name: 'Marble', group: 'Flooring' },
       { name: 'Tile Adhesive', group: 'Flooring' },
       { name: 'Tile Grout', group: 'Flooring' }
      ],

       "Metal & fabrication": [
       { name: 'MS Grill', group: 'Metal & Fabrication' },
       { name: 'Gate Fabrication', group: 'Metal & Fabrication' },
       { name: 'Staircase Railing', group: 'Metal & Fabrication' },
       { name: 'Balcony Railing', group: 'Metal & Fabrication' }
       ],

      "Exterior works": [
       { name: 'Compound Wall', group: 'Exterior Works' },
       { name: 'Paver Blocks', group: 'Exterior Works' },
       { name: 'Landscaping', group: 'Exterior Works' },
       { name: 'Rainwater Harvesting', group: 'Exterior Works' }
      ],

      "Labor & services": [
       { name: 'General Labor', group: 'Labor & Services' },
       { name: 'Mason Charges', group: 'Labor & Services' },
       { name: 'Carpenter Charges', group: 'Labor & Services' },
       { name: 'Electrician Charges', group: 'Labor & Services' },
       { name: 'Plumber Charges', group: 'Labor & Services' },
       { name: 'Contractor Charges', group: 'Labor & Services' }
      ],

      "Professional & govt": [
       { name: 'Architect Fees', group: 'Professional & Government' },
       { name: 'Structural Engineer Fees', group: 'Professional & Government' },
       { name: 'Plan Approval Charges', group: 'Professional & Government' },
       { name: 'BBMP / Panchayat Fees', group: 'Professional & Government' },
       { name: 'Electricity Connection Charges', group: 'Professional & Government' },
       { name: 'Water Connection Charges', group: 'Professional & Government' }
      ],

      "Transport & misc": [
        { name: 'Material Transportation', group: 'Transport & Miscellaneous' },
        { name: 'Crane Charges', group: 'Transport & Miscellaneous' },
        { name: 'Loading & Unloading', group: 'Transport & Miscellaneous' },
        { name: 'Cleaning Charges', group: 'Transport & Miscellaneous' },
        { name: 'Miscellaneous', group: 'Transport & Miscellaneous' }
    ]
  };
    
    await Category.deleteMany();
    await Category.insertMany(defaults);

    res.json({ message: 'Categories seeded successfully!' });
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
