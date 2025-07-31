const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://jormor64:chickenZ15.@aceai.wrermpn.mongodb.net/?retryWrites=true&w=majority&appName=AceAI';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 