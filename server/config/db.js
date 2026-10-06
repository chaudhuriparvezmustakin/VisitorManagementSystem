const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/visitor_management_db';
    console.log(`Connecting to MongoDB at: ${connUri}...`);
    
    // Attempt connection with 3 sec timeout
    const conn = await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: 3000
    });
    
    console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (err) {
    console.log(`Primary MongoDB connection failed (${err.message}). Starting in-memory MongoDB database...`);
    try {
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log(`In-Memory MongoDB Connected successfully at: ${uri}`);
    } catch (memErr) {
      console.error(`Error starting In-Memory MongoDB: ${memErr.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
