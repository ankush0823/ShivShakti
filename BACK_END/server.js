// // server.js

// require("dotenv").config();

// const express = require("express");
// const cors = require("cors");
// const mongoose = require("mongoose");
// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const cookieParser = require("cookie-parser");
// const crypto = require("crypto");
// const nodemailer = require("nodemailer");

// const app = express();

// // Paths
// const ROOT_DIR = path.join(__dirname, "..");
// const FRONT_END_DIR = path.join(ROOT_DIR, "FRONT_END");
// const UPLOADS_DIR = path.join(__dirname, "uploads");

// if (!fs.existsSync(UPLOADS_DIR)) {
//   fs.mkdirSync(UPLOADS_DIR, { recursive: true });
//   console.log("📁 BACK_END/uploads/ folder created");
// }

// const JWT_SECRET = process.env.JWT_SECRET || "shivshakti_super_secret_key_change_in_production";

// // Middleware
// app.use(cors({ origin: true, credentials: true }));
// app.use(express.json());
// app.use(cookieParser());
// app.use("/uploads", express.static(UPLOADS_DIR));
// app.use(express.static(FRONT_END_DIR));

// // MongoDB Connection
// const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/event_startup";
// mongoose.connect(uri)
//   .then(() => console.log("✅ MongoDB connected successfully"))
//   .catch((err) => {
//     console.error("❌ MongoDB connection error:", err.message);
//     console.log("➡️  Make sure MongoDB is running: mongod");
//   });

// // ============================
// // Mongoose Schemas
// // ============================
// const adminSchema = new mongoose.Schema({
//   username: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   email:    { type: String, required: true, unique: true },
//   resetToken:       String,
//   resetTokenExpiry: Date,
// }, { timestamps: true });
// const Admin = mongoose.model("Admin", adminSchema);

// const specializationSchema = new mongoose.Schema({
//   title: String, description: String, imageUrl: String,
// }, { timestamps: true });
// const SpecializationCard = mongoose.model("SpecializationCard", specializationSchema);

// const workSchema = new mongoose.Schema({ imageUrl: String }, { timestamps: true });
// const WorkCard = mongoose.model("WorkCard", workSchema);

// const enquirySchema = new mongoose.Schema({
//   name: { type: String, required: true }, email: { type: String, required: true },
//   mobile: String, message: { type: String, required: true },
// }, { timestamps: true });
// const Enquiry = mongoose.model("Enquiry", enquirySchema);

// const bookingSchema = new mongoose.Schema({
//   name: { type: String, required: true }, phone: { type: String, required: true },
//   email: String, date: { type: String, required: true },
//   eventType: { type: String, required: true }, location: { type: String, required: true },
//   details: String, status: { type: String, default: "Pending" },
// }, { timestamps: true });
// const Booking = mongoose.model("Booking", bookingSchema);

// // ============================
// // Nodemailer (Gmail)
// // ============================
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// // ============================
// // JWT Middleware
// // ============================
// function verifyToken(req, res, next) {
//   const token = req.cookies.adminToken;
//   if (!token) return res.status(401).json({ success: false, message: "Unauthorized. Please login." });
//   try {
//     req.admin = jwt.verify(token, JWT_SECRET);
//     next();
//   } catch {
//     return res.status(401).json({ success: false, message: "Session expired. Please login again." });
//   }
// }

// // ============================
// // CHECK IF ADMIN EXISTS
// // register.html calls this on page load
// // ============================
// app.get("/admin/exists", async (req, res) => {
//   try {
//     const count = await Admin.countDocuments();
//     res.json({ exists: count > 0 });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // ============================
// // REGISTER — only if no admin exists yet
// // ============================
// app.post("/admin/register", async (req, res) => {
//   try {
//     // Block registration if admin already exists
//     const count = await Admin.countDocuments();
//     if (count > 0) {
//       return res.status(403).json({
//         success: false,
//         message: "Registration is closed. An admin already exists."
//       });
//     }

