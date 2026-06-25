import mongoose from 'mongoose';

/**
 * Connect to MongoDB. We fail fast on a bad connection rather than letting the
 * server boot in a half-broken state — a server that can't reach its database
 * is not a server you want answering requests.
 */
export async function connectDB(uri) {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log('✓ MongoDB connected');
  } catch (err) {
    console.error('✗ MongoDB connection failed:', err.message);
    process.exit(1);
  }
}
