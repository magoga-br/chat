// Chat Application - Pure JavaScript
document.addEventListener("DOMContentLoaded", () => {
  // ===== AUTHENTICATION MODULE =====
  const AuthModule = {
    users: [{ name: "admin", password: "ratogordo" }],
    currentUser: { id: "", name: "", color: "", avatar: "" },

    init() {
      this.bindEvents()
    },

    bindEvents() {
      const loginForm = document.querySelector("#login-form")
      const registerForm = document.querySelector("#register-form")
      const loginLink = document.querySelector(".login__link")
      const registerLink = document.querySelector(".register__link")

      if (loginForm) loginForm.addEventListener("submit", this.handleLogin.bind(this))
      if (registerForm) registerForm.addEventListener("submit", this.handleRegister.bind(this))
      if (loginLink) loginLink.addEventListener("click", this.showLoginForm.bind(this))
      if (registerLink) registerLink.addEventListener("click", this.showRegisterForm.bind(this))
    },

    handleLogin(event) {
      event.preventDefault()

      const username = document.querySelector(".login__input").value.trim()
      const password = document.querySelector(".login__password").value

      if (!username || !password) {
        UIModule.showNotification("Por favor, preencha todos os campos", "error")
        return
      }

      const foundUser = this.users.find(
        (u) => u.name.toLowerCase() === username.toLowerCase() && u.password === password,
      )

      if (!foundUser) {
        UIModule.showNotification("Usuário ou senha incorretos", "error")
        return
      }

      this.currentUser.id = crypto.randomUUID()
      this.currentUser.name = username
      this.currentUser.color = this.getRandomColor()
      this.currentUser.avatar = username.charAt(0).toUpperCase()

      sessionStorage.setItem("user", JSON.stringify(this.currentUser))

      ChatModule.showChatInterface(this.currentUser)
      UIModule.showNotification(`Bem-vindo, ${username}!`, "success")
    },

    handleRegister(event) {
      event.preventDefault()

      const username = document.querySelector(".register__input").value.trim()
      const password = document.querySelector(".register__password").value

      if (!username || !password) {
        UIModule.showNotification("Por favor, preencha todos os campos", "error")
        return
      }

      if (password.length < 6) {
        UIModule.showNotification("A senha deve ter pelo menos 6 caracteres", "error")
        return
      }

      const userExists = this.users.some((u) => u.name.toLowerCase() === username.toLowerCase())

      if (userExists) {
        UIModule.showNotification("Este nome de usuário já está em uso", "error")
        return
      }

      this.users.push({ name: username, password })

      document.querySelector(".register__input").value = ""
      document.querySelector(".register__password").value = ""

      UIModule.showNotification("Conta criada com sucesso! Faça login para continuar.", "success")
      this.showLoginForm()
    },

    showLoginForm() {
      document.querySelector(".login").classList.remove("hidden")
      document.querySelector(".register").classList.add("hidden")
    },

    showRegisterForm() {
      document.querySelector(".login").classList.add("hidden")
      document.querySelector(".register").classList.remove("hidden")
    },

    getRandomColor() {
      const colors = ["#3498db", "#2ecc71", "#e74c3c", "#f39c12", "#9b59b6", "#1abc9c"]
      return colors[Math.floor(Math.random() * colors.length)]
    },
  }

  // ===== CHAT MODULE =====
  const ChatModule = {
    websocket: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    currentUser: null,

    init() {
      this.bindEvents()
      this.checkExistingSession()
    },

    bindEvents() {
      const chatForm = document.querySelector(".chat__form")
      const logoutButton = document.querySelector(".chat__logout")

      if (chatForm) chatForm.addEventListener("submit", this.sendMessage.bind(this))
      if (logoutButton) logoutButton.addEventListener("click", this.handleLogout.bind(this))
    },

    checkExistingSession() {
      const savedUser = sessionStorage.getItem("user")
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser)
        this.showChatInterface(this.currentUser)
      }
    },

    showChatInterface(user) {
      this.currentUser = user

      document.querySelector(".auth-container").classList.add("hidden")
      document.querySelector(".chat").classList.remove("hidden")

      const avatar = document.querySelector(".user-avatar")
      const name = document.querySelector(".user-name")

      if (avatar) {
        avatar.textContent = user.avatar
        avatar.style.backgroundColor = user.color
      }
      if (name) name.textContent = user.name

      setTimeout(() => {
        const chatInput = document.querySelector(".chat__input")
        if (chatInput) chatInput.focus()
      }, 100)

      this.initializeWebSocket()
    },

    initializeWebSocket() {
      this.appendSystemMessage("Conectando ao servidor...")

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
      const wsUrl =
        window.location.hostname === "localhost" ? "ws://localhost:8080" : `${protocol}//${window.location.host}`

      this.websocket = new WebSocket(wsUrl)

      this.websocket.onopen = this.handleWebSocketOpen.bind(this)
      this.websocket.onmessage = this.handleWebSocketMessage.bind(this)
      this.websocket.onerror = this.handleWebSocketError.bind(this)
      this.websocket.onclose = this.handleWebSocketClose.bind(this)
    },

    handleWebSocketOpen() {
      console.log("WebSocket connected")
      this.reconnectAttempts = 0

      this.websocket.send(
        JSON.stringify({
          userId: this.currentUser.id,
          userName: this.currentUser.name,
          userColor: this.currentUser.color,
          content: "",
        }),
      )

      this.appendSystemMessage("Conectado ao chat!")
      this.updateConnectionStatus("online")
    },

    handleWebSocketMessage({ data }) {
      try {
        if (data.startsWith('{"type":"onlineCount"')) {
          const { count } = JSON.parse(data)
          this.updateOnlineCount(count)
          return
        }

        const { userId, userName, userColor, content } = JSON.parse(data)

        if (userId === "server") {
          this.appendSystemMessage(content)
          return
        }

        this.appendMessage(userId, userName, userColor, content)
      } catch (e) {
        console.warn("Invalid message received:", data)
      }
    },

    handleWebSocketError() {
      console.error("WebSocket error")
      this.appendSystemMessage("Erro de conexão com o servidor.")
      this.updateConnectionStatus("error")
    },

    handleWebSocketClose() {
      console.log("WebSocket closed")
      this.updateConnectionStatus("offline")

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        const delay = Math.min(1000 * this.reconnectAttempts, 5000)

        this.appendSystemMessage(`Desconectado do servidor. Tentando reconectar em ${delay / 1000} segundos...`)

        setTimeout(() => {
          if (document.visibilityState === "visible") {
            this.initializeWebSocket()
          }
        }, delay)
      } else {
        this.appendSystemMessage("Não foi possível reconectar ao servidor. Por favor, recarregue a página.")
      }
    },

    sendMessage(event) {
      event.preventDefault()

      const chatInput = document.querySelector(".chat__input")
      const messageText = chatInput.value.trim()

      if (!messageText) return

      if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
        this.appendSystemMessage("Não foi possível enviar a mensagem. Conexão perdida.")
        return
      }

      const message = {
        userId: this.currentUser.id,
        userName: this.currentUser.name,
        userColor: this.currentUser.color,
        content: messageText,
      }

      this.websocket.send(JSON.stringify(message))
      chatInput.value = ""
    },

    handleLogout() {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.close()
      }

      sessionStorage.removeItem("user")
      this.currentUser = null

      document.querySelector(".chat__messages").innerHTML = ""
      document.querySelector(".auth-container").classList.remove("hidden")
      document.querySelector(".chat").classList.add("hidden")
      document.querySelector(".login").classList.remove("hidden")
      document.querySelector(".register").classList.add("hidden")

      UIModule.showNotification("Você saiu do chat", "info")
    },

    appendMessage(userId, userName, userColor, content) {
      const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      const chatMessages = document.querySelector(".chat__messages")

      if (userId === this.currentUser.id) {
        const messageElement = document.createElement("div")
        messageElement.classList.add("message", "message--self")
        messageElement.innerHTML = `
          <div class="message__content">${this.escapeHTML(content)}</div>
          <div class="message__time">${timestamp}</div>
        `
        chatMessages.appendChild(messageElement)
      } else {
        const messageElement = document.createElement("div")
        messageElement.classList.add("message", "message--other")
        messageElement.innerHTML = `
          <div class="message__avatar" style="background-color: ${userColor}">${userName.charAt(0).toUpperCase()}</div>
          <div class="message__bubble">
            <div class="message__sender" style="color: ${userColor}">${this.escapeHTML(userName)}</div>
            <div class="message__content">${this.escapeHTML(content)}</div>
            <div class="message__time">${timestamp}</div>
          </div>
        `
        chatMessages.appendChild(messageElement)
      }

      this.scrollToBottom()
    },

    appendSystemMessage(content) {
      const messageElement = document.createElement("div")
      messageElement.classList.add("message", "message--system")
      messageElement.textContent = content

      document.querySelector(".chat__messages").appendChild(messageElement)
      this.scrollToBottom()
    },

    updateOnlineCount(count) {
      const onlineCountElement = document.querySelector(".chat__online-count")
      if (onlineCountElement) {
        onlineCountElement.textContent = count
      }
    },

    updateConnectionStatus(status) {
      const statusElement = document.querySelector(".connection-status")
      if (!statusElement) return

      statusElement.className = "connection-status"
      statusElement.classList.add(`connection-status--${status}`)

      switch (status) {
        case "online":
          statusElement.textContent = "Conectado"
          break
        case "offline":
          statusElement.textContent = "Desconectado"
          break
        case "error":
          statusElement.textContent = "Erro de conexão"
          break
        default:
          statusElement.textContent = "Conectando..."
      }
    },

    scrollToBottom() {
      const chatMessages = document.querySelector(".chat__messages")
      chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: "smooth",
      })
    },

    escapeHTML(str) {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
    },
  }

  // ===== UI MODULE =====
  const UIModule = {
    notificationContainer: null,

    init() {
      this.createNotificationContainer()
      this.bindEvents()
      this.initializeTheme()
      this.handleResponsiveLayout()
      window.addEventListener("resize", this.handleResponsiveLayout.bind(this))
    },

    createNotificationContainer() {
      if (!document.querySelector(".notification-container")) {
        this.notificationContainer = document.createElement("div")
        this.notificationContainer.className = "notification-container"
        document.body.appendChild(this.notificationContainer)
      } else {
        this.notificationContainer = document.querySelector(".notification-container")
      }
    },

    bindEvents() {
      const themeToggle = document.querySelector(".theme-toggle")
      if (themeToggle) {
        themeToggle.addEventListener("click", this.toggleTheme.bind(this))
      }
    },

    showNotification(message, type = "info") {
      const notification = document.createElement("div")
      notification.className = `notification notification--${type}`
      notification.setAttribute("role", "alert")

      notification.innerHTML = `
        <div class="notification__icon">
          ${this.getNotificationIcon(type)}
        </div>
        <div class="notification__message">${message}</div>
      `

      this.notificationContainer.appendChild(notification)

      setTimeout(() => {
        notification.classList.add("notification--visible")
      }, 10)

      setTimeout(() => {
        notification.classList.remove("notification--visible")
        setTimeout(() => {
          notification.remove()
        }, 300)
      }, 5000)
    },

    initializeTheme() {
      const savedTheme = localStorage.getItem("theme")
      if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
        document.documentElement.classList.add("dark-theme")
        this.updateThemeToggleIcon("dark")
      } else {
        document.documentElement.classList.remove("dark-theme")
        this.updateThemeToggleIcon("light")
      }
    },

    toggleTheme() {
      if (document.documentElement.classList.contains("dark-theme")) {
        document.documentElement.classList.remove("dark-theme")
        localStorage.setItem("theme", "light")
        this.updateThemeToggleIcon("light")
      } else {
        document.documentElement.classList.add("dark-theme")
        localStorage.setItem("theme", "dark")
        this.updateThemeToggleIcon("dark")
      }
    },

    updateThemeToggleIcon(theme) {
      const themeToggle = document.querySelector(".theme-toggle")
      if (!themeToggle) return

      const iconElement = themeToggle.querySelector("span")
      if (iconElement) {
        iconElement.textContent = theme === "dark" ? "light_mode" : "dark_mode"
      }
    },

    handleResponsiveLayout() {
      const isMobile = window.innerWidth < 768
      document.body.classList.toggle("is-mobile", isMobile)
    },

    getNotificationIcon(type) {
      switch (type) {
        case "success":
          return '<span class="material-symbols-outlined">check_circle</span>'
        case "error":
          return '<span class="material-symbols-outlined">error</span>'
        case "warning":
          return '<span class="material-symbols-outlined">warning</span>'
        default:
          return '<span class="material-symbols-outlined">info</span>'
      }
    },
  }

  // ===== INITIALIZE APPLICATION =====
  AuthModule.init()
  ChatModule.init()
  UIModule.init()
})
