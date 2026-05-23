const mongoose = require('mongoose');
const dns = require('dns');
const env = require('./env');

dns.setDefaultResultOrder('ipv4first');

async function connectDatabase() {
  try {
    mongoose.set('strictQuery', true);

    await mongoose.connect(env.mongoUri, {
      family: 4,
      serverSelectionTimeoutMS: 10000,
      tls: true,
    });

    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

module.exports = { connectDatabase, mongoose };