const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

require("dotenv").config();

// server.js — COMPLETE UPDATED VERSION

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const app = express();

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "../FRONT_END")));

// Auto-create uploads folder
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📁 uploads/ folder created");
}

// MongoDB Connection
const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/event_startup";
mongoose.connect(uri)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    console.log("➡️  Make sure MongoDB is running: mongod");
  });

// Mongoose Schemas

const specializationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: String,
  images: [String],
}, { timestamps: true });
const SpecializationCard = mongoose.model("SpecializationCard", specializationSchema);

const workSchema = new mongoose.Schema({
  imageUrl: String,
}, { timestamps: true });
const WorkCard = mongoose.model("WorkCard", workSchema);

const enquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  mobile: String,
  message: { type: String, required: true },
}, { timestamps: true });
const Enquiry = mongoose.model("Enquiry", enquirySchema);

const bookingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  date: { type: String, required: true },
  eventType: { type: String, required: true },
  location: { type: String, required: true },
  details: String,
  status: { type: String, default: "Pending" },
}, { timestamps: true });
const Booking = mongoose.model("Booking", bookingSchema);

const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  rating: { type: Number, required: true, min: 1, max: 5 },
  message: { type: String, required: true },
  approved: { type: Boolean, default: false },
}, { timestamps: true });
const Review = mongoose.model("Review", reviewSchema);

// Admin schema
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
}, { timestamps: true });
const Admin = mongoose.model("Admin", adminSchema);

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    && allowedTypes.test(file.mimetype);
  if (isValid) cb(null, true);
  else cb(new Error("Only image files are allowed!"), false);
};

// Multer + Cloudinary Storage
const cloudStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "shiv-shakti",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  },
});

