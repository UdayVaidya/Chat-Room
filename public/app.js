document.addEventListener("DOMContentLoaded", function () {
  const signupForm = document.getElementById("signupForm");
  const loginForm = document.getElementById("loginForm");
  const messageForm = document.getElementById("messageForm");
  const messagesDiv = document.getElementById("messages");

  let currentUser = localStorage.getItem("username");

  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      try {
        const response = await fetch("/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });
        if (response.status === 201) {
          alert("Sign up successful");
          window.location.href = "login.html";
        } else {
          const error = await response.json();
          alert("Sign up failed: " + error.error);
        }
      } catch (error) {
        alert("Sign up failed: " + error.message);
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      try {
        const response = await fetch("/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });
        if (response.ok) {
          const data = await response.json();
          localStorage.setItem("token", data.token);
          localStorage.setItem("username", username);
          currentUser = username;
          window.location.href = "chat.html";
        } else {
          const error = await response.json();
          alert("Login Failed", error);
        }
      } catch (e) {
        alert("Login Failed", e);
      }
    });
  }

  if (messageForm) {
    const socket = io({
      auth: {
        token: localStorage.getItem("token"),
      },
    });

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

    // Handle message form submission
    messageForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const messageInput = document.getElementById("message");
      const messageText = messageInput.value;
      socket.emit("message", messageText);
      messageInput.value = "";

      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
  }
});
