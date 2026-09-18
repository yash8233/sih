const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/water_quality_db';
    try {
      const conn = await mongoose.connect(connStr, { serverSelectionTimeoutMS: 2500 });
      console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name}`);
      return;
    } catch (err) {
      console.log('[MongoDB] Local daemon not detected. Launching in-memory MongoDB server...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      connStr = mongoServer.getUri();
      const conn = await mongoose.connect(connStr);
      console.log(`[MongoDB] Connected to In-Memory DB: ${conn.connection.host}/${conn.connection.name}`);
    }
  } catch (error) {
    console.error(`[MongoDB] Connection Error: ${error.message}`);
  }
};

module.exports = connectDB;
