const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();

// Create Sequelize instance with environment variables
const sequelize = new Sequelize(
  process.env.DB_NAME || "chat_users",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false, // Disable SQL query logging in production
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test database connection
sequelize
  .authenticate()
  .then(() => {
    console.log("✅ Database connection established successfully");
  })
  .catch((err) => {
    console.error("❌ Unable to connect to the database:", err.message);
  });

const User = require("./User")(sequelize, DataTypes);
const Message = require("./message")(sequelize, DataTypes);

User.hasMany(Message);
Message.belongsTo(User);

// Sync database with error handling
sequelize.sync().catch((err) => {
  console.error("❌ Database sync failed:", err.message);
});

module.exports = { sequelize, User, Message };

// CREATE TABLE `Users` (
//     `id` INT AUTO_INCREMENT PRIMARY KEY,
//     `username` VARCHAR(255) NOT NULL UNIQUE,
//     `password` VARCHAR(255) NOT NULL,
//     `createdAt` DATETIME NOT NULL,
//     `updatedAt` DATETIME NOT NULL
//   );

//   CREATE TABLE `Messages` (
//     `id` INT AUTO_INCREMENT PRIMARY KEY,
//     `text` VARCHAR(255) NOT NULL,
//     `createdAt` DATETIME NOT NULL,
//     `updatedAt` DATETIME NOT NULL,
//     `UserId` INT,
//     FOREIGN KEY (`UserId`) REFERENCES `Users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
//   );