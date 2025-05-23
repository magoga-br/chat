function AuthModule() {
  // DOM Elements
  let loginForm, registerForm, loginLink, registerLink;
  let loginInput, loginPassword, registerInput, registerPassword;

  // In-memory user store (would be replaced with proper backend in production)
  const users = [{ name: "admin", password: "magoga" }];

  // Current user data
  const user = {
    id: "",
    name: "",
    color: "",
    avatar: "",
  };

  // Backend URL dinâmico
  const getBackendUrl = () => {
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      return "http://localhost:8080";
    }
    return "https://chat-9rs2.onrender.com";
  };

  // Initialize module
  const initialize = () => {
    // Get DOM elements
    loginForm = document.querySelector("#login-form");
    registerForm = document.querySelector("#register-form");
    loginLink = document.querySelector(".login__link");
    registerLink = document.querySelector(".register__link");
    loginInput = document.querySelector(".login__input");
    loginPassword = document.querySelector(".login__password");
    registerInput = document.querySelector(".register__input");
    registerPassword = document.querySelector(".register__password");

    // Set up event listeners
    if (loginForm) loginForm.addEventListener("submit", handleLogin);
    if (registerForm) registerForm.addEventListener("submit", handleRegister);
    if (loginLink) loginLink.addEventListener("click", showLoginForm);
    if (registerLink) registerLink.addEventListener("click", showRegisterForm);
  };

  // Handle login form submission
  const handleLogin = async (event) => {
    event.preventDefault();

    const username = loginInput.value.trim();
    const password = loginPassword.value;

    if (!username || !password) {
      showNotification("Por favor, preencha todos os campos", "error");
      return;
    }

    try {
      console.log("[LOGIN] Enviando para:", getBackendUrl() + "/login");
      const response = await fetch(getBackendUrl() + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        showNotification(data.error || "Erro ao fazer login", "error");
        return;
      }

      // Set user data
      user.id = data.id;
      user.name = data.username;
      user.color = getRandomColor();
      user.avatar = generateAvatar(username);

      // Save to session storage
      sessionStorage.setItem("user", JSON.stringify(user));

      // Show chat interface
      document.dispatchEvent(
        new CustomEvent("auth:login-success", { detail: user })
      );
      showNotification(`Bem-vindo, ${username}!`, "success");
    } catch (err) {
      console.error("[LOGIN] Erro:", err);
      showNotification("Erro de conexão com o servidor", "error");
    }
  };

  // Handle register form submission
  const handleRegister = async (event) => {
    event.preventDefault();

    const username = registerInput.value.trim();
    const password = registerPassword.value;

    if (!username || !password) {
      showNotification("Por favor, preencha todos os campos", "error");
      return;
    }

    if (password.length < 6) {
      showNotification("A senha deve ter pelo menos 6 caracteres", "error");
      return;
    }

    try {
      console.log("[REGISTER] Enviando para:", getBackendUrl() + "/register");
      const response = await fetch(getBackendUrl() + "/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        showNotification(data.error || "Erro ao cadastrar", "error");
        return;
      }

      // Clear form and show success
      registerInput.value = "";
      registerPassword.value = "";
      showNotification(
        "Conta criada com sucesso! Faça login para continuar.",
        "success"
      );

      // Switch to login form
      showLoginForm();
    } catch (err) {
      console.error("[REGISTER] Erro:", err);
      showNotification("Erro de conexão com o servidor", "error");
    }
  };

  // UI helpers
  const showLoginForm = () => {
    document.querySelector(".login").classList.remove("hidden");
    document.querySelector(".register").classList.add("hidden");
  };

  const showRegisterForm = () => {
    document.querySelector(".login").classList.add("hidden");
    document.querySelector(".register").classList.remove("hidden");
  };

  // Utility functions
  const colors = [
    "#3498db", // Blue
    "#2ecc71", // Green
    "#e74c3c", // Red
    "#f39c12", // Orange
    "#9b59b6", // Purple
    "#1abc9c", // Teal
  ];

  const getRandomColor = () => {
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
  };

  const generateAvatar = (username) => {
    const initial = username.charAt(0).toUpperCase();
    return initial;
  };

  const showNotification = (message, type) => {
    document.dispatchEvent(
      new CustomEvent("ui:notification", {
        detail: { message, type },
      })
    );
  };

  // Public API
  return {
    initialize,
    getCurrentUser: () => user,
  };
}

export default AuthModule;
