# Chat Application - HTML/CSS/JavaScript Puro

Uma aplicação de chat em tempo real construída com tecnologias web puras.

## Estrutura do Projeto


    chat/
    ├── index.html              # Página principal
    ├── css/
    │   └── style.css          # Estilos da aplicação
    ├── js/
    │   └── app.js             # JavaScript principal
    ├── images/
    │   └── background.png     # Imagem de fundo
    ├── server/
    │   ├── server.js          # Servidor WebSocket
    │   └── package.json       # Dependências do servidor
    └── README.md              # Este arquivo


## Como Executar

### 1. Servidor Backend

    cd server
    npm install
    npm start


### 2. Frontend
Abra o arquivo `index.html` em um navegador ou use um servidor local:

    # Usando Python
    python -m http.server 3000

    # Usando Node.js
    npx http-server -p 3000

### 3. Acesso
- Frontend: `http://localhost:3000`

## Funcionalidades

- ✅ Chat em tempo real
- ✅ Sistema de autenticação
- ✅ Tema claro/escuro
- ✅ Design responsivo
- ✅ Notificações
- ✅ Reconexão automática
- ✅ Limitação de taxa
- ✅ Acessibilidade

## Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: Node.js, WebSocket
- **Sem frameworks**: Código 100% puro
