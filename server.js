const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const db = require('./db');
const pingMinecraftServer = require('./mc-ping');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'elysium-portal-secret-key-189283719';

// Setup directories
const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Express middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(PUBLIC_DIR));

// Configure Multer for File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);
    if (ext && mime) {
      return cb(null, true);
    }
    cb(new Error('Only images are allowed (jpg, jpeg, png, gif, webp).'));
  }
});

// Middleware: Authenticate Admin JWT token
const authenticateAdmin = (req, res, next) => {
  const token = req.cookies.admin_token;
  if (!token) {
    return res.status(401).json({ error: "Access denied. No session token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired session token." });
  }
};

// --- DYNAMIC CSS THEME ---
app.get('/api/theme.css', (req, res) => {
  const config = db.get('config');
  const theme = config.theme || {
    primaryAccent: "#00ff88",
    secondaryAccent: "#00f0ff",
    goldAccent: "#ffd700",
    darkBg: "#0a0f0d",
    glassBg: "rgba(10, 15, 13, 0.7)"
  };

  res.header("Content-Type", "text/css");
  res.send(`
:root {
  --primary-accent: ${theme.primaryAccent};
  --secondary-accent: ${theme.secondaryAccent};
  --gold-accent: ${theme.goldAccent};
  --dark-bg: ${theme.darkBg};
  --glass-bg: ${theme.glassBg};
  --primary-glow: rgba(${hexToRgb(theme.primaryAccent)}, 0.45);
  --secondary-glow: rgba(${hexToRgb(theme.secondaryAccent)}, 0.45);
  --gold-glow: rgba(${hexToRgb(theme.goldAccent)}, 0.45);
}
  `);
});

// Helper: Hex color to RGB
function hexToRgb(hex) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 255, 136';
}

// --- PUBLIC APIS ---

// Fetch all portal public configurations and data
app.get('/api/portal-data', (req, res) => {
  const allData = db.all();
  // Filter out secure data before sending
  const publicData = {
    config: allData.config,
    hero: allData.hero,
    about: allData.about,
    features: allData.features,
    news: allData.news,
    gallery: allData.gallery,
    stats: allData.stats,
    staff: allData.staff,
    faq: allData.faq,
    voting: allData.voting,
    store: allData.store,
    announcements: allData.announcements
  };
  res.json(publicData);
});

// Ping Minecraft Server for live statistics
app.get('/api/ping', async (req, res) => {
  const config = db.get('config');
  const serverIp = config.serverIp || "127.0.0.1";
  const serverPort = config.serverPort || 25565;

  if (config.statusOverride === 'online') {
    return res.json({
      online: true,
      players: config.mockPlayerCount || 100,
      maxPlayers: config.mockMaxPlayers || 500,
      latency: 24,
      version: config.serverVersion || "1.20+",
      motd: `${config.serverName} - Online`
    });
  } else if (config.statusOverride === 'offline') {
    return res.json({
      online: false,
      players: 0,
      maxPlayers: config.mockMaxPlayers || 500,
      latency: 0,
      version: config.serverVersion || "1.20+",
      motd: "Server Offline"
    });
  } else if (config.statusOverride === 'maintenance') {
    return res.json({
      online: true,
      players: 0,
      maxPlayers: config.mockMaxPlayers || 500,
      latency: 12,
      version: config.serverVersion || "1.20+",
      motd: "🚧 Server under maintenance",
      isMaintenance: true
    });
  }

  // Auto Ping actual server
  try {
    const result = await pingMinecraftServer(serverIp, serverPort, 2000);
    if (result.online) {
      res.json(result);
    } else {
      // Fallback gracefully to mock data
      res.json({
        online: true,
        players: config.mockPlayerCount || 50,
        maxPlayers: config.mockMaxPlayers || 250,
        latency: 45,
        version: config.serverVersion || "1.20+",
        motd: config.serverName + " (Fallback)",
        fallback: true
      });
    }
  } catch (err) {
    res.json({
      online: false,
      error: err.message,
      players: 0,
      maxPlayers: config.mockMaxPlayers || 200
    });
  }
});


// --- AUTHENTICATION ---

// Admin Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const adminConfig = db.get('admin');

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  if (username !== adminConfig.username) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  const isMatch = bcrypt.compareSync(password, adminConfig.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  // Create JWT Token
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '2h' });

  // Set HTTP-only Cookie
  res.cookie('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 2 * 60 * 60 * 1000 // 2 hours
  });

  res.json({ success: true, message: "Logged in successfully." });
});

