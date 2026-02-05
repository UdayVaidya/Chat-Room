document.addEventListener("DOMContentLoaded", function () {
  const signupForm = document.getElementById("signupForm");
  const loginForm = document.getElementById("loginForm");
  const messageForm = document.getElementById("messageForm");
  const messagesDiv = document.getElementById("messages");

  let currentUser = localStorage.getItem("username");
  const token = localStorage.getItem("token");

  // Redirect to login if not authenticated
  if (!token && window.location.pathname.includes("chat.html")) {
    window.location.href = "login.html";
  }

  // Signup form handler
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      const submitBtn = e.target.querySelector('button[type="submit"]');

      submitBtn.disabled = true;
      submitBtn.textContent = "Signing up...";

      try {
        const response = await fetch("/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.status === 201) {
          showNotification("Sign up successful! Redirecting to Chat Room", "success");
          setTimeout(() => {
            window.location.href = "chat.html";
          }, 1500);
        } else {
          showNotification(data.error || "Sign up failed", "error");
          submitBtn.disabled = false;
          submitBtn.textContent = "Sign Up";
        }
      } catch (error) {
        showNotification("Network error. Please try again.", "error");
        submitBtn.disabled = false;
        submitBtn.textContent = "Sign Up";
      }
    });
  }

  // Login form handler
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      const submitBtn = e.target.querySelector('button[type="submit"]');

      submitBtn.disabled = true;
      submitBtn.textContent = "Logging in...";

      try {
        const response = await fetch("/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("username", username);
          currentUser = username;
          showNotification("Login successful! Redirecting...", "success");
          setTimeout(() => {
            window.location.href = "chat.html";
          }, 1000);
        } else {
          showNotification(data.error || "Login failed", "error");
          submitBtn.disabled = false;
          submitBtn.textContent = "Login";
        }
      } catch (error) {
        showNotification("Network error. Please try again.", "error");
        submitBtn.disabled = false;
        submitBtn.textContent = "Login";
      }
    });
  }

  // Chat functionality
  if (messageForm) {
    const socket = io({
      auth: {
        token: localStorage.getItem("token"),
      },
    });

    let typingTimeout;

    // Connection handlers
    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      updateConnectionStatus(true);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connection failed:", err.message);
      updateConnectionStatus(false);
      showNotification("Connection error. Please refresh the page.", "error");
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
      updateConnectionStatus(false);
    });

    // User count handler
    socket.on("userCount", (count) => {
      updateUserCount(count);
    });

    // Message handler
    socket.on("message", (message) => {
      const messageElement = document.createElement("div");

      if (message.user === currentUser) {
        messageElement.textContent = `You: ${message.text}`;
        messageElement.classList.add("message", "sent");
      } else {
        messageElement.textContent = `${message.user}: ${message.text}`;
        messageElement.classList.add("message", "received");
      }

      messagesDiv.appendChild(messageElement);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });

    // Error handler
    socket.on("error", (error) => {
      showNotification(error.message || "An error occurred", "error");
    });

    // Message form submission
    messageForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const messageInput = document.getElementById("message");
      const messageText = messageInput.value.trim();

      if (!messageText) return;

      socket.emit("message", messageText);
      messageInput.value = "";
      socket.emit("stopTyping");
    });

    // Typing indicator
    const messageInput = document.getElementById("message");
    messageInput.addEventListener("input", () => {
      socket.emit("typing");
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        socket.emit("stopTyping");
      }, 1000);
    });
  }
});

// Helper function to show notifications
function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === "success" ? "rgba(16, 185, 129, 0.9)" : type === "error" ? "rgba(239, 68, 68, 0.9)" : "rgba(59, 130, 246, 0.9)"};
    color: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    animation: slideInRight 0.3s ease-out;
  `;

  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = "slideOutRight 0.3s ease-out";
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Helper function to update connection status
function updateConnectionStatus(connected) {
  const statusBar = document.querySelector(".status-bar");
  if (!statusBar) return;

  const statusElement = statusBar.querySelector(".connection-status") || document.createElement("div");
  statusElement.className = "connection-status";
  statusElement.textContent = connected ? "Connected" : "Disconnected";
  statusElement.style.color = connected ? "#10b981" : "#ef4444";

  if (!statusBar.querySelector(".connection-status")) {
    statusBar.appendChild(statusElement);
  }
}

// Helper function to update user count
function updateUserCount(count) {
  const userCountElement = document.getElementById("userCount");
  if (userCountElement) {
    userCountElement.textContent = count;
  }
}

// Add CSS animations
const style = document.createElement("style");
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