//     const { username, email, password } = req.body;

//     if (!username || !email || !password) {
//       return res.status(400).json({ success: false, message: "All fields are required." });
//     }

//     if (password.length < 6) {
//       return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
//     }

//     const hashedPassword = await bcrypt.hash(password, 12);
//     const admin = new Admin({ username, email, password: hashedPassword });
//     await admin.save();

//     res.json({ success: true, message: "Admin account created successfully!" });

//   } catch (err) {
//     if (err.code === 11000) {
//       return res.status(400).json({ success: false, message: "Username or email already exists." });
//     }
//     console.error("Register error:", err.message);
//     res.status(500).json({ success: false, message: "Server error." });
//   }
// });

// // ============================
// // LOGIN
// // ============================
// app.post("/admin/login", async (req, res) => {
//   try {
//     const { username, password } = req.body;
//     if (!username || !password) {
//       return res.status(400).json({ success: false, message: "Username and password required." });
//     }

//     const admin = await Admin.findOne({ username });
//     if (!admin) return res.status(401).json({ success: false, message: "Invalid credentials." });

//     const isMatch = await bcrypt.compare(password, admin.password);
//     if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials." });

//     const token = jwt.sign({ id: admin._id, username: admin.username }, JWT_SECRET, { expiresIn: "8h" });

//     res.cookie("adminToken", token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//       maxAge: 8 * 60 * 60 * 1000,
//     });

//     res.json({ success: true, message: "Login successful." });
//   } catch (err) {
//     console.error("Login error:", err.message);
//     res.status(500).json({ success: false, message: "Server error." });
//   }
// });

// // ============================
// // LOGOUT
// // ============================
// app.post("/admin/logout", (req, res) => {
//   res.clearCookie("adminToken");
//   res.json({ success: true, message: "Logged out successfully." });
// });

// // ============================
// // AUTH CHECK
// // ============================
// app.get("/admin/check", verifyToken, (req, res) => {
//   res.json({ success: true, username: req.admin.username });
// });

// // ============================
// // FORGOT PASSWORD
// // ============================
// app.post("/admin/forgot-password", async (req, res) => {
//   try {
//     const { email } = req.body;
//     if (!email) return res.status(400).json({ success: false, message: "Email is required." });

//     const admin = await Admin.findOne({ email });
//     if (!admin) {
//       return res.json({ success: true, message: "If this email exists, a reset link has been sent." });
//     }

//     const plainToken = crypto.randomBytes(32).toString("hex");
//     admin.resetToken = crypto.createHash("sha256").update(plainToken).digest("hex");
//     admin.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
//     await admin.save();

//     const resetUrl = `${process.env.BASE_URL || "http://localhost:3000"}/reset-password.html?token=${plainToken}`;

//     await transporter.sendMail({
//       from: `"Shiv Shakti Admin" <${process.env.EMAIL_USER}>`,
//       to: admin.email,
//       subject: "Password Reset Request",
//       html: `
//         <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:8px;">
//           <h2 style="color:#333;">Password Reset Request</h2>
//           <p style="color:#555;">Hello <strong>${admin.username}</strong>,</p>
//           <p style="color:#555;">Click below to reset your password. Link expires in <strong>15 minutes</strong>.</p>
//           <a href="${resetUrl}" style="display:inline-block;margin:20px 0;padding:12px 28px;background:#c9922a;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">Reset Password</a>
//           <p style="color:#999;font-size:13px;">If you didn't request this, ignore this email.</p>
//           <hr style="border:none;border-top:1px solid #eee;"/>
//           <p style="color:#bbb;font-size:12px;">Shiv Shakti Decoration Admin Panel</p>
//         </div>
//       `,
//     });

//     res.json({ success: true, message: "If this email exists, a reset link has been sent." });
//   } catch (err) {
//     console.error("Forgot password error:", err.message);
//     res.status(500).json({ success: false, message: "Failed to send email. Check EMAIL_USER and EMAIL_PASS in .env" });
//   }
// });