// Admin Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.json({ success: true, message: "Logged out successfully." });
});

// Verify Session
app.get('/api/auth/verify', authenticateAdmin, (req, res) => {
  res.json({ authenticated: true, username: req.admin.username });
});

// Change Admin Password
app.post('/api/auth/change-password', authenticateAdmin, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const adminConfig = db.get('admin');

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current password and new password are required." });
  }

  const isMatch = bcrypt.compareSync(currentPassword, adminConfig.passwordHash);
  if (!isMatch) {
    return res.status(400).json({ error: "Incorrect current password." });
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(newPassword, salt);
  
  adminConfig.passwordHash = hash;
  db.set('admin', adminConfig);

  res.json({ success: true, message: "Password updated successfully." });
});


// --- ADMIN SECURE APIS (CRUD) ---

// Update Server Configurations
app.put('/api/config', authenticateAdmin, (req, res) => {
  const currentConfig = db.get('config');
  const updatedConfig = { ...currentConfig, ...req.body };
  db.set('config', updatedConfig);
  res.json({ success: true, message: "Configurations saved successfully.", data: updatedConfig });
});

// Update Hero Banner Details
app.put('/api/hero', authenticateAdmin, (req, res) => {
  const currentHero = db.get('hero');
  const updatedHero = { ...currentHero, ...req.body };
  db.set('hero', updatedHero);
  res.json({ success: true, message: "Hero settings updated.", data: updatedHero });
});

// Update About Section Details
app.put('/api/about', authenticateAdmin, (req, res) => {
  const currentAbout = db.get('about');
  const updatedAbout = { ...currentAbout, ...req.body };
  db.set('about', updatedAbout);
  res.json({ success: true, message: "About content updated.", data: updatedAbout });
});

// Feature Cards CRUD
app.post('/api/features', authenticateAdmin, (req, res) => {
  const features = db.get('features');
  const newCard = {
    id: Date.now().toString(),
    title: req.body.title || "New Feature",
    description: req.body.description || "Feature description goes here.",
    icon: req.body.icon || "star"
  };
  features.push(newCard);
  db.set('features', features);
  res.json({ success: true, data: newCard });
});

app.put('/api/features/:id', authenticateAdmin, (req, res) => {
  const features = db.get('features');
  const idx = features.findIndex(f => f.id === req.params.id);
  if (idx !== -1) {
    features[idx] = { ...features[idx], ...req.body };
    db.set('features', features);
    res.json({ success: true, data: features[idx] });
  } else {
    res.status(404).json({ error: "Feature card not found." });
  }
});

app.delete('/api/features/:id', authenticateAdmin, (req, res) => {
  let features = db.get('features');
  features = features.filter(f => f.id !== req.params.id);
  db.set('features', features);
  res.json({ success: true, message: "Feature card deleted." });
});

// News Posts CRUD
app.post('/api/news', authenticateAdmin, (req, res) => {
  const news = db.get('news');
  const newPost = {
    id: Date.now().toString(),
    title: req.body.title || "Announcement Title",
    category: req.body.category || "Announcement",
    date: new Date().toISOString().split('T')[0],
    content: req.body.content || "Content goes here...",
    author: req.body.author || "Admin",
    image: req.body.image || ""
  };
  news.unshift(newPost);
  db.set('news', news);
  res.json({ success: true, data: newPost });
});

app.put('/api/news/:id', authenticateAdmin, (req, res) => {
  const news = db.get('news');
  const idx = news.findIndex(n => n.id === req.params.id);
  if (idx !== -1) {
    news[idx] = { ...news[idx], ...req.body };
    db.set('news', news);
    res.json({ success: true, data: news[idx] });
  } else {
    res.status(404).json({ error: "Post not found." });
  }
});

app.delete('/api/news/:id', authenticateAdmin, (req, res) => {
  let news = db.get('news');
  news = news.filter(n => n.id !== req.params.id);
  db.set('news', news);
  res.json({ success: true, message: "News post deleted." });
});

// Gallery CRUD
app.post('/api/gallery', authenticateAdmin, (req, res) => {
  const gallery = db.get('gallery');
  const newItem = {
    id: Date.now().toString(),
    url: req.body.url || "/assets/placeholder-screenshot.jpg",
    title: req.body.title || "New Build",
    description: req.body.description || "Check out this screenshot from our server!"
  };
  gallery.push(newItem);
  db.set('gallery', gallery);
  res.json({ success: true, data: newItem });
});

