const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/skillgapai";
    await mongoose.connect(mongoUri);

    console.log("MongoDB connected successfully!");
    console.log("Database:", mongoose.connection.name);
    console.log("Host:", mongoose.connection.host);
    console.log("Port:", mongoose.connection.port);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;