// // ============================
// // VERIFY RESET TOKEN
// // ============================
// app.get("/admin/reset-password/:token", async (req, res) => {
//   try {
//     const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
//     const admin = await Admin.findOne({ resetToken: hashedToken, resetTokenExpiry: { $gt: new Date() } });
//     if (!admin) return res.status(400).json({ success: false, message: "Invalid or expired reset link." });
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ success: false, message: "Server error." });
//   }
// });

// // ============================
// // RESET PASSWORD
// // ============================
// app.post("/admin/reset-password/:token", async (req, res) => {
//   try {
//     const { newPassword } = req.body;
//     if (!newPassword || newPassword.length < 6) {
//       return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
//     }

//     const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
//     const admin = await Admin.findOne({ resetToken: hashedToken, resetTokenExpiry: { $gt: new Date() } });
//     if (!admin) return res.status(400).json({ success: false, message: "Invalid or expired reset link." });

//     admin.password = await bcrypt.hash(newPassword, 12);
//     admin.resetToken = undefined;
//     admin.resetTokenExpiry = undefined;
//     await admin.save();

//     res.json({ success: true, message: "Password reset successful! You can now login." });
//   } catch (err) {
//     console.error("Reset password error:", err.message);
//     res.status(500).json({ success: false, message: "Server error." });
//   }
// });

// // ============================
// // Multer
// // ============================
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, UPLOADS_DIR),
//   filename:    (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
// });
// const fileFilter = (req, file, cb) => {
//   const allowed = /jpeg|jpg|png|gif|webp/;
//   allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)
//     ? cb(null, true) : cb(new Error("Only image files allowed!"), false);
// };
// const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// // ============================
// // API Routes
// // ============================
// app.get("/api/health", (req, res) => {
//   res.json({ message: "Server running", database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected", timestamp: new Date() });
// });

// // Enquiries
// app.post("/enquiry", async (req, res) => {
//   try {
//     const { name, email, mobile, message } = req.body;
//     if (!name || !email || !message) return res.status(400).json({ message: "Name, email and message required." });
//     await new Enquiry({ name, email, mobile, message }).save();
//     res.json({ message: "Enquiry submitted successfully." });
//   } catch (err) { res.status(500).json({ message: "Server error." }); }
// });
// app.get("/enquiries", verifyToken, async (req, res) => {
//   try { res.json(await Enquiry.find().sort({ createdAt: -1 })); } catch (err) { res.status(500).json({ error: err.message }); }
// });
// app.delete("/enquiries/:id", verifyToken, async (req, res) => {
//   try { await Enquiry.findByIdAndDelete(req.params.id); res.json({ message: "Deleted." }); } catch (err) { res.status(500).json({ error: err.message }); }
// });

// // Bookings
// app.post("/booking", async (req, res) => {
//   try {
//     const { name, phone, date, eventType, location } = req.body;
//     if (!name || !phone || !date || !eventType || !location) return res.status(400).json({ message: "Required fields missing." });
//     await new Booking(req.body).save();
//     res.json({ message: "Booking submitted successfully." });
//   } catch (err) { res.status(500).json({ message: "Server error." }); }
// });
// app.get("/bookings", verifyToken, async (req, res) => {
//   try { res.json(await Booking.find().sort({ createdAt: -1 })); } catch (err) { res.status(500).json({ error: err.message }); }
// });
// app.patch("/bookings/:id/status", verifyToken, async (req, res) => {
//   try { res.json(await Booking.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true })); } catch (err) { res.status(500).json({ error: err.message }); }
// });
// app.delete("/bookings/:id", verifyToken, async (req, res) => {
//   try { await Booking.findByIdAndDelete(req.params.id); res.json({ message: "Deleted." }); } catch (err) { res.status(500).json({ error: err.message }); }
// });

