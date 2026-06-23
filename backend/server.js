require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import Controllers & Middlewares
const auth = require('./middleware/auth');
const authController = require('./controllers/authController');
const productController = require('./controllers/productController');
const entryController = require('./controllers/entryController');
const reportController = require('./controllers/reportController');

// Routes
// 1. Auth routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.post('/api/auth/forgot-password', authController.forgotPassword);
app.get('/api/auth/profile', auth, authController.getProfile);
app.put('/api/auth/profile', auth, authController.updateProfile);
app.put('/api/auth/change-password', auth, authController.changePassword);

// 2. Product routes
app.get('/api/products', auth, productController.getProducts);
app.get('/api/products/:id', auth, productController.getProductById);
app.post('/api/products', auth, productController.createProduct);
app.put('/api/products/:id', auth, productController.updateProduct);
app.delete('/api/products/:id', auth, productController.deleteProduct);

// 3. Entry routes
app.get('/api/entries', auth, entryController.getEntries);
app.get('/api/entries/by-date/:date', auth, entryController.getEntryByDate);
app.get('/api/entries/:id', auth, entryController.getEntryById);
app.post('/api/entries', auth, entryController.createEntry);
app.put('/api/entries/:id', auth, entryController.updateEntry);
app.delete('/api/entries/:id', auth, entryController.deleteEntry);

// 4. Report & Analytics routes
app.get('/api/reports/dashboard', auth, reportController.getDashboardStats);
app.get('/api/reports', auth, reportController.getReports);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Start Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to DB (Mongo with JSON fallback)
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 MilkLedger Backend Server is running on port ${PORT}`);
  });
};

startServer();
