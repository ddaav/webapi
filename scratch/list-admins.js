const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb://127.0.0.1:27017/ghar-purja';

async function listAdmins() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    const admins = await usersCollection.find({ role: 'admin' }).toArray();
    console.log('Admin users in database:');
    admins.forEach(user => {
      console.log(`- Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
    });

    const allUsersCount = await usersCollection.countDocuments();
    console.log('Total users count:', allUsersCount);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

listAdmins();