// // Specialization Cards
// app.post("/api/specialization", verifyToken, (req, res) => {
//   upload.single("image")(req, res, async (err) => {
//     if (err) return res.status(400).json({ error: err.message });
//     try {
//       const { title, description } = req.body;
//       if (!title || !description) return res.status(400).json({ error: "Title and description required." });
//       if (!req.file) return res.status(400).json({ error: "Image required." });
//       res.status(201).json(await new SpecializationCard({ title, description, imageUrl: `/uploads/${req.file.filename}` }).save());
//     } catch (err) { res.status(500).json({ error: err.message }); }
//   });
// });
// app.get("/api/specialization", async (req, res) => {
//   try { res.json(await SpecializationCard.find().sort({ createdAt: -1 })); } catch (err) { res.status(500).json({ error: err.message }); }
// });
// app.delete("/api/specialization/:id", verifyToken, async (req, res) => {
//   try { await SpecializationCard.findByIdAndDelete(req.params.id); res.json({ message: "Deleted." }); } catch (err) { res.status(500).json({ error: err.message }); }
// });

// // Work / Gallery Cards
// app.post("/api/work", verifyToken, (req, res) => {
//   upload.single("image")(req, res, async (err) => {
//     if (err) return res.status(400).json({ error: err.message });
//     try {
//       if (!req.file) return res.status(400).json({ error: "Image required." });
//       res.status(201).json(await new WorkCard({ imageUrl: `/uploads/${req.file.filename}` }).save());
//     } catch (err) { res.status(500).json({ error: err.message }); }
//   });
// });
// app.get("/api/work", async (req, res) => {
//   try { res.json(await WorkCard.find().sort({ createdAt: -1 })); } catch (err) { res.status(500).json({ error: err.message }); }
// });
// app.delete("/api/work/:id", verifyToken, async (req, res) => {
//   try { await WorkCard.findByIdAndDelete(req.params.id); res.json({ message: "Deleted." }); } catch (err) { res.status(500).json({ error: err.message }); }

// });


 
// // ============================
// // CHANGE PASSWORD (logged in admin)
// // ============================
// app.post("/admin/change-password", verifyToken, async (req, res) => {
//   try {
//     const { currentPassword, newPassword } = req.body;

//     if (!currentPassword || !newPassword) {
//       return res.status(400).json({ success: false, message: "All fields are required." });
//     }

//     if (newPassword.length < 6) {
//       return res.status(400).json({ success: false, message: "New password must be at least 6 characters." });
//     }

//     const admin = await Admin.findById(req.admin.id);
//     const isMatch = await bcrypt.compare(currentPassword, admin.password);

//     if (!isMatch) {
//       return res.status(401).json({ success: false, message: "Current password is incorrect." });
//     }

//     admin.password = await bcrypt.hash(newPassword, 12);
//     await admin.save();

//     res.json({ success: true, message: "Password updated successfully!" });

//   } catch (err) {
//     console.error("Change password error:", err.message);
//     res.status(500).json({ success: false, message: "Server error." });
//   }
// });


// // ============================
// // DELETE ADMIN ACCOUNT
// // ============================
// app.delete("/admin/delete-account", verifyToken, async (req, res) => {
//   try {
//     await Admin.findByIdAndDelete(req.admin.id);
//     res.clearCookie("adminToken");
//     res.json({ success: true, message: "Account deleted successfully." });
//   } catch (err) {
//     console.error("Delete account error:", err.message);
//     res.status(500).json({ success: false, message: "Server error." });
//   }
// });

// // ============================
// // Global Error Handler
// // ============================
// app.use((err, req, res, next) => {
//   console.error("Server Error:", err.message);
//   res.status(500).json({ error: err.message || "Internal Server Error" });
// });

// // ============================
// // Start Server
// // ============================
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server started on port ${PORT}`);
//   console.log(`🌐 Open: http://localhost:${PORT}`);
//   console.log(`📁 Serving frontend from: ${FRONT_END_DIR}`);
// });



