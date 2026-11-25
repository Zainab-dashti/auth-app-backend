const mongoose = require("mongoose");

// Cache the connection so Vercel serverless functions reuse it between requests
let cached = global.mongoose || (global.mongoose = { conn: null, promise: null });

module.exports = async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, { bufferCommands: false });
  }
  cached.conn = await cached.promise;
  console.log("MongoDB connected");
  return cached.conn;
};
