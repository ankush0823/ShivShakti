// ============================
// create-admin.js
// Run this ONCE to create your admin account in MongoDB
// Command: node create-admin.js
// ============================

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// --- Change these before running ---
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "ShivShakti@2025"; // Change to your desired password
// -----------------------------------

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

const Admin = mongoose.model("Admin", adminSchema);

async function createAdmin() {
  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/event_startup";
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected");

    // Check if admin already exists
    const existing = await Admin.findOne({ username: ADMIN_USERNAME });
    if (existing) {
      console.log("⚠️  Admin already exists! Delete it from MongoDB first if you want to recreate.");
      process.exit(0);
    }

    // Hash the password (10 salt rounds)
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const admin = new Admin({
      username: ADMIN_USERNAME,
      password: hashedPassword,
    });

    await admin.save();
    console.log("✅ Admin created successfully!");
    console.log(`   Username: ${ADMIN_USERNAME}`);
    console.log(`   Password: ${ADMIN_PASSWORD} (stored as bcrypt hash)`);

  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin();