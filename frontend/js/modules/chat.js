// Chat Module
function ChatModule() {
  // DOM Elements
  let chatContainer, chatMessages, chatForm, chatInput, logoutButton;

  // WebSocket connection
  let websocket;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 5;

  // Current user
  let currentUser = null;

  // Initialize module
  const initialize = () => {
    // Get DOM elements
    chatContainer = document.querySelector(".chat");
    chatMessages = document.querySelector(".chat__messages");
    chatForm = document.querySelector(".chat__form");
    chatInput = document.querySelector(".chat__input");
    logoutButton = document.querySelector(".chat__logout");

    // Set up event listeners
    if (chatForm) chatForm.addEventListener("submit", sendMessage);
    if (logoutButton) logoutButton.addEventListener("click", handleLogout);

    // Listen for auth events
    document.addEventListener("auth:login-success", (event) => {
      currentUser = event.detail;
      showChatInterface();
      initializeWebSocket();
    });

    // Check for existing session
    const savedUser = sessionStorage.getItem("user");
    if (savedUser) {
      currentUser = JSON.parse(savedUser);
      showChatInterface();
      initializeWebSocket();
    }
  };

  // Show chat interface
  const showChatInterface = () => {
    document.querySelector(".auth-container").classList.add("hidden");
    chatContainer.classList.remove("hidden");

    // Set user info in header
    const userInfo = document.querySelector(".chat__user-info");
    if (userInfo) {
      const avatar = userInfo.querySelector(".user-avatar");
      const name = userInfo.querySelector(".user-name");

      if (avatar) {
        avatar.textContent = currentUser.avatar;
        avatar.style.backgroundColor = currentUser.color;
      }

      if (name) {
        name.textContent = currentUser.name;
      }
    }

    // Focus chat input
    setTimeout(() => chatInput.focus(), 100);
  };

  // Initialize WebSocket connection
  const initializeWebSocket = () => {
    // Show connecting message
    appendSystemMessage("Conectando ao servidor...");

    // Sempre usar o backend da Render em produção
    let wsUrl;
    if (window.location.hostname === "localhost") {
      wsUrl = "ws://localhost:8080";
    } else {
      wsUrl = "wss://chat-9rs2.onrender.com";
    }

    websocket = new WebSocket(wsUrl);

    // WebSocket event handlers
    websocket.onopen = handleWebSocketOpen;
    websocket.onmessage = handleWebSocketMessage;
    websocket.onerror = handleWebSocketError;
    websocket.onclose = handleWebSocketClose;
  };

  // WebSocket event handlers
  const handleWebSocketOpen = () => {
    console.log("WebSocket connected");
    reconnectAttempts = 0;

    // Send join message
    websocket.send(
      JSON.stringify({
        userId: currentUser.id,
        userName: currentUser.name,
        userColor: currentUser.color,
        content: "",
      })
    );

    appendSystemMessage("Conectado ao chat!");
    updateConnectionStatus("online");
  };

  const handleWebSocketMessage = ({ data }) => {
    try {
      // Handle online count updates
      if (data.startsWith('{"type":"onlineCount"')) {
        const { count } = JSON.parse(data);
        updateOnlineCount(count);
        return;
      }

      // Parse message data
      const { userId, userName, userColor, content } = JSON.parse(data);

      // Handle system messages
      if (userId === "server") {
        appendSystemMessage(content);
        return;
      }

      // Handle user messages
      appendMessage(userId, userName, userColor, content);
    } catch (e) {
      console.warn("Invalid message received:", data);
    }
  };

  const handleWebSocketError = () => {
    console.error("WebSocket error");
    appendSystemMessage("Erro de conexão com o servidor.");
    updateConnectionStatus("error");
  };

  const handleWebSocketClose = () => {
    console.log("WebSocket closed");
    updateConnectionStatus("offline");

    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      const delay = Math.min(1000 * reconnectAttempts, 5000);

      appendSystemMessage(
        `Desconectado do servidor. Tentando reconectar em ${
          delay / 1000
        } segundos...`
      );

      setTimeout(() => {
        if (document.visibilityState === "visible") {
          initializeWebSocket();
        }
      }, delay);
    } else {
      appendSystemMessage(
        "Não foi possível reconectar ao servidor. Por favor, recarregue a página."
      );
    }
  };

  // Send message
  const sendMessage = (event) => {
    event.preventDefault();

    const messageText = chatInput.value.trim();
    if (!messageText) return;

    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
      appendSystemMessage(
        "Não foi possível enviar a mensagem. Conexão perdida."
      );
      return;
    }

    const message = {
      userId: currentUser.id,
      userName: currentUser.name,
      userColor: currentUser.color,
      content: messageText,
    };

    websocket.send(JSON.stringify(message));
    chatInput.value = "";
  };

  // Handle logout
  const handleLogout = () => {
    // Close WebSocket
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.close();
    }

    // Clear session
    sessionStorage.removeItem("user");
    currentUser = null;

    // Clear chat messages
    chatMessages.innerHTML = "";

    // Show login form
    document.querySelector(".auth-container").classList.remove("hidden");
    chatContainer.classList.add("hidden");
    document.querySelector(".login").classList.remove("hidden");
    document.querySelector(".register").classList.add("hidden");

    // Show notification
    document.dispatchEvent(
      new CustomEvent("ui:notification", {
        detail: { message: "Você saiu do chat", type: "info" },
      })
    );
  };

  // UI helpers
  const appendMessage = (userId, userName, userColor, content) => {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (userId === currentUser.id) {
      // Self message
      const messageElement = document.createElement("div");
      messageElement.classList.add("message", "message--self");

      messageElement.innerHTML = `
        <div class="message__content">${escapeHTML(content)}</div>
        <div class="message__time">${timestamp}</div>
      `;

      chatMessages.appendChild(messageElement);
    } else {
      // Other user message
      const messageElement = document.createElement("div");
      messageElement.classList.add("message", "message--other");

      messageElement.innerHTML = `
        <div class="message__avatar" style="background-color: ${userColor}">${userName
        .charAt(0)
        .toUpperCase()}</div>
        <div class="message__bubble">
          <div class="message__sender" style="color: ${userColor}">${escapeHTML(
        userName
      )}</div>
          <div class="message__content">${escapeHTML(content)}</div>
          <div class="message__time">${timestamp}</div>
        </div>
      `;

      chatMessages.appendChild(messageElement);
    }

    scrollToBottom();
  };

  const appendSystemMessage = (content) => {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", "message--system");
    messageElement.textContent = content;

    chatMessages.appendChild(messageElement);
    scrollToBottom();
  };

  const updateOnlineCount = (count) => {
    const onlineCountElement = document.querySelector(".chat__online-count");
    if (onlineCountElement) {
      onlineCountElement.textContent = count;
    }
  };

  const updateConnectionStatus = (status) => {
    const statusElement = document.querySelector(".connection-status");
    if (!statusElement) return;

    statusElement.className = "connection-status";
    statusElement.classList.add(`connection-status--${status}`);

    switch (status) {
      case "online":
        statusElement.textContent = "Conectado";
        break;
      case "offline":
        statusElement.textContent = "Desconectado";
        break;
      case "error":
        statusElement.textContent = "Erro de conexão";
        break;
      default:
        statusElement.textContent = "Conectando...";
    }
  };

  const scrollToBottom = () => {
    chatMessages.scrollTo({
      top: chatMessages.scrollHeight,
      behavior: "smooth",
    });
  };

  // Utility functions
  const escapeHTML = (str) => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // Public API
  return {
    initialize,
  };
}