// // --- Change Password ---
// async function changePassword() {
//   const currentPassword = document.getElementById("current-password").value;
//   const newPassword = document.getElementById("new-password").value;
//   const confirmNewPassword = document.getElementById("confirm-new-password").value;
//   const btn = document.getElementById("change-pass-btn");
//   const msgEl = document.getElementById("change-pass-msg");

//   msgEl.style.cssText = "";
//   msgEl.textContent = "";

//   if (!currentPassword || !newPassword || !confirmNewPassword) {
//     msgEl.style.cssText = "color:#c0392b;margin-top:12px;font-size:14px;";
//     msgEl.textContent = "❌ All fields are required.";
//     return;
//   }

//   if (newPassword.length < 6) {
//     msgEl.style.cssText = "color:#c0392b;margin-top:12px;font-size:14px;";
//     msgEl.textContent = "❌ New password must be at least 6 characters.";
//     return;
//   }

//   if (newPassword !== confirmNewPassword) {
//     msgEl.style.cssText = "color:#c0392b;margin-top:12px;font-size:14px;";
//     msgEl.textContent = "❌ Passwords do not match.";
//     return;
//   }

//   btn.disabled = true;
//   btn.textContent = "Updating...";

//   try {
//     const res = await fetch("/admin/change-password", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       credentials: "include",
//       body: JSON.stringify({ currentPassword, newPassword }),
//     });

//     const result = await res.json();

//     if (result.success) {
//       msgEl.style.cssText = "color:#2d7a47;margin-top:12px;font-size:14px;";
//       msgEl.textContent = "✅ " + result.message;
//       document.getElementById("current-password").value = "";
//       document.getElementById("new-password").value = "";
//       document.getElementById("confirm-new-password").value = "";
//     } else {
//       msgEl.style.cssText = "color:#c0392b;margin-top:12px;font-size:14px;";
//       msgEl.textContent = "❌ " + result.message;
//     }
//   } catch (err) {
//     msgEl.style.cssText = "color:#c0392b;margin-top:12px;font-size:14px;";
//     msgEl.textContent = "❌ Server error. Please try again.";
//   } finally {
//     btn.disabled = false;
//     btn.textContent = "Update Password";
//   }
// }

// server.js

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const app = express();

// ============================
// Cloudinary Config
// ============================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Paths
const ROOT_DIR = path.join(__dirname, "..");
const FRONT_END_DIR = path.join(ROOT_DIR, "FRONT_END");

const JWT_SECRET = process.env.JWT_SECRET || "shivshakti_super_secret_key_change_in_production";

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(FRONT_END_DIR));

// MongoDB Connection
const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/event_startup";
mongoose.connect(uri)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    console.log("➡️  Make sure MongoDB is running: mongod");
  });

// ============================
// Mongoose Schemas
// ============================
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  resetToken:       String,
  resetTokenExpiry: Date,
}, { timestamps: true });
const Admin = mongoose.model("Admin", adminSchema);

const specializationSchema = new mongoose.Schema({
  title: String, description: String, imageUrl: String, publicId: String,
}, { timestamps: true });
const SpecializationCard = mongoose.model("SpecializationCard", specializationSchema);

const workSchema = new mongoose.Schema({
  imageUrl: String, publicId: String,
}, { timestamps: true });
const WorkCard = mongoose.model("WorkCard", workSchema);

const enquirySchema = new mongoose.Schema({
  name: { type: String, required: true }, email: { type: String, required: true },
  mobile: String, message: { type: String, required: true },
}, { timestamps: true });
const Enquiry = mongoose.model("Enquiry", enquirySchema);

const bookingSchema = new mongoose.Schema({
  name: { type: String, required: true }, phone: { type: String, required: true },
  email: String, date: { type: String, required: true },
  eventType: { type: String, required: true }, location: { type: String, required: true },
  details: String, status: { type: String, default: "Pending" },
}, { timestamps: true });
const Booking = mongoose.model("Booking", bookingSchema);

// ============================
// Nodemailer (Gmail)
// ============================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ============================
// JWT Middleware
// ============================
function verifyToken(req, res, next) {
  const token = req.cookies.adminToken;
  if (!token) return res.status(401).json({ success: false, message: "Unauthorized. Please login." });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Session expired. Please login again." });
  }
}

