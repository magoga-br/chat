// login elements
const login = document.querySelector(".login");
const loginForm = login.querySelector(".login__form");
const loginInput = login.querySelector(".login__input");

// chat elements
const chat = document.querySelector(".chat");
const chatForm = chat.querySelector(".chat__form");
const chatInput = chat.querySelector(".chat__input");
const chatMessages = chat.querySelector(".chat__messages");
const fileInput = document.getElementById("fileInput");
const attachmentPreview = document.getElementById("attachmentPreview");
const fileNameDisplay = attachmentPreview.querySelector(".file-name");
const previewCloseButton = attachmentPreview.querySelector(".preview-close");

// Modal elements
const mediaModal = document.getElementById("mediaModal");
const modalContent = mediaModal.querySelector(".media-modal__content");
const modalClose = mediaModal.querySelector(".media-modal__close");

const colors = [
  "cadetblue",
  "darkgoldenrod",
  "cornflowerblue",
  "darkkhaki",
  "hotpink",
  "gold",
];

const user = { id: "", name: "", color: "" };

let websocket;

const openMediaModal = (mediaElement) => {
  const clonedMedia = mediaElement.cloneNode(true);
  modalContent.innerHTML = "";
  modalContent.appendChild(clonedMedia);

  if (clonedMedia.tagName === "VIDEO") {
    clonedMedia.controls = true;
  }

  mediaModal.classList.add("active");
};

const closeMediaModal = () => {
  mediaModal.classList.remove("active");
  modalContent.innerHTML = "";
};

const handleMediaClick = (event) => {
  if (event.target.tagName === "IMG" || event.target.tagName === "VIDEO") {
    openMediaModal(event.target);
  }
};

const createMessageSelfElement = (content, type = "text") => {
  const div = document.createElement("div");
  div.classList.add("message--self");

  if (type === "text") {
    div.innerHTML = content;
  } else if (type === "image") {
    const img = document.createElement("img");
    img.src = content;
    img.style.maxWidth = "100%";
    img.addEventListener("click", handleMediaClick);
    div.appendChild(img);
  } else if (type === "video") {
    const video = document.createElement("video");
    video.src = content;
    video.controls = true;
    video.style.maxWidth = "100%";
    video.addEventListener("click", handleMediaClick);
    div.appendChild(video);
  }

  return div;
};

const createMessageOtherElement = (
  content,
  sender,
  senderColor,
  type = "text"
) => {
  const div = document.createElement("div");
  const span = document.createElement("span");

  div.classList.add("message--other");
  span.classList.add("message--sender");
  span.style.color = senderColor;
  span.innerHTML = sender;
  div.appendChild(span);

  if (type === "text") {
    div.innerHTML += content;
  } else if (type === "image") {
    const img = document.createElement("img");
    img.src = content;
    img.style.maxWidth = "100%";
    img.addEventListener("click", handleMediaClick);
    div.appendChild(img);
  } else if (type === "video") {
    const video = document.createElement("video");
    video.src = content;
    video.controls = true;
    video.style.maxWidth = "100%";
    video.addEventListener("click", handleMediaClick);
    div.appendChild(video);
  }

  return div;
};

const getRandomColor = () => {
  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex];
};

const scrollScreen = () => {
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth",
  });
};

const processMessage = ({ data }) => {
  const { userId, userName, userColor, content, type } = JSON.parse(data);

  const message =
    userId == user.id
      ? createMessageSelfElement(content, type)
      : createMessageOtherElement(content, userName, userColor, type);

  chatMessages.appendChild(message);

  scrollScreen();
};

const handleLogin = (event) => {
  event.preventDefault();

  user.id = crypto.randomUUID();
  user.name = loginInput.value;
  user.color = getRandomColor();

  login.style.display = "none";
  chat.style.display = "flex";

  const WS_URL =
    location.hostname === "localhost"
      ? "ws://localhost:8080"
      : "wss://chat-9rs2.onrender.com/";
  websocket = new WebSocket(WS_URL);
  websocket.onmessage = processMessage;
};

const sendMessage = async (event) => {
  event.preventDefault();

  if (!chatInput.value.trim() && !fileInput.files.length) {
    return;
  }

  if (fileInput.files.length > 0) {
    // Envia os arquivos um por um
    const files = Array.from(fileInput.files);

    for (const file of files) {
      // Converte para promise para facilitar o processamento sequencial
      const readFileAsDataURL = (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      try {
        const content = await readFileAsDataURL(file);
        const message = {
          userId: user.id,
          userName: user.name,
          userColor: user.color,
          content: content,
          type: file.type.startsWith("image/") ? "image" : "video",
        };

        websocket.send(JSON.stringify(message));
      } catch (error) {
        console.error("Erro ao enviar arquivo:", error);
      }
    }

    clearFileInput();
  } else {
    const message = {
      userId: user.id,
      userName: user.name,
      userColor: user.color,
      content: chatInput.value,
      type: "text",
    };

    websocket.send(JSON.stringify(message));
    chatInput.value = "";
  }
};

const createFilePreviewItem = (file) => {
  const div = document.createElement("div");
  div.className = "file-preview-item";

  const fileName = document.createElement("span");
  fileName.className = "file-name";
  fileName.textContent = file.name;

  const removeButton = document.createElement("button");
  removeButton.className = "preview-close";
  removeButton.innerHTML =
    '<span class="material-symbols-outlined">close</span>';

  removeButton.onclick = () => {
    const dt = new DataTransfer();
    const files = [...fileInput.files];
    const index = files.indexOf(file);

    if (index !== -1) {
      files.splice(index, 1);
      files.forEach((file) => dt.items.add(file));
      fileInput.files = dt.files;

      if (fileInput.files.length === 0) {
        clearFileInput();
      } else {
        updateFilePreview();
      }
    }
  };

  div.appendChild(fileName);
  div.appendChild(removeButton);
  return div;
};

const updateFilePreview = () => {
  const previewContent = attachmentPreview.querySelector(".preview-content");
  previewContent.innerHTML = "";

  if (fileInput.files.length > 0) {
    Array.from(fileInput.files).forEach((file) => {
      previewContent.appendChild(createFilePreviewItem(file));
    });
    attachmentPreview.style.display = "block";
  } else {
    attachmentPreview.style.display = "none";
  }
};

const handleFileSelect = (event) => {
  if (fileInput.files.length > 0) {
    updateFilePreview();
  } else {
    attachmentPreview.style.display = "none";
  }
};

const clearFileInput = () => {
  fileInput.value = "";
  attachmentPreview.style.display = "none";
};

// Event listeners
loginForm.addEventListener("submit", handleLogin);
chatForm.addEventListener("submit", sendMessage);
fileInput.addEventListener("change", handleFileSelect);
previewCloseButton.addEventListener("click", clearFileInput);
modalClose.addEventListener("click", closeMediaModal);

// Fechar o modal quando clicar fora da mídia
mediaModal.addEventListener("click", (event) => {
  if (event.target === mediaModal || event.target === modalContent) {
    closeMediaModal();
  }
});