app.delete('/api/gallery/:id', authenticateAdmin, (req, res) => {
  let gallery = db.get('gallery');
  gallery = gallery.filter(g => g.id !== req.params.id);
  db.set('gallery', gallery);
  res.json({ success: true, message: "Gallery image deleted." });
});

// Statistics Update
app.put('/api/stats', authenticateAdmin, (req, res) => {
  const currentStats = db.get('stats');
  // Expect body to be full stats array
  if (Array.isArray(req.body)) {
    db.set('stats', req.body);
    return res.json({ success: true, message: "Statistics updated.", data: req.body });
  }
  res.status(400).json({ error: "Body must be an array of statistics." });
});

// Staff CRUD
app.post('/api/staff', authenticateAdmin, (req, res) => {
  const staff = db.get('staff');
  const newStaff = {
    id: Date.now().toString(),
    name: req.body.name || "Steve",
    role: req.body.role || "Helper",
    avatar: req.body.avatar || "/assets/avatar-default.png",
    description: req.body.description || "A dedicated staff member."
  };
  staff.push(newStaff);
  db.set('staff', staff);
  res.json({ success: true, data: newStaff });
});

app.put('/api/staff/:id', authenticateAdmin, (req, res) => {
  const staff = db.get('staff');
  const idx = staff.findIndex(s => s.id === req.params.id);
  if (idx !== -1) {
    staff[idx] = { ...staff[idx], ...req.body };
    db.set('staff', staff);
    res.json({ success: true, data: staff[idx] });
  } else {
    res.status(404).json({ error: "Staff member not found." });
  }
});

app.delete('/api/staff/:id', authenticateAdmin, (req, res) => {
  let staff = db.get('staff');
  staff = staff.filter(s => s.id !== req.params.id);
  db.set('staff', staff);
  res.json({ success: true, message: "Staff member deleted." });
});

// FAQ CRUD
app.post('/api/faq', authenticateAdmin, (req, res) => {
  const faq = db.get('faq');
  const newFaq = {
    id: Date.now().toString(),
    question: req.body.question || "New Question?",
    answer: req.body.answer || "Answer goes here..."
  };
  faq.push(newFaq);
  db.set('faq', faq);
  res.json({ success: true, data: newFaq });
});

app.put('/api/faq/:id', authenticateAdmin, (req, res) => {
  const faq = db.get('faq');
  const idx = faq.findIndex(f => f.id === req.params.id);
  if (idx !== -1) {
    faq[idx] = { ...faq[idx], ...req.body };
    db.set('faq', faq);
    res.json({ success: true, data: faq[idx] });
  } else {
    res.status(404).json({ error: "FAQ not found." });
  }
});

app.delete('/api/faq/:id', authenticateAdmin, (req, res) => {
  let faq = db.get('faq');
  faq = faq.filter(f => f.id !== req.params.id);
  db.set('faq', faq);
  res.json({ success: true, message: "FAQ item deleted." });
});

// Store & Voting Settings
app.put('/api/store-voting', authenticateAdmin, (req, res) => {
  const config = db.get('config');
  if (req.body.votingRewards !== undefined) config.votingRewards = req.body.votingRewards;
  if (req.body.storeDescription !== undefined) config.storeDescription = req.body.storeDescription;
  db.set('config', config);

  if (req.body.voting !== undefined && Array.isArray(req.body.voting)) {
    db.set('voting', req.body.voting);
  }
  if (req.body.store !== undefined && Array.isArray(req.body.store)) {
    db.set('store', req.body.store);
  }

  res.json({ success: true, message: "Store & Voting updated successfully." });
});

// Announcements CRUD
app.put('/api/announcements', authenticateAdmin, (req, res) => {
  if (Array.isArray(req.body)) {
    db.set('announcements', req.body);
    return res.json({ success: true, message: "Announcements updated.", data: req.body });
  }
  res.status(400).json({ error: "Body must be an array." });
});


// --- FILE UPLOADS ENDPOINTS ---

app.post('/api/upload/:type', authenticateAdmin, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file provided." });
  }

  // Return the path relative to public/
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, url: fileUrl });
});


// Fallback routing for dashboard vs home page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'admin.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Elysium Portal running on port ${PORT}...`);
});
