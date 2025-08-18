const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  quantity: { type: String, required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  notes: { type: String },
  Image: { type: String }
});

module.exports = mongoose.model('Expense', expenseSchema);
