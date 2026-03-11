 
// server.js 

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const app = express(); 

// Paths 
const ROOT_DIR = path.join(__dirname, "..");
const FRONT_END_DIR = path.join(ROOT_DIR, "FRONT_END");
const UPLOADS_DIR = path.join(__dirname, "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log("📁 BACK_END/uploads/ folder created");
}
 
// JWT Secret — set in .env as JWT_SECRET 
const JWT_SECRET = process.env.JWT_SECRET || "shivshakti_super_secret_key_change_in_production";
 
// Middleware 
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(UPLOADS_DIR));
app.use(express.static(FRONT_END_DIR));
 
// MongoDB Connection 
const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/event_startup";
mongoose.connect(uri)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    console.log("➡️  Make sure MongoDB is running: mongod");
  });
 
// Mongoose Schemas 
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // bcrypt hashed
}, { timestamps: true });
const Admin = mongoose.model("Admin", adminSchema);

const specializationSchema = new mongoose.Schema({
  title: String,
  description: String,
  imageUrl: String,
}, { timestamps: true });
const SpecializationCard = mongoose.model("SpecializationCard", specializationSchema);

const workSchema = new mongoose.Schema({
  imageUrl: String,
}, { timestamps: true });
const WorkCard = mongoose.model("WorkCard", workSchema);

const enquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
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
 
// JWT Auth Middleware
// Protects all admin routes 
function verifyToken(req, res, next) {
  const token = req.cookies.adminToken;
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized. Please login." });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Session expired. Please login again." });
  }
}
 
// Admin Login Route 
app.post("/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password required" });
    }

    // Find admin in MongoDB
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Compare password with bcrypt hash
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    // Set token in httpOnly cookie (can't be stolen by JS/XSS)
    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "strict",
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    });

    res.json({ success: true, message: "Login successful" });

  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
 
// Admin Logout Route 
app.post("/admin/logout", (req, res) => {
  res.clearCookie("adminToken");
  res.json({ success: true, message: "Logged out successfully" });
});
 
// Auth Check Route
// Frontend calls this on dashboard load to verify session 
app.get("/admin/check", verifyToken, (req, res) => {
  res.json({ success: true, username: req.admin.username });
});
 
// Multer Setup 
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    && allowedTypes.test(file.mimetype);
  if (isValid) cb(null, true);
  else cb(new Error("Only image files are allowed!"), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
 
// API Routes 

// Health Check
app.get("/api/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
  res.json({ message: "Server running", database: dbStatus, timestamp: new Date() });
});

// --- Enquiries (public POST, protected GET/DELETE) ---
app.post("/enquiry", async (req, res) => {
  try {
    const { name, email, mobile, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: "Name, email and message are required" });
    }
    const enquiry = new Enquiry({ name, email, mobile, message });
    await enquiry.save();
    res.json({ message: "Enquiry submitted successfully" });
  } catch (err) {
    console.error("Enquiry POST error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/enquiries", verifyToken, async (req, res) => {
  try {
    const data = await Enquiry.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/enquiries/:id", verifyToken, async (req, res) => {
  try {
    await Enquiry.findByIdAndDelete(req.params.id);
    res.json({ message: "Enquiry deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Bookings (public POST, protected GET/PATCH/DELETE) ---
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

app.get("/bookings", verifyToken, async (req, res) => {
  try {
    const data = await Booking.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/bookings/:id/status", verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/bookings/:id", verifyToken, async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Booking deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Specialization Cards (public GET, protected POST/DELETE) ---
app.post("/api/specialization", verifyToken, (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    try {
      const { title, description } = req.body;
      if (!title || !description) return res.status(400).json({ error: "Title and description required" });
      if (!req.file) return res.status(400).json({ error: "Image is required" });

      const card = new SpecializationCard({
        title,
        description,
        imageUrl: `/uploads/${req.file.filename}`
      });
      await card.save();
      res.status(201).json(card);
    } catch (err) {
      console.error("Specialization POST error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });
});

app.get("/api/specialization", async (req, res) => {
  try {
    const cards = await SpecializationCard.find().sort({ createdAt: -1 });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/specialization/:id", verifyToken, async (req, res) => {
  try {
    await SpecializationCard.findByIdAndDelete(req.params.id);
    res.json({ message: "Card deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Work / Gallery Cards (public GET, protected POST/DELETE) ---
app.post("/api/work", verifyToken, (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    try {
      if (!req.file) return res.status(400).json({ error: "Image is required" });

      const card = new WorkCard({ imageUrl: `/uploads/${req.file.filename}` });
      await card.save();
      res.status(201).json(card);
    } catch (err) {
      console.error("Work POST error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });
});

app.get("/api/work", async (req, res) => {
  try {
    const cards = await WorkCard.find().sort({ createdAt: -1 });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/work/:id", verifyToken, async (req, res) => {
  try {
    await WorkCard.findByIdAndDelete(req.params.id);
    res.json({ message: "Card deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
// Global Error Handler 
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});
 
// Start Server 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
  console.log(`🌐 Open: http://localhost:${PORT}`);
  console.log(`📁 Serving frontend from: ${FRONT_END_DIR}`);
});