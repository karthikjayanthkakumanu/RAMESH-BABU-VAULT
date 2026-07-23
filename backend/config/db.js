const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kakumanu-vault', {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    global.useJsonDb = false;
  } catch (error) {
    console.warn(`\n[WARNING] MongoDB Connection Failed: ${error.message}`);
    console.warn('[FALLBACK] Local JSON database activated in "backend/uploads/database/".');
    console.warn('The vault is now fully functional in offline mode!\n');
    global.useJsonDb = true;
  }
};

module.exports = connectDB;
