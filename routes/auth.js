const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../Models");
const router = express.Router();

// Input validation helper
const validateInput = (username, password) => {
  const errors = [];

  if (!username || username.trim().length < 3) {
    errors.push("Username must be at least 3 characters long");
  }

  if (!password || password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (username && username.length > 50) {
    errors.push("Username must be less than 50 characters");
  }

  return errors;
};

router.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    const validationErrors = validateInput(username, password);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join(", ") });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      username: username.trim(),
      password: hashedPassword
    });

    res.status(201).json({
      message: "User created successfully",
      username: user.username
    });
  } catch (error) {
    // Handle duplicate username error
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: "Username already exists" });
    }

    console.error("Signup error:", error);
    res.status(500).json({ error: "An error occurred during signup" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    // Find user
    const user = await User.findOne({ where: { username: username.trim() } });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token using environment variable
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET is not defined in environment variables");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      jwtSecret,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      username: user.username
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "An error occurred during login" });
  }
});

module.exports = router;