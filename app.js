// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { 
  getDatabase, 
  ref, 
  push, 
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  update,
  remove 
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAPPSJkIk7uM4yuSwGtYbGJiMbj23q2eFA",
  authDomain: "authentication-app-3f05c.firebaseapp.com",
  projectId: "authentication-app-3f05c",
  storageBucket: "authentication-app-3f05c.firebasestorage.app",
  messagingSenderId: "37141128681",
  appId: "1:37141128681:web:e7c9a8f8c5cb084643d778",
  measurementId: "G-W8DMJBCYFW",
  databaseURL: "https://authentication-app-3f05c-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getDatabase(app);

// ========== AUTHENTICATION FUNCTIONS ==========

// Sign Up with Email/Password
document.getElementById("signup-btn")?.addEventListener("click", () => {
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  if (password !== confirmPassword) {
    alert("Passwords don't match!");
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("Sign Up Successful!");
      window.location.href = "welcome.html";
    })
    .catch((error) => {
      alert(error.message);
    });
});

// Login with Email/Password
document.getElementById("login-btn")?.addEventListener("click", () => {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("Login Successful!");
      window.location.href = "welcome.html";
    })
    .catch((error) => {
      alert(error.message);
    });
});

// Continue with Google
document.getElementById("google-btn")?.addEventListener("click", () => {
  signInWithPopup(auth, provider)
    .then(() => {
      alert("Login Successful!");
      window.location.href = "welcome.html";
    })
    .catch((error) => {
      alert(error.message);
    });
});

// Logout
document.getElementById("logout-btn")?.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      alert("Logged Out Successfully!");
      window.location.href = "index.html";
    })
    .catch((error) => {
      alert(error.message);
    });
});

// Reset Password
document.getElementById("reset-password-link")?.addEventListener("click", (e) => {
  e.preventDefault(); 
  const email = prompt("Please enter your email address:");

  if (email) {
    sendPasswordResetEmail(auth, email)
      .then(() => {
        alert("Password reset email sent! Check your inbox.");
      })
      .catch((error) => {
        alert("Error: " + error.message);
      });
  } else {
    alert("Please enter a valid email address.");
  }
});

// Show User Email on Welcome Page
onAuthStateChanged(auth, (user) => {
  if (user && window.location.pathname.includes("welcome.html")) {
    document.getElementById("user-email").textContent = user.email;
  } else if (!user && window.location.pathname.includes("welcome.html")) {
    window.location.href = "index.html";
  }
});

// ========== USERNAME MANAGEMENT ==========

// Save username
document.getElementById("save-username")?.addEventListener("click", () => {
  const username = document.getElementById("username").value;
  
  if (username === "") {
    alert("Please enter a username");
    return;
  }
  
  localStorage.setItem('chatUsername', username);
  window.location.href = "chat.html";
});

// Skip username setup
document.getElementById("skip-btn")?.addEventListener("click", () => {
  localStorage.setItem('chatUsername', 'Anonymous');
  window.location.href = "chat.html";
});

// ========== CHAT FUNCTIONALITY ==========

// Theme toggle functionality
document.getElementById('theme-toggle')?.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
  const icon = document.querySelector('#theme-toggle i');
  if (document.body.classList.contains('dark-theme')) {
    icon.className = 'fas fa-sun';
  } else {
    icon.className = 'fas fa-moon';
  }
});

// Check authentication state for chat page
onAuthStateChanged(auth, (user) => {
  if (window.location.pathname.includes("chat.html")) {
    if (!user) {
      window.location.href = "signin.html";
    } else {
      // Check if user has a username set
      if (!localStorage.getItem('chatUsername')) {
        window.location.href = "user.html";
      } else {
        // Initialize chat listeners only after auth is confirmed
        initializeChatListeners();
      }
    }
  }
  
  // Check authentication for user page
  if (window.location.pathname.includes("user.html") && !user) {
    window.location.href = "signin.html";
  }
});

// Make sendMessage globally accessible
window.sendMessage = function () {
  const message = document.getElementById("message").value;
  const username = localStorage.getItem('chatUsername') || 'Anonymous';

  if (message === "") return;

  // Push message to Firebase
  push(ref(db, "messages"), {
    name: username,
    text: message,
    uid: auth.currentUser.uid,
    timestamp: Date.now()
  });
  
  document.getElementById("message").value = "";
};

// Edit message function
function editMessage(messageKey, currentText) {
  const newText = prompt("Edit your message:", currentText);
  if (newText !== null && newText !== "" && newText !== currentText) {
    update(ref(db, `messages/${messageKey}`), {
      text: newText,
      edited: true
    });
  }
}

// Delete message function
function deleteMessage(messageKey) {
  if (confirm("Are you sure you want to delete this message?")) {
    remove(ref(db, `messages/${messageKey}`));
  }
}

// Create message element
function createMessageElement(snapshot, data) {
  const messageElement = document.createElement("div");
  
  // Determine if message is from current user
  const isOwnMessage = data.uid === auth.currentUser?.uid;
  messageElement.className = `message ${isOwnMessage ? 'own' : 'other'}`;
  messageElement.setAttribute('data-message-id', snapshot.key);
  
  // Format timestamp
  const time = new Date(data.timestamp);
  const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  messageElement.innerHTML = `
    <div class="message-header">${data.name}</div>
    <div class="message-text">${data.text}${data.edited ? ' <span class="edited-badge">(edited)</span>' : ''}</div>
    <div class="message-time">${timeString}</div>
    ${isOwnMessage ? `
      <div class="message-actions">
        <button class="message-action edit-btn" onclick="editMessage('${snapshot.key}', \`${data.text.replace(/`/g, '\\`').replace(/\\/g, '\\\\')}\`)">
          <i class="fas fa-edit"></i>
        </button>
        <button class="message-action delete-btn" onclick="deleteMessage('${snapshot.key}')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    ` : ''}
  `;
  
  return messageElement;
}

// Initialize chat listeners
function initializeChatListeners() {
  const messageBox = document.getElementById("messages");
  if (!messageBox) return;
  
  // Listen for new messages
  onChildAdded(ref(db, "messages"), function(snapshot) {
    const data = snapshot.val();
    
    // Check if message already exists
    if (document.querySelector(`[data-message-id="${snapshot.key}"]`)) {
      return;
    }
    
    const messageElement = createMessageElement(snapshot, data);
    messageBox.appendChild(messageElement);
    messageBox.scrollTop = messageBox.scrollHeight;
  });
  
  // Listen for edited messages
  onChildChanged(ref(db, "messages"), function(snapshot) {
    const data = snapshot.val();
    const existingMessage = document.querySelector(`[data-message-id="${snapshot.key}"]`);
    
    if (existingMessage) {
      const newMessageElement = createMessageElement(snapshot, data);
      existingMessage.replaceWith(newMessageElement);
    }
  });
  
  // Listen for deleted messages
  onChildRemoved(ref(db, "messages"), function(snapshot) {
    const messageElement = document.querySelector(`[data-message-id="${snapshot.key}"]`);
    if (messageElement) {
      messageElement.remove();
    }
  });
}

// Make functions globally accessible
window.editMessage = editMessage;
window.deleteMessage = deleteMessage;

// Allow sending message with Enter key
document.getElementById("message")?.addEventListener("keypress", function(e) {
  if (e.key === "Enter") {
    sendMessage();
  }
});
