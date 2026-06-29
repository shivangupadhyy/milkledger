const mongoose = require('mongoose');

let mongoConnectionError = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('\x1b[33m%s\x1b[0m', '⚠️  No MONGODB_URI found in env. Defaulting to Local JSON Database Mode.');
    console.log('💾 Data will be saved in: backend/data/');
    return false;
  }

  if (mongoose.connection.readyState === 1) {
    mongoConnectionError = null;
    return true;
  }

  try {
    // If it's already connecting (readyState === 2), mongoose.connect will resolve when ready.
    await mongoose.connect(uri);
    mongoConnectionError = null;
    console.log('\x1b[32m%s\x1b[0m', '🔌 Connected to MongoDB successfully!');
    return true;
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    console.log('\x1b[33m%s\x1b[0m', '💾 Falling back to Local JSON Database Mode.');
    mongoConnectionError = error.message;
    return false;
  }
};

const getDbMode = () => mongoose.connection.readyState === 1 ? 'mongo' : 'json';
const getMongoConnectionError = () => mongoConnectionError;

module.exports = { connectDB, getDbMode, getMongoConnectionError };
