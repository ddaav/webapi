import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../lib/backend/models/User";

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf8");
    for (const line of envConfig.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...values] = trimmed.split("=");
        if (key) {
          process.env[key.trim()] = values.join("=").trim();
        }
      }
    }
  }
}

async function run() {
  loadEnv();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not found in .env.local");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const email =
    process.argv.find((arg) => arg.startsWith("--email="))?.split("=")[1] ||
    "admin@example.com";
  const password =
    process.argv.find((arg) => arg.startsWith("--password="))?.split("=")[1] ||
    "password123";
  const name =
    process.argv.find((arg) => arg.startsWith("--name="))?.split("=")[1] ||
    "Admin User";

  let user = await User.findOne({ email });
  if (user) {
    user.role = "admin";
    await user.save();
    console.log(`Promoted existing user ${email} to admin.`);
  } else {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
    });
    console.log(`Created new admin user ${email} with password: ${password}`);
  }

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
