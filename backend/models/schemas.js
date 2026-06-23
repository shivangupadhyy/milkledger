const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  businessName: { type: String, default: '' },
  businessAddress: { type: String, default: '' },
  gstNumber: { type: String, default: '' },
  currency: { type: String, default: 'INR' },
  createdAt: { type: Date, default: Date.now }
});

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  pricePerLiter: { type: Number, required: true },
  category: { type: String, required: true },
  unit: { type: String, default: 'Liter' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  createdAt: { type: Date, default: Date.now }
});

const DailyEntrySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  items: [{
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    total: { type: Number, required: true }
  }],
  grandTotal: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = {
  User: mongoose.model('User', UserSchema),
  Product: mongoose.model('Product', ProductSchema),
  DailyEntry: mongoose.model('DailyEntry', DailyEntrySchema)
};
