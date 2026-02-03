/* ===== UPDATED MODEL (FIXED) ===== */
const expenseSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now }, // Added for custom dates
  vendor: { type: String, default: 'N/A' }, // NEW FIELD
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'unit' },   // NEW FIELD
  category: { type: String, required: true },
  group: { type: String, required: true },
  amount: { type: Number, required: true },
  notes: String,
  Image: String,
});

const Expense = mongoose.model('Expense', expenseSchema);

/* ===== ADD EXPENSE (FIXED) ===== */
app.post('/api/expenses', upload.single('Image'), async (req, res) => {
  try {
    // CRITICAL: Pull vendor, unit, and date from req.body
    const { date, vendor, quantity, unit, category, group, amount, notes } = req.body;
    
    if (!quantity || !category || !group || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const imageUrl = req.file
      ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
      : null;

    const expense = new Expense({
      date: date || Date.now(),
      vendor: vendor || 'N/A', // Save Vendor
      quantity: Number(quantity),
      unit: unit || 'unit',     // Save Unit
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

/* ===== UPDATE EXPENSE (FIXED) ===== */
app.put('/api/expenses/:id', upload.single('Image'), async (req, res) => {
  try {
    const exp = await Expense.findById(req.params.id);
    if (!exp) return res.sendStatus(404);

    if (req.file && exp.Image) {
      const oldPath = path.join(uploadDir, path.basename(exp.Image));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    // Update ALL fields including Vendor and Unit
    exp.date = req.body.date || exp.date;
    exp.vendor = req.body.vendor || exp.vendor;
    exp.unit = req.body.unit || exp.unit;
    exp.quantity = Number(req.body.quantity);
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