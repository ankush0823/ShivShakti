// ============================
// server.js — FIXED FOR CORRECT FOLDER STRUCTURE
// BACK_END/server.js → FRONT_END/ serve karega
// ============================

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

// ============================
// Paths — folder structure ke hisaab se
// BACK_END/server.js hai, FRONT_END/ ek level upar hai
// ============================
const ROOT_DIR = path.join(__dirname, ".."); // EVENT_STARTUP/ root
const FRONT_END_DIR = path.join(ROOT_DIR, "FRONT_END"); // FRONT_END/
const UPLOADS_DIR = path.join(__dirname, "uploads"); // BACK_END/uploads/

// ============================
// Auto-create uploads folder
// ============================
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log("📁 BACK_END/uploads/ folder created");
}

// ============================
// Middleware
// ============================
app.use(cors());
app.use(express.json());

// FIX 1: uploads BACK_END/uploads/ se serve honge
app.use("/uploads", express.static(UPLOADS_DIR));

// FIX 2: HTML/CSS/JS/IMAGES — FRONT_END/ folder se serve honge
app.use(express.static(FRONT_END_DIR));

// ============================
// MongoDB Connection
// ============================
const uri = "mongodb://127.0.0.1:27017/event_startup";
mongoose.connect(uri)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    console.log("➡️  Make sure MongoDB is running: mongod");
  });

// ============================
// Mongoose Schemas
// ============================
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

// ============================
// Admin Login
// ============================
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "ShivShakti@2025";

app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ success: true, message: "Login successful" });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

// ============================
// Multer — FIX 3: uploads BACK_END/uploads/ mein save honge
// ============================
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

// ============================
// API Routes
// ============================

// Health Check
app.get("/api/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
  res.json({ message: "Server running", database: dbStatus, timestamp: new Date() });
});

// --- Enquiries ---
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

// --- Bookings ---
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

app.delete("/bookings/:id", async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Booking deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Specialization Cards ---
// FIX 4: Multer error bhi JSON mein return karega (warna "Unexpected end of JSON" aata tha)
app.post("/api/specialization", (req, res) => {
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

app.delete("/api/specialization/:id", async (req, res) => {
  try {
    await SpecializationCard.findByIdAndDelete(req.params.id);
    res.json({ message: "Card deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Work / Gallery Cards ---
// FIX 4: Same — multer error bhi JSON mein
app.post("/api/work", (req, res) => {
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

app.delete("/api/work/:id", async (req, res) => {
  try {
    await WorkCard.findByIdAndDelete(req.params.id);
    res.json({ message: "Card deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================
// Global Error Handler
// ============================
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

// ============================
// Start Server
// ============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
  console.log(`🌐 Open: http://localhost:${PORT}`);
  console.log(`📁 Serving frontend from: ${FRONT_END_DIR}`);
});