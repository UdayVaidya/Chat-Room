const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const { sequelize, User, Message } = require("./Models");
const authRoutes = require("./routes/auth");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json());
app.use(express.static("public"));
app.use("/auth", authRoutes);

// Track connected users
const connectedUsers = new Map();

// Socket.io authentication middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication token required"));
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET is not defined in environment variables");
      return next(new Error("Server configuration error"));
    }

    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findByPk(payload.id);

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.user = user;
    next();
  } catch (error) {
    console.error("Socket authentication error:", error.message);
    next(new Error("Authentication error"));
  }
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`✅ User ${socket.user.username} connected (ID: ${socket.id})`);

  // Add user to connected users map
  connectedUsers.set(socket.user.id, {
    username: socket.user.username,
    socketId: socket.id
  });

  // Broadcast updated user count
  io.emit("userCount", connectedUsers.size);

  // Handle incoming messages
  socket.on("message", async (text) => {
    try {
      // Validate message
      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return socket.emit("error", { message: "Invalid message" });
      }

      if (text.length > 1000) {
        return socket.emit("error", { message: "Message too long (max 1000 characters)" });
      }

      // Save message to database
      const message = await Message.create({
        text: text.trim(),
        UserId: socket.user.id
      });

      // Broadcast message to all clients
      io.emit("message", {
        text: message.text,
        user: socket.user.username,
        timestamp: message.createdAt
      });
    } catch (error) {
      console.error("Message handling error:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Handle typing indicator
  socket.on("typing", () => {
    socket.broadcast.emit("userTyping", { username: socket.user.username });
  });

  socket.on("stopTyping", () => {
    socket.broadcast.emit("userStoppedTyping", { username: socket.user.username });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`❌ User ${socket.user.username} disconnected`);
    connectedUsers.delete(socket.user.id);
    io.emit("userCount", connectedUsers.size);
  });

  // Handle errors
  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    sequelize.close();
  });
});

process.on("SIGINT", () => {
  console.log("\nSIGINT signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    sequelize.close();
    process.exit(0);
  });
});