// ============================
// Multer + Cloudinary Storage
// ============================
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "shivshakti",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)
    ? cb(null, true) : cb(new Error("Only image files allowed!"), false);
};

const upload = multer({
  storage: cloudinaryStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ============================
// API Routes
// ============================
app.get("/api/health", (req, res) => {
  res.json({ message: "Server running", database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected", timestamp: new Date() });
});

// --- Admin Exists ---
app.get("/admin/exists", async (req, res) => {
  try {
    const count = await Admin.countDocuments();
    res.json({ exists: count > 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Register ---
app.post("/admin/register", async (req, res) => {
  try {
    const count = await Admin.countDocuments();
    if (count > 0) {
      return res.status(403).json({ success: false, message: "Registration is closed. An admin already exists." });
    }
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ success: false, message: "All fields are required." });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    const hashedPassword = await bcrypt.hash(password, 12);
    const admin = new Admin({ username, email, password: hashedPassword });
    await admin.save();
    res.json({ success: true, message: "Admin account created successfully!" });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ success: false, message: "Username or email already exists." });
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// --- Login ---
app.post("/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, message: "Username and password required." });
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ success: false, message: "Invalid credentials." });
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials." });
    const token = jwt.sign({ id: admin._id, username: admin.username }, JWT_SECRET, { expiresIn: "8h" });
    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 8 * 60 * 60 * 1000,
    });
    res.json({ success: true, message: "Login successful." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// --- Logout ---
app.post("/admin/logout", (req, res) => {
  res.clearCookie("adminToken");
  res.json({ success: true, message: "Logged out successfully." });
});

// --- Auth Check ---
app.get("/admin/check", verifyToken, (req, res) => {
  res.json({ success: true, username: req.admin.username });
});

// --- Forgot Password ---
app.post("/admin/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required." });
    const admin = await Admin.findOne({ email });
    if (!admin) return res.json({ success: true, message: "If this email exists, a reset link has been sent." });
    const plainToken = crypto.randomBytes(32).toString("hex");
    admin.resetToken = crypto.createHash("sha256").update(plainToken).digest("hex");
    admin.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await admin.save();
    const resetUrl = `${process.env.BASE_URL || "http://localhost:3000"}/reset-password.html?token=${plainToken}`;
    await transporter.sendMail({
      from: `"Shiv Shakti Admin" <${process.env.EMAIL_USER}>`,
      to: admin.email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:8px;">
          <h2 style="color:#333;">Password Reset Request</h2>
          <p style="color:#555;">Hello <strong>${admin.username}</strong>,</p>
          <p style="color:#555;">Click below to reset your password. Link expires in <strong>15 minutes</strong>.</p>
          <a href="${resetUrl}" style="display:inline-block;margin:20px 0;padding:12px 28px;background:#c9922a;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">Reset Password</a>
          <p style="color:#999;font-size:13px;">If you didn't request this, ignore this email.</p>
          <hr style="border:none;border-top:1px solid #eee;"/>
          <p style="color:#bbb;font-size:12px;">Shiv Shakti Decoration Admin Panel</p>
        </div>
      `,
    });
    res.json({ success: true, message: "If this email exists, a reset link has been sent." });
  } catch (err) {
    console.error("Forgot password error:", err.message);
    res.status(500).json({ success: false, message: "Failed to send email. Check EMAIL_USER and EMAIL_PASS in .env" });
  }
});

// --- Verify Reset Token ---
app.get("/admin/reset-password/:token", async (req, res) => {
  try {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const admin = await Admin.findOne({ resetToken: hashedToken, resetTokenExpiry: { $gt: new Date() } });
    if (!admin) return res.status(400).json({ success: false, message: "Invalid or expired reset link." });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// --- Reset Password ---
app.post("/admin/reset-password/:token", async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const admin = await Admin.findOne({ resetToken: hashedToken, resetTokenExpiry: { $gt: new Date() } });
    if (!admin) return res.status(400).json({ success: false, message: "Invalid or expired reset link." });
    admin.password = await bcrypt.hash(newPassword, 12);
    admin.resetToken = undefined;
    admin.resetTokenExpiry = undefined;
    await admin.save();
    res.json({ success: true, message: "Password reset successful! You can now login." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// --- Change Password ---
app.post("/admin/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: "All fields are required." });
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters." });
    const admin = await Admin.findById(req.admin.id);
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Current password is incorrect." });
    admin.password = await bcrypt.hash(newPassword, 12);
    await admin.save();
    res.json({ success: true, message: "Password updated successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// --- Delete Account ---
app.delete("/admin/delete-account", verifyToken, async (req, res) => {
  try {
    await Admin.findByIdAndDelete(req.admin.id);
    res.clearCookie("adminToken");
    res.json({ success: true, message: "Account deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// --- Enquiries ---
app.post("/enquiry", async (req, res) => {
  try {
    const { name, email, mobile, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ message: "Name, email and message required." });
    await new Enquiry({ name, email, mobile, message }).save();
    res.json({ message: "Enquiry submitted successfully." });
  } catch (err) { res.status(500).json({ message: "Server error." }); }
});
app.get("/enquiries", verifyToken, async (req, res) => {
  try { res.json(await Enquiry.find().sort({ createdAt: -1 })); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete("/enquiries/:id", verifyToken, async (req, res) => {
  try { await Enquiry.findByIdAndDelete(req.params.id); res.json({ message: "Deleted." }); } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Bookings ---
app.post("/booking", async (req, res) => {
  try {
    const { name, phone, date, eventType, location } = req.body;
    if (!name || !phone || !date || !eventType || !location) return res.status(400).json({ message: "Required fields missing." });
    await new Booking(req.body).save();
    res.json({ message: "Booking submitted successfully." });
  } catch (err) { res.status(500).json({ message: "Server error." }); }
});
app.get("/bookings", verifyToken, async (req, res) => {
  try { res.json(await Booking.find().sort({ createdAt: -1 })); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.patch("/bookings/:id/status", verifyToken, async (req, res) => {
  try { res.json(await Booking.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true })); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete("/bookings/:id", verifyToken, async (req, res) => {
  try { await Booking.findByIdAndDelete(req.params.id); res.json({ message: "Deleted." }); } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Specialization Cards ---
app.post("/api/specialization", verifyToken, (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    try {
      const { title, description } = req.body;
      if (!title || !description) return res.status(400).json({ error: "Title and description required." });
      if (!req.file) return res.status(400).json({ error: "Image required." });
      res.status(201).json(await new SpecializationCard({
        title, description,
        imageUrl: req.file.path,
        publicId: req.file.filename,
      }).save());
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
});
app.get("/api/specialization", async (req, res) => {
  try { res.json(await SpecializationCard.find().sort({ createdAt: -1 })); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete("/api/specialization/:id", verifyToken, async (req, res) => {
  try {
    const card = await SpecializationCard.findById(req.params.id);
    if (card?.publicId) await cloudinary.uploader.destroy(card.publicId);
    await SpecializationCard.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Work / Gallery Cards ---
app.post("/api/work", verifyToken, (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    try {
      if (!req.file) return res.status(400).json({ error: "Image required." });
      res.status(201).json(await new WorkCard({
        imageUrl: req.file.path,
        publicId: req.file.filename,
      }).save());
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
});
app.get("/api/work", async (req, res) => {
  try { res.json(await WorkCard.find().sort({ createdAt: -1 })); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete("/api/work/:id", verifyToken, async (req, res) => {
  try {
    const card = await WorkCard.findById(req.params.id);
    if (card?.publicId) await cloudinary.uploader.destroy(card.publicId);
    await WorkCard.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted." });
  } catch (err) { res.status(500).json({ error: err.message }); }
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