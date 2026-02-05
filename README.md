# ConnectHub Chat Room - Application Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Application Flow](#application-flow)
5. [Database Schema](#database-schema)
6. [Authentication System](#authentication-system)
7. [Real-Time Communication](#real-time-communication)
8. [Frontend Components](#frontend-components)
9. [Backend Components](#backend-components)
10. [Security Features](#security-features)

---

## Overview

ConnectHub is a real-time chat application that allows users to communicate instantly. The application features user authentication, real-time messaging using WebSockets, and a modern, glassmorphic UI design.

### Key Features
- **User Authentication**: Secure signup and login with JWT tokens
- **Real-Time Messaging**: Instant message delivery using Socket.IO
- **User Presence**: Live user count and connection status
- **Typing Indicators**: See when other users are typing
- **Persistent Storage**: Messages and users stored in MySQL database
- **Modern UI**: Glassmorphism design with smooth animations

---

## Architecture

The application follows a **client-server architecture** with real-time bidirectional communication:

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT SIDE                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  index.html  │  │  login.html  │  │  signup.html │     │
│  │  (Welcome)   │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                            │                                │
│                   ┌────────▼────────┐                       │
│                   │   chat.html     │                       │
│                   │   + app.js      │                       │
│                   │   + styles.css  │                       │
│                   └────────┬────────┘                       │
└────────────────────────────┼─────────────────────────────────┘
                             │
                    HTTP + WebSocket
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                       SERVER SIDE                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    server.js                         │   │
│  │  ┌────────────────┐  ┌──────────────────────────┐   │   │
│  │  │  Express App   │  │  Socket.IO Server        │   │   │
│  │  │  - Static      │  │  - Authentication        │   │   │
│  │  │  - Auth Routes │  │  - Message Broadcasting  │   │   │
│  │  └────────────────┘  └──────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌─────────────────────────┼──────────────────────────┐     │
│  │         routes/         │         Models/          │     │
│  │  ┌──────────────┐       │  ┌──────────────┐       │     │
│  │  │   auth.js    │       │  │   index.js   │       │     │
│  │  │  - /signup   │       │  │   User.js    │       │     │
│  │  │  - /login    │       │  │   message.js │       │     │
│  │  └──────────────┘       │  └──────────────┘       │     │
│  └─────────────────────────┴──────────────────────────┘     │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │  MySQL Database │                       │
│                    │  - Users table  │                       │
│                    │  - Messages     │                       │
│                    └─────────────────┘                       │
└──────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web application framework
- **Socket.IO**: Real-time bidirectional communication
- **Sequelize**: ORM for MySQL database
- **MySQL2**: Database driver
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **dotenv**: Environment variable management

### Frontend
- **HTML5**: Structure
- **CSS3**: Styling with glassmorphism effects
- **Vanilla JavaScript**: Client-side logic
- **Socket.IO Client**: WebSocket communication

---

## Application Flow

### 1. User Registration Flow

```
User → signup.html → app.js → POST /auth/signup → auth.js
                                      ↓
                              Validate Input
                                      ↓
                              Hash Password (bcrypt)
                                      ↓
                              Create User (Sequelize)
                                      ↓
                              Save to MySQL
                                      ↓
                              Return Success
                                      ↓
                              Redirect to login.html
```

**Steps:**
1. User fills signup form with username and password
2. Frontend validates input (min 3 chars username, min 6 chars password)
3. POST request sent to `/auth/signup`
4. Backend validates input again
5. Password is hashed using bcrypt (10 salt rounds)
6. User record created in database
7. Success response sent to client
8. User redirected to login page

### 2. User Login Flow

```
User → login.html → app.js → POST /auth/login → auth.js
                                     ↓
                             Find User in DB
                                     ↓
                             Verify Password (bcrypt.compare)
                                     ↓
                             Generate JWT Token
                                     ↓
                             Return Token + Username
                                     ↓
                             Store in localStorage
                                     ↓
                             Redirect to chat.html
```

**Steps:**
1. User enters credentials
2. POST request to `/auth/login`
3. Server finds user by username
4. Password verified using bcrypt.compare()
5. JWT token generated with 7-day expiration
6. Token and username stored in localStorage
7. User redirected to chat interface

### 3. Chat Connection Flow

```
chat.html loads → app.js initializes → Socket.IO connection
                                              ↓
                                    Send JWT token in auth
                                              ↓
                                    server.js middleware
                                              ↓
                                    Verify JWT token
                                              ↓
                                    Find user in database
                                              ↓
                                    Attach user to socket
                                              ↓
                                    Connection established
                                              ↓
                                    Add to connectedUsers Map
                                              ↓
                                    Broadcast user count
```

**Steps:**
1. Chat page loads and retrieves JWT from localStorage
2. Socket.IO client connects with token in auth handshake
3. Server middleware intercepts connection
4. JWT token verified
5. User fetched from database
6. User object attached to socket
7. Connection accepted
8. User added to active users map
9. Updated user count broadcast to all clients

### 4. Message Flow

```
User types message → Submit form → app.js
                                      ↓
                          socket.emit('message', text)
                                      ↓
                          server.js receives event
                                      ↓
                          Validate message
                                      ↓
                          Save to database (Message model)
                                      ↓
                          io.emit('message', data)
                                      ↓
                          All clients receive message
                                      ↓
                          app.js displays message
                                      ↓
                          Scroll to bottom
```

**Steps:**
1. User types message and submits form
2. Client emits 'message' event via Socket.IO
3. Server validates message (not empty, max 1000 chars)
4. Message saved to database with UserId
5. Server broadcasts message to ALL connected clients
6. Each client receives message with username and timestamp
7. Message displayed in chat (styled as 'sent' or 'received')
8. Chat scrolls to show latest message

### 5. Typing Indicator Flow

```
User types → input event → socket.emit('typing')
                                  ↓
                          Server receives
                                  ↓
                          socket.broadcast.emit('userTyping')
                                  ↓
                          Other clients show indicator
                                  ↓
                          After 1s timeout
                                  ↓
                          socket.emit('stopTyping')
                                  ↓
                          Indicator removed
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE `Users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL
);
```

**Fields:**
- `id`: Auto-incrementing primary key
- `username`: Unique username (3-50 characters)
- `password`: Bcrypt hashed password
- `createdAt`: Timestamp of account creation
- `updatedAt`: Timestamp of last update

### Messages Table
```sql
CREATE TABLE `Messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `text` VARCHAR(255) NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `UserId` INT,
  FOREIGN KEY (`UserId`) REFERENCES `Users`(`id`) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE
);
```

**Fields:**
- `id`: Auto-incrementing primary key
- `text`: Message content (max 1000 characters)
- `UserId`: Foreign key to Users table
- `createdAt`: Message timestamp
- `updatedAt`: Last update timestamp

**Relationships:**
- User has many Messages (One-to-Many)
- Message belongs to User
- ON DELETE SET NULL: If user deleted, messages remain but UserId becomes null
- ON UPDATE CASCADE: If user ID changes, messages update automatically

---

## Authentication System

### JWT Token Structure
```javascript
{
  id: user.id,
  username: user.username,
  iat: issuedAt,
  exp: expiresAt  // 7 days from issue
}
```

### Authentication Flow

#### HTTP Authentication (Login/Signup)
- Routes: `/auth/signup`, `/auth/login`
- Method: POST with JSON body
- Response: JWT token on success

#### WebSocket Authentication
- Method: Socket.IO middleware
- Token sent in `socket.handshake.auth.token`
- Verified before connection established
- User object attached to socket for all subsequent events

### Security Measures
1. **Password Hashing**: bcrypt with 10 salt rounds
2. **Input Validation**: 
   - Username: 3-50 characters
   - Password: minimum 6 characters
   - Message: max 1000 characters
3. **JWT Expiration**: 7-day token lifetime
4. **Environment Variables**: Secrets stored in `.env`
5. **Error Handling**: Generic error messages to prevent information leakage

---

## Real-Time Communication

### Socket.IO Events

#### Client → Server Events
| Event | Payload | Description |
|-------|---------|-------------|
| `connect` | - | Initial connection with JWT auth |
| `message` | `text: string` | Send a chat message |
| `typing` | - | User started typing |
| `stopTyping` | - | User stopped typing |
| `disconnect` | - | User disconnected |

#### Server → Client Events
| Event | Payload | Description |
|-------|---------|-------------|
| `connect` | - | Connection successful |
| `connect_error` | `error` | Authentication failed |
| `message` | `{text, user, timestamp}` | New message broadcast |
| `userCount` | `count: number` | Updated online user count |
| `userTyping` | `{username}` | Another user is typing |
| `userStoppedTyping` | `{username}` | User stopped typing |
| `error` | `{message}` | Error occurred |

### Connection Management

**connectedUsers Map:**
```javascript
Map {
  userId: {
    username: string,
    socketId: string
  }
}
```

- Tracks all active connections
- Updated on connect/disconnect
- Used to broadcast user count

---

## Frontend Components

### Pages

#### 1. index.html (Welcome Page)
- **Purpose**: Landing page
- **Features**: 
  - Animated chat icon
  - Gradient title
  - Login/Signup buttons
- **Navigation**: Links to login.html and signup.html

#### 2. signup.html
- **Purpose**: User registration
- **Features**:
  - Username input (min 3 chars)
  - Password input (min 6 chars)
  - Animated heading
  - Link to login page
- **Validation**: Client-side and server-side

#### 3. login.html
- **Purpose**: User authentication
- **Features**:
  - Username/password inputs
  - Remember credentials (autocomplete)
  - Link to signup page
- **Success**: Redirects to chat.html

#### 4. chat.html
- **Purpose**: Main chat interface
- **Features**:
  - Animated "ConnectHub" heading
  - Status bar with user count
  - Connection status indicator
  - Message display area
  - Message input form
  - Send button

### app.js (Client-Side Logic)

**Key Functions:**

1. **Form Handlers**
   - `signupForm.addEventListener()`: Handle registration
   - `loginForm.addEventListener()`: Handle login
   - `messageForm.addEventListener()`: Send messages

2. **Socket.IO Handlers**
   - Connection management
   - Message receiving
   - User count updates
   - Typing indicators

3. **Helper Functions**
   - `showNotification()`: Display toast notifications
   - `updateConnectionStatus()`: Update UI connection status
   - `updateUserCount()`: Update online user count

4. **Authentication Check**
   - Redirects to login if no token found
   - Runs on page load for chat.html

---

## Backend Components

### server.js (Main Server)

**Responsibilities:**
1. **Express Setup**
   - Serve static files from `/public`
   - Parse JSON requests
   - Mount auth routes at `/auth`

2. **Socket.IO Setup**
   - CORS configuration
   - Authentication middleware
   - Event handlers

3. **Connection Tracking**
   - Maintain `connectedUsers` Map
   - Broadcast user count changes

4. **Graceful Shutdown**
   - Handle SIGTERM and SIGINT
   - Close server and database connections

### routes/auth.js

**Endpoints:**

1. **POST /auth/signup**
   - Validate input
   - Hash password
   - Create user
   - Handle duplicate username error

2. **POST /auth/login**
   - Find user
   - Verify password
   - Generate JWT token
   - Return token and username

**Input Validation:**
```javascript
validateInput(username, password) {
  // Username: 3-50 characters
  // Password: minimum 6 characters
  // Returns array of error messages
}
```

### Models/

#### index.js
- Initialize Sequelize connection
- Configure database connection pool
- Define model relationships
- Sync database schema

#### User.js
- Define User model schema
- Username: unique, not null
- Password: not null (hashed)

#### message.js
- Define Message model schema
- Text: not null
- Belongs to User

---

## Security Features

### 1. Password Security
- **Hashing**: bcrypt with 10 salt rounds
- **Storage**: Only hashed passwords stored
- **Comparison**: bcrypt.compare() for verification

### 2. Authentication
- **JWT Tokens**: Signed with secret key
- **Expiration**: 7-day lifetime
- **Verification**: Required for WebSocket connections

### 3. Input Validation
- **Client-side**: HTML5 validation + JavaScript
- **Server-side**: Comprehensive validation in routes
- **Message limits**: Max 1000 characters
- **SQL Injection**: Prevented by Sequelize ORM

### 4. Error Handling
- **Generic messages**: Don't leak system information
- **Logging**: Errors logged server-side only
- **Try-catch blocks**: All async operations wrapped

### 5. Environment Variables
```env
JWT_SECRET=your_secret_key
DB_NAME=chat_users
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=localhost
PORT=3000
CLIENT_URL=http://localhost:3000
```

### 6. CORS Configuration
- Configured for Socket.IO
- Restricts allowed origins
- Limits HTTP methods to GET and POST

---

## Environment Setup

### Required Environment Variables
```env
# JWT Secret (REQUIRED)
JWT_SECRET=your_super_secret_key_here

# Database Configuration
DB_NAME=chat_users
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=localhost

# Server Configuration
PORT=3000
CLIENT_URL=http://localhost:3000
```

### Installation Steps
```bash
# 1. Install dependencies
npm install

# 2. Set up MySQL database
mysql -u root -p
CREATE DATABASE chat_users;

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your values

# 4. Start server
npm start

# 5. Access application
# Open browser to http://localhost:3000
```

---

## Data Flow Summary

### Complete User Journey

1. **First Visit**
   - User lands on `index.html`
   - Clicks "Sign Up"
   - Fills registration form
   - Account created in database
   - Redirected to login

2. **Login**
   - User enters credentials
   - JWT token generated
   - Token stored in localStorage
   - Redirected to chat

3. **Chat Session**
   - Socket.IO connects with JWT
   - User authenticated via middleware
   - Added to active users
   - Can send/receive messages in real-time
   - Messages persisted to database

4. **Logout/Disconnect**
   - User closes tab or navigates away
   - Socket disconnects
   - Removed from active users
   - User count updated for all clients

---

## Error Handling

### Client-Side Errors
- Network failures: Show notification
- Invalid input: Form validation
- Connection errors: Update status indicator

### Server-Side Errors
- Database errors: Logged, generic message to client
- Authentication errors: Reject connection
- Validation errors: Specific error messages
- Duplicate username: User-friendly error

### Socket.IO Error Events
```javascript
socket.on('error', (error) => {
  // Display error notification
  showNotification(error.message, 'error');
});
```

---

## Performance Optimizations

1. **Database Connection Pool**
   - Max 5 connections
   - 30s acquire timeout
   - 10s idle timeout

2. **SQL Query Logging**
   - Disabled in production
   - Reduces console overhead

3. **Message Validation**
   - Early return for invalid messages
   - Prevents unnecessary database calls

4. **Efficient Broadcasting**
   - `io.emit()` for all clients
   - `socket.broadcast.emit()` for others only

---

## Future Enhancements

Potential features to add:
- [ ] Private messaging
- [ ] Message editing/deletion
- [ ] File/image sharing
- [ ] User profiles with avatars
- [ ] Message read receipts
- [ ] Persistent message history on login
- [ ] Room/channel support
- [ ] User status (online/away/busy)
- [ ] Message search functionality
- [ ] Emoji support
- [ ] Dark/light theme toggle

---

## Troubleshooting

### Common Issues

**1. Cannot connect to database**
- Check MySQL is running
- Verify credentials in `.env`
- Ensure database exists

**2. JWT errors**
- Verify `JWT_SECRET` is set in `.env`
- Check token hasn't expired
- Clear localStorage and re-login

**3. Socket connection fails**
- Check token is valid
- Verify server is running
- Check browser console for errors

**4. Messages not sending**
- Verify socket is connected
- Check message length (max 1000 chars)
- Check server logs for errors

---

## Conclusion

ConnectHub is a full-stack real-time chat application demonstrating:
- Modern web development practices
- Secure authentication with JWT
- Real-time communication with WebSockets
- Database integration with ORM
- Responsive and modern UI design
- Proper error handling and validation

The application is production-ready with proper security measures, error handling, and scalable architecture.
