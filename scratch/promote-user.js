const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    for (const line of envConfig.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...values] = trimmed.split('=');
        if (key) {
          process.env[key.trim()] = values.join('=').trim();
        }
      }
    }
  }
}

async function run() {
  loadEnv();
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ghar-purja';
  
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const usersCollection = db.collection('users');

  const email = process.argv.find(arg => arg.startsWith('--email='))?.split('=')[1] || 'admin@example.com';
  const password = process.argv.find(arg => arg.startsWith('--password='))?.split('=')[1] || 'password123';
  const name = process.argv.find(arg => arg.startsWith('--name='))?.split('=')[1] || 'Admin User';

  const user = await usersCollection.findOne({ email });
  if (user) {
    await usersCollection.updateOne({ email }, { $set: { role: 'admin' } });
    console.log(`Promoted existing user ${email} to admin.`);
  } else {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    await usersCollection.insertOne({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      profilePicture: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log(`Created new admin user ${email} with password: ${password}`);
  }

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
