// Test DB Provider CRUD operations under Local JSON DB Mode
process.env.JWT_SECRET = 'test_secret';
process.env.MONGODB_URI = ''; // force local JSON database mode

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const dbProvider = require('../db/dbProvider');
const { connectDB } = require('../config/db');

const runTests = async () => {
  console.log('🧪 Starting Database Provider Integration Tests...');

  // Initialize
  await connectDB();

  // Test 1: User Registration/Find
  console.log('User model tests...');
  const email = `test_${Date.now()}@test.com`;
  const name = 'Test User';
  const businessName = 'Test Dairy';
  
  const user = await dbProvider.User.create({
    name,
    email,
    password: 'hashedpassword123',
    businessName
  });

  assert.ok(user._id, 'User _id should be generated');
  assert.strictEqual(user.name, name, 'User name should match');
  assert.strictEqual(user.email, email, 'User email should match');

  const foundUser = await dbProvider.User.findOne({ email });
  assert.ok(foundUser, 'Should find user by email');
  assert.strictEqual(foundUser._id, user._id, 'IDs should match');

  // Test 2: Product Catalog
  console.log('Product catalogue tests...');
  const prodName = `Cow Milk Test ${Date.now()}`;
  const price = 65.50;
  
  const product = await dbProvider.Product.create({
    name: prodName,
    pricePerLiter: price,
    category: 'Milk',
    status: 'Active'
  });

  assert.ok(product._id, 'Product _id should be generated');
  assert.strictEqual(product.pricePerLiter, price, 'Product price should match');

  const allProducts = await dbProvider.Product.find({});
  assert.ok(allProducts.length > 0, 'Products list should not be empty');
  
  const foundProd = await dbProvider.Product.findById(product._id);
  assert.ok(foundProd, 'Product should be retrievable by ID');

  // Test 3: Daily Entry saving
  console.log('Ledger daily entry tests...');
  const date = new Date().toISOString().split('T')[0];
  const qty = 10;
  const itemTotal = qty * price;

  const entry = await dbProvider.DailyEntry.create({
    date: new Date(date),
    items: [{
      productId: product._id,
      productName: product.name,
      quantity: qty,
      price: price,
      total: itemTotal
    }],
    grandTotal: itemTotal
  });

  assert.ok(entry._id, 'Daily entry ID should be generated');
  assert.strictEqual(entry.grandTotal, itemTotal, 'Grand total should be computed correctly');

  const allEntries = await dbProvider.DailyEntry.findAll();
  assert.ok(allEntries.length > 0, 'Entries list should contain our newly added record');

  // Clean up test data from JSON files if desired
  console.log('✅ All integration database test checks passed successfully!');
};

runTests().catch(err => {
  console.error('❌ Integration Tests Failed:', err);
  process.exit(1);
});
