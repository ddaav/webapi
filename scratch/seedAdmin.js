const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/ghar-purja';

async function seedAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Check if admin already exists
    const existing = await usersCollection.findOne({ email: 'admin@gmail.com' });
    if (existing) {
      console.log('Admin user already exists:', existing.email);
      await mongoose.disconnect();
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456789', salt);

    // Insert admin user
    const result = await usersCollection.insertOne({
      name: 'admin dav',
      email: 'admin@gmail.com',
      password: hashedPassword,
      role: 'admin',
      profilePicture: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('Admin user created successfully!');
    console.log('  Name:  admin dav');
    console.log('  Email: admin@gmail.com');
    console.log('  Role:  admin');
    console.log('  ID:   ', result.insertedId.toString());

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding admin:', error.message);
    process.exit(1);
  }
}

seedAdmin();
