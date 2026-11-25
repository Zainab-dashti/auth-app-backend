const jwt = require("jsonwebtoken");
const User = require("../models/User");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

const getIp = (req) => (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();

// Never send the password back
const safeUser = (u) => ({
  id: u._id, name: u.name, email: u.email, phone: u.phone, bio: u.bio, role: u.role,
  loginCount: u.loginCount, lastLogin: u.lastLogin, createdAt: u.createdAt,
});

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, email and password are required" });
    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(409).json({ message: "An account with this email already exists" });

    const user = await User.create({
      name, email, password,
      registeredIp: getIp(req), lastIp: getIp(req),
      lastUserAgent: req.headers["user-agent"],
      lastLogin: new Date(), loginCount: 1,
    });

    res.status(201).json({ token: signToken(user._id), user: safeUser(user) });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: "Incorrect email or password" });

    user.loginCount += 1;
    user.lastLogin = new Date();
    user.lastIp = getIp(req);
    user.lastUserAgent = req.headers["user-agent"];
    await user.save();

    res.json({ token: signToken(user._id), user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me   (protected)
exports.getMe = (req, res) => res.json({ user: safeUser(req.user) });

// PUT /api/auth/profile   (protected)
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, bio } = req.body;
    if (name !== undefined) req.user.name = name;
    if (phone !== undefined) req.user.phone = phone;
    if (bio !== undefined) req.user.bio = bio;
    await req.user.save();
    res.json({ user: safeUser(req.user) });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
