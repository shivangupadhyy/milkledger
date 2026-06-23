const mongoose = require('mongoose');

let isMongoConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('\x1b[33m%s\x1b[0m', '⚠️  No MONGODB_URI found in env. Defaulting to Local JSON Database Mode.');
    console.log('💾 Data will be saved in: backend/data/');
    return false;
  }

  try {
    await mongoose.connect(uri);
    isMongoConnected = true;
    console.log('\x1b[32m%s\x1b[0m', '🔌 Connected to MongoDB successfully!');
    return true;
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    console.log('\x1b[33m%s\x1b[0m', '💾 Falling back to Local JSON Database Mode.');
    isMongoConnected = false;
    return false;
  }
};

const getDbMode = () => isMongoConnected ? 'mongo' : 'json';

module.exports = { connectDB, getDbMode };
