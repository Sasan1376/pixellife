const mongoose = require("mongoose");

mongoose.set("bufferCommands", false);

async function connectDB() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI تنظیم نشده است");
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
  });

  console.log("✅ MongoDB Atlas Connected");
}

module.exports = connectDB;
