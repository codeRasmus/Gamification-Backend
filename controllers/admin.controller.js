const Admin = require("../models/admin.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { getIO } = require("../socket");

// Controller til at registrere ny Admin
// Tjekker om Admin allerede eksisterer
// Hvis ikke hashes password og ny admin gemmes
exports.register = async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(409).json({ message: "Admin already exists" });
    }

    const saltRounds = parseInt(process.env.SALTROUNDS) || 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const admin = new Admin({ username, passwordHash });
    await admin.save();

    res.status(201).json({ message: "Admin created successfully" });
  } catch (err) {
    console.error("Error creating admin:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Controller til håndtering af Login
// Tjekker password og username med bcrypt
// Sætter JWT token
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const passwordMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Controller til at hente samtlige admins
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select("-passwordHash");
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Controller til at starte spillet
// Sender emit med game-start til alle spillere via Socket.io
exports.startGame = async (req, res) => {
  try {
    const io = getIO();
    io.emit("game_start", {
      message: "Game is starting! Please go to the game page.",
    });

    res.status(200).json({ message: "Game started successfully" });
  } catch (err) {
    console.error("Error starting game:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
