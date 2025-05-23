document.addEventListener("DOMContentLoaded", () => {

    const register = document.querySelector(".register");
      // Login elements
  const login = document.querySelector(".login");
  const loginForm = document.querySelector("#login-form");
  const loginInput = document.querySelector(".login__input");
  const loginPassword = document.querySelector(".login__password");
  // Chat elements
  const chat = document.querySelector(".chat");
  const chatForm = document.querySelector(".chat__form");
  const chatInput = document.querySelector(".chat__input");
  const chatMessages = document.querySelector(".chat__messages");

  // Verify DOM elements
  if (!login || !loginForm || !loginInput || !loginPassword || !chat || !chatForm || !chatInput || !chatMessages) {
    console.error("One or more DOM elements not found:", {
      login, loginForm, loginInput, loginPassword, chat, chatForm, chatInput, chatMessages
    });
    return;
  }

  const colors = [
    "cadetblue",
    "darkgoldenrod",
    "cornflowerblue",
    "darkkhaki",
    "hotpink",
    "gold"
  ];

  const user = {
    id: "",
    name: "",
    color: ""
  };

  let websocket;
  let onlineCount = 1;

  const users = [{ name: "admin", password: "ratogordo" }];

  const updateOnlineCount = (count) => {
    onlineCount = count;
    let onlineDiv = document.querySelector(".chat__online");
    if (!onlineDiv) {
      onlineDiv = document.createElement("div");
      onlineDiv.className = "chat__online";
      chatForm.insertBefore(onlineDiv, chatInput);
    }
    onlineDiv.innerHTML = `<span class="material-symbols-outlined" style="vertical-align:middle; font-size:1.2rem; color:cadetblue;">group</span> <span style="color:cadetblue; font-weight:600;">${onlineCount}</span> online`;
  };

  const createMessageSelfElement = (content) => {
    const div = document.createElement("div");
    div.classList.add("message--self");
    div.innerHTML = content;
    return div;
  };

  const createMessageOtherElement = (content, sender, senderColor) => {
    const div = document.createElement("div");
    const span = document.createElement("span");
    const contentDiv = document.createElement("div");

    div.classList.add("message--other");
    span.classList.add("message--sender");
    span.style.color = senderColor;
    span.innerHTML = sender;
    contentDiv.innerHTML = content;

    div.appendChild(span);
    div.appendChild(contentDiv);
    return div;
  };

  const createSystemMessageElement = (content) => {
    const div = document.createElement("div");
    div.classList.add("message--system");
    div.innerHTML = content;
    return div;
  };

  const getRandomColor = () => {
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
  };

  const scrollScreen = () => {
    chatMessages.scrollTo({
      top: chatMessages.scrollHeight,
      behavior: "smooth"
    });
  };

  const processMessage = ({ data }) => {
    try {
      if (data.startsWith('{"type":"onlineCount"')) {
        const { count } = JSON.parse(data);
        updateOnlineCount(count);
        return;
      }

      const { userId, userName, userColor, content } = JSON.parse(data);

      if (userId === "server") {
        const message = createSystemMessageElement(content);
        chatMessages.appendChild(message);
        scrollScreen();
        return;
      }

      const message =
        userId === user.id
          ? createMessageSelfElement(content)
          : createMessageOtherElement(content, userName, userColor);

      chatMessages.appendChild(message);
      scrollScreen();
    } catch (e) {
      console.warn("Mensagem recebida não é JSON válido:", data);
    }
  };

  const initializeWebSocket = () => {
    websocket = new WebSocket("https://chat-9rs2.onrender.com");

    websocket.onopen = () => {
      console.log("WebSocket connected");
      websocket.send(
        JSON.stringify({
          userId: user.id,
          userName: user.name,
          userColor: user.color,
          content: ""
        })
      );
      const joinMessage = createSystemMessageElement("Conectado ao chat!");
      chatMessages.appendChild(joinMessage);
      scrollScreen();
    };

    websocket.onmessage = processMessage;

    websocket.onerror = () => {
      console.error("WebSocket error");
      const errorMessage = createSystemMessageElement("Erro de conexão com o servidor.");
      chatMessages.appendChild(errorMessage);
      scrollScreen();
    };

    websocket.onclose = () => {
      console.log("WebSocket closed");
      const closeMessage = createSystemMessageElement("Desconectado do servidor. Tentando reconectar...");
      chatMessages.appendChild(closeMessage);
      scrollScreen();
      setTimeout(initializeWebSocket, 5000);
    };
  };

  const handleLogin = (event) => {
    event.preventDefault();
    console.log("Login form submitted");

    const username = loginInput.value;
    const password = loginPassword.value;

    const foundUser = users.find(
      (user) => user.name.toLowerCase() === username.toLowerCase() && user.password === password
    );

    if (!foundUser) {
      const loginMessage = document.createElement("p");
      loginMessage.textContent = "Usuário ou senha incorretos!";
      loginMessage.style.color = "#ff4d4d";
      loginMessage.style.textAlign = "center";
      loginMessage.style.marginTop = "10px";
      loginForm.appendChild(loginMessage);
      setTimeout(() => loginMessage.remove(), 3000);
      return;
    }

    user.id = crypto.randomUUID();
    user.name = username;
    user.color = getRandomColor();

    login.classList.add("hidden");
    login.style.display = "none";
    if (register) {
      register.classList.add("hidden");
      register.style.display = "none";
    }
    chat.classList.remove("hidden");
    chat.style.display = "flex";

    initializeWebSocket();
  };

  loginForm.addEventListener("submit", handleLogin);

  const registerForm = document.querySelector("#register-form");
  const registerInput = document.querySelector(".register__input");
  const registerPassword = document.querySelector(".register__password");
  const registerMessage = document.querySelector(".register__message");

  const handleRegisterSubmit = (event) => {
    event.preventDefault();
    console.log("Register form submitted");

    if (!registerInput || !registerPassword || !registerMessage) {
      console.error("Register elements not found in DOM");
      return;
    }

    const username = registerInput.value;
    const password = registerPassword.value;

    if (!username || !password) {
      registerMessage.textContent = "Nome de usuário e senha são obrigatórios!";
      registerMessage.className = "register__message register__message--error";
      return;
    }

    const userExists = users.some((user) => user.name.toLowerCase() === username.toLowerCase());

    if (userExists) {
      registerMessage.textContent = "Usuário já cadastrado!";
      registerMessage.className = "register__message register__message--error";
      return;
    }

    users.push({ name: username, password });
    registerMessage.textContent = "Usuário cadastrado com sucesso!";
    registerMessage.className = "register__message register__message--success";
    registerInput.value = "";
    registerPassword.value = "";
  };

  if (registerForm) {
    registerForm.addEventListener("submit", handleRegisterSubmit);
  }

  const loginRegisterLink = document.querySelector(".login__register--link");
  if (loginRegisterLink) {
    loginRegisterLink.addEventListener("click", () => {
      console.log("Toggle to register form");
      document.querySelector(".login").classList.add("hidden");
      document.querySelector(".register").classList.remove("hidden");
    });
  }

  const sendMessage = (event) => {
    event.preventDefault();
    if (!chatInput || !websocket || websocket.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket not ready or chat input missing");
      return;
    }

    const message = {
      userId: user.id,
      userName: user.name,
      userColor: user.color,
      content: chatInput.value
    };

    if (chatInput.value.trim() === "") return;

    websocket.send(JSON.stringify(message));
    chatInput.value = "";
  };

  chatForm.addEventListener("submit", sendMessage);
});
