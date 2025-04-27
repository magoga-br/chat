<h1 align="center">💬 Chat em Tempo Real</h1>

<h2 align="center">Acesse o <a href="https://chat-frontend-2dvg.onrender.com">chat<a/></h2>

<p align="center">
  <img src="assets/images/image.png" alt="Chat Banner" width="100%"/>
</p>

<p align="center">
  Projeto de <b>chat em tempo real</b> com <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="24" height="24" alt="Node.js"/> Node.js, <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" width="24" height="24" alt="JavaScript"/> JavaScript e <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" width="24" height="24" alt="HTML5"/> HTML5.
</p>

---

## ✨ Descrição

Este projeto é um chat em tempo real, com frontend em HTML, CSS e JavaScript puro, e backend em Node.js utilizando WebSocket. Permite que múltiplos usuários conversem simultaneamente de forma simples e rápida.

---

## 📁 Estrutura do Projeto

```
backend/
  ├── .env
  ├── package.json
  └── src/
      └── server.js
frontend/
  ├── index.html
  ├── css/
  │   └── style.css
  ├── js/
  │   └── script.js
  └── images/
      └── background.png
```

---

## 🚀 Como Executar

### <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="20" height="20" /> Backend

```sh
cd backend
npm install
# (Opcional) Edite o .env para definir a porta:
# PORT=8080
npm start
```

### <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" width="20" height="20" /> Frontend

Abra o arquivo `frontend/index.html` no navegador.

> ⚠️ **Nota:** Para rodar localmente, altere a URL do WebSocket em `frontend/js/script.js` para `ws://localhost:8080`.

---

## ⚙️ Configuração

- Variáveis de ambiente no arquivo `.env` do backend:
  - `PORT`: Porta do servidor WebSocket (padrão: 8080).

---

## 🛠️ Funcionalidades

- 👤 Login com nome personalizado e cor aleatória.
- 💬 Envio e recebimento de mensagens em tempo real.
- 🎨 Diferenciação visual entre mensagens enviadas e recebidas.
- 📱 Interface responsiva e moderna.

---

## 🧰 Tecnologias Utilizadas

- <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" width="20" height="20" /> **HTML5**
- <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg" width="20" height="20" /> **CSS3**
- <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" width="20" height="20" /> **JavaScript**
- <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="20" height="20" /> **Node.js**
- <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/npm/npm-original-wordmark.svg" width="20" height="20" /> **npm**
- 🔌 **WebSocket (`ws`)**
- 🔒 **dotenv**

---
Desenvolvido para fins de estudo e aprendizado.