const upload = multer({
  storage: cloudStorage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Admin Auth
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "ShivShakti@2025";

app.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username, password });
    if (admin) {
      return res.json({ success: true, message: "Login successful" });
    }
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      return res.json({ success: true, message: "Login successful" });
    }
    res.status(401).json({ success: false, message: "Invalid credentials" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Health Check
app.get("/api/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
  res.json({ message: "Server running", database: dbStatus, timestamp: new Date() });
});

// Enquiries
app.post("/enquiry", async (req, res) => {
  try {
    const { name, email, mobile, message } = req.body;
    if (!name || !message) {
      return res.status(400).json({ message: "Name and message are required" });
    }
    const enquiry = new Enquiry({ name, email, mobile, message });
    await enquiry.save();
    res.json({ message: "Enquiry submitted successfully" });
  } catch (err) {
    console.error("Enquiry POST error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/enquiries", async (req, res) => {
  try {
    const data = await Enquiry.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/enquiries/:id", async (req, res) => {
  try {
    await Enquiry.findByIdAndDelete(req.params.id);
    res.json({ message: "Enquiry deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bookings
app.post("/booking", async (req, res) => {
  try {
    const { name, phone, date, eventType, location } = req.body;
    if (!name || !phone || !date || !eventType || !location) {
      return res.status(400).json({ message: "Required fields missing" });
    }
    const booking = new Booking(req.body);
    await booking.save();
    res.json({ message: "Booking submitted successfully" });
  } catch (err) {
    console.error("Booking POST error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/bookings", async (req, res) => {
  try {
    const data = await Booking.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/bookings/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/bookings/:id", async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Booking deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Specialization Cards

app.post("/api/specialization", upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) return res.status(400).json({ error: "Title and description required" });
    if (!req.file) return res.status(400).json({ error: "Cover image is required" });
    const card = new SpecializationCard({
      title,
      description,
      imageUrl: req.file.path,
      images: []
    });
    await card.save();
    res.status(201).json(card);
  } catch (err) {
    console.error("Specialization POST error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/specialization", async (req, res) => {
  try {
    const cards = await SpecializationCard.find().sort({ createdAt: -1 });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/specialization/:id", async (req, res) => {
  try {
    const card = await SpecializationCard.findById(req.params.id);
    if (!card) return res.status(404).json({ error: "Card not found" });
    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/specialization/:id/images", upload.array("images", 20), async (req, res) => {
  try {
    const card = await SpecializationCard.findById(req.params.id);
    if (!card) return res.status(404).json({ error: "Card not found" });
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No images uploaded" });
    }
    const newImageUrls = req.files.map(f => f.path);
    card.images.push(...newImageUrls);
    await card.save();
    res.json(card);
  } catch (err) {
    console.error("Add images error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/specialization/:id/images", async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const card = await SpecializationCard.findById(req.params.id);
    if (!card) return res.status(404).json({ error: "Card not found" });
    card.images = card.images.filter(img => img !== imageUrl);
    await card.save();
    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/specialization/:id", async (req, res) => {
  try {
    await SpecializationCard.findByIdAndDelete(req.params.id);
    res.json({ message: "Card deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Work / Gallery
app.post("/api/work", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Image is required" });
    const card = new WorkCard({ imageUrl: `/uploads/${req.file.filename}` });
    await card.save();
    res.status(201).json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/work", async (req, res) => {
  try {
    const cards = await WorkCard.find().sort({ createdAt: -1 });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/work/:id", async (req, res) => {
  try {
    await WorkCard.findByIdAndDelete(req.params.id);
    res.json({ message: "Card deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reviews
app.post("/reviews", async (req, res) => {
  try {
    const { name, email, rating, message } = req.body;
    if (!name || !rating || !message) {
      return res.status(400).json({ message: "Name, rating and message are required" });
    }
    const review = new Review({ name, email, rating, message });
    await review.save();
    res.json({ message: "Review submitted successfully! It will appear after admin approval." });
  } catch (err) {
    console.error("Review POST error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/reviews", async (req, res) => {
  try {
    const data = await Review.find({ approved: true }).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/admin/reviews", async (req, res) => {
  try {
    const data = await Review.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/admin/reviews/:id/approve", async (req, res) => {
  try {
    const { approved } = req.body;
    const review = await Review.findByIdAndUpdate(req.params.id, { approved }, { new: true });
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/admin/reviews/:id", async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// Password Reset
// ============================================================
const resetTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});
const ResetToken = mongoose.model("ResetToken", resetTokenSchema);

// ✅ FIXED: explicit host + port + family:4 to force IPv4 on Render
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  family: 4,
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASS,
  },
});

// Verify transporter on startup — check Render logs for result
transporter.verify((error) => {
  if (error) {
    console.error("❌ Email transporter error:", error.message);
  } else {
    console.log("✅ Email transporter ready — Gmail SMTP connected");
  }
});

// Forgot Password — send reset link
app.post("/admin/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (email !== process.env.ADMIN_EMAIL) {
      return res.status(400).json({ success: false, message: "Email not found." });
    }

    await ResetToken.deleteMany({});

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 mins

    await new ResetToken({ token, expiresAt }).save();

    const baseUrl = process.env.BASE_URL || process.env.APP_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password.html?token=${token}`;

    await transporter.sendMail({
      from: `"Shiv Shakti Admin" <${process.env.ADMIN_EMAIL}>`,
      to: email,
      subject: "Password Reset Link — Shiv Shakti",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fdf8f2;border-radius:12px;">
          <h2 style="color:#1a1410;">Password Reset Request</h2>
          <p style="color:#555;margin:16px 0;">Click the button below to reset your admin password. This link expires in <strong>30 minutes</strong>.</p>
          <a href="${resetUrl}"
            style="display:inline-block;padding:13px 28px;background:linear-gradient(135deg,#c9922a,#e8b84b);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin:16px 0;">
            Reset Password
          </a>
          <p style="color:#aaa;font-size:12px;margin-top:24px;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Forgot password error:", err.message);
    res.status(500).json({ success: false, message: "Failed to send email: " + err.message });
  }
});

// Verify reset token
app.get("/admin/reset-password/:token", async (req, res) => {
  try {
    const record = await ResetToken.findOne({ token: req.params.token });
    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ valid: false, message: "Token expired or invalid." });
    }
    res.json({ valid: true });
  } catch (err) {
    res.status(500).json({ valid: false, message: "Server error." });
  }
});

// Reset Password — save new password
app.post("/admin/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const record = await ResetToken.findOne({ token });
    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "Token expired or invalid." });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }

    // ✅ FIXED: Update password in DB if admin exists
    const admin = await Admin.findOne();
    if (admin) {
      await Admin.findByIdAndUpdate(admin._id, { password: newPassword });
    }

    // Also update env for session fallback
    process.env.ADMIN_PASS = newPassword;

    await ResetToken.deleteMany({});

    res.json({ success: true, message: "Password reset successfully!" });
  } catch (err) {
    console.error("Reset password error:", err.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ============================================================
// Admin Account Management
// ============================================================

app.get("/admin/exists", async (req, res) => {
  try {
    const admin = await Admin.findOne();
    res.json({ exists: !!admin });
  } catch (err) {
    res.status(500).json({ exists: false });
  }
});

app.post("/admin/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields required." });
    }
    const existing = await Admin.findOne();
    if (existing) {
      return res.status(403).json({ success: false, message: "Admin already exists." });
    }
    await new Admin({ username, email, password }).save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

app.post("/admin/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "All fields required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }

    const admin = await Admin.findOne();
    if (admin) {
      if (currentPassword !== admin.password) {
        return res.status(401).json({ success: false, message: "Current password is incorrect." });
      }
      await Admin.findByIdAndUpdate(admin._id, { password: newPassword });
    } else {
      if (currentPassword !== (process.env.ADMIN_PASS || "ShivShakti@2025")) {
        return res.status(401).json({ success: false, message: "Current password is incorrect." });
      }
      process.env.ADMIN_PASS = newPassword;
    }

    res.json({ success: true, message: "Password changed successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

app.delete("/admin/delete-account", async (req, res) => {
  try {
    const { password } = req.body;

    const admin = await Admin.findOne();
    if (admin) {
      if (password !== admin.password) {
        return res.status(401).json({ success: false, message: "Incorrect password." });
      }
    } else {
      if (password !== (process.env.ADMIN_PASS || "ShivShakti@2025")) {
        return res.status(401).json({ success: false, message: "Incorrect password." });
      }
    }

    await Admin.deleteMany({});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));