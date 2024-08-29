const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const { sequelize, User, Message } = require("./Models");
const authRoutes = require("./routes/auth");
const jwt = require("jsonwebtoken");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());
app.use(express.static("public"));
app.use("/auth", authRoutes);

io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const payload = jwt.verify(token, "secret"); //checks
    socket.user = await User.findByPk(payload.id);
    next();
  } catch (error) {
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  // connection starts
  console.log(`User ${socket.user.username} connected`);

  socket.on("message", async (text) => {
    const message = await Message.create({ text, UserId: socket.user.id }); // saves
    io.emit("message", { text: message.text, user: socket.user.username }); // sends
  });
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});