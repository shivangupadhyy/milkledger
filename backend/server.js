require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Ensure Database is connected before serving any request (crucial for Serverless Vercel environment)
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

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
  const { getDbMode, getMongoConnectionError } = require('./config/db');
  res.json({
    status: 'ok',
    timestamp: new Date(),
    dbMode: getDbMode(),
    hasMongoUri: !!process.env.MONGODB_URI,
    mongoError: getMongoConnectionError()
  });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.resolve(__dirname, '../frontend', 'dist', 'index.html'));
    }
  });
}

// Connect to DB (Mongo with JSON fallback)
// Initiate connection immediately (Mongoose buffers queries, so this works nicely on Serverless)
connectDB();

// Export app for serverless environments like Vercel
module.exports = app;

// Only start the listening server if file is run directly (local development or traditional server)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    console.log(`🚀 MilkLedger Backend Server is running on port ${PORT}`);
  });

  // Graceful error handling for port conflicts
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️  Port ${PORT} is busy. Retrying in 2 seconds...`);
      setTimeout(() => {
        server.close();
        server.listen(PORT);
      }, 2000);
    } else {
      console.error('❌ Server error:', err);
    }
  });
}
