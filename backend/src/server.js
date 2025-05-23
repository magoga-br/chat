const { WebSocketServer, WebSocket } = require("ws");
const dotenv = require("dotenv");
const http = require("http");
const { Pool } = require("pg");
const url = require("url");
const bcrypt = require("bcryptjs");

// Load environment variables
dotenv.config();

// Configuração da conexão com o banco de dados PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Exemplo de teste de conexão ao iniciar o servidor
pool.connect((err, client, release) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err.stack);
  } else {
    console.log("Conexão com o banco de dados estabelecida!");
    release();
  }
});

// Garante que a tabela users existe ao iniciar o servidor
(async () => {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    )`);
    console.log("Tabela 'users' verificada/criada com sucesso!");
  } catch (e) {
    console.error("Erro ao criar tabela 'users':", e);
  }
})();

// Create HTTP server for potential future expansion
const server = http.createServer((req, res) => {
  // Adiciona CORS para permitir requisições do frontend local e produção
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://magoga-chat.vercel.app"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WebSocket Server Running");
});

// Rotas HTTP para cadastro e login de usuário
server.on("request", async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  if (req.method === "POST" && parsedUrl.pathname === "/register") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      try {
        const { username, password } = JSON.parse(body);
        if (!username || !password) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Usuário e senha obrigatórios" }));
          return;
        }
        const hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
          "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username",
          [username, hash]
        );
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            id: result.rows[0].id,
            username: result.rows[0].username,
          })
        );
      } catch (err) {
        if (err.code === "23505") {
          res.writeHead(409, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Usuário já existe" }));
        } else {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Erro ao cadastrar usuário" }));
        }
      }
    });
    return;
  }
  if (req.method === "POST" && parsedUrl.pathname === "/login") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      try {
        const { username, password } = JSON.parse(body);
        if (!username || !password) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Usuário e senha obrigatórios" }));
          return;
        }
        const result = await pool.query(
          "SELECT id, username, password FROM users WHERE username = $1",
          [username]
        );
        if (result.rows.length === 0) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Usuário ou senha inválidos" }));
          return;
        }
        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Usuário ou senha inválidos" }));
          return;
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ id: user.id, username: user.username }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Erro ao fazer login" }));
      }
    });
    return;
  }
});

// Create WebSocket server
const wss = new WebSocketServer({
  server,
  // Add ping/pong for connection stability
  clientTracking: true,
});

// Connection tracking
const clients = new Map();

// Interval for checking connections
const HEARTBEAT_INTERVAL = 30000;

// Set up WebSocket server
wss.on("connection", (ws, req) => {
  // Set up error handling
  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  // Set up ping/pong for connection stability
  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });

  // Generate client ID
  const clientId = Math.random().toString(36).substring(2, 15);
  clients.set(clientId, { ws, userId: null, userName: null });

  // Broadcast online count
  const broadcastOnlineCount = () => {
    const count = wss.clients.size;
    const message = JSON.stringify({ type: "onlineCount", count });

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  // Initial online count
  broadcastOnlineCount();

  // Handle client disconnect
  ws.on("close", () => {
    // Remove client from tracking
    clients.delete(clientId);

    // Update online count
    broadcastOnlineCount();

    console.log(`Client disconnected: ${clientId}`);
  });

  // Handle messages
  ws.on("message", (data) => {
    try {
      // Parse message
      const message = JSON.parse(data);

      // Store user info if first message
      if (!clients.get(clientId).userId && message.userId) {
        clients.get(clientId).userId = message.userId;
        clients.get(clientId).userName = message.userName;

        // Broadcast join message if not an empty message
        if (!message.content || message.content.length === 0) {
          const joinMessage = JSON.stringify({
            userId: "server",
            userName: "Servidor",
            userColor: "#f59e0b",
            content: `${message.userName} entrou no chat!`,
          });

          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(joinMessage);
            }
          });

          return;
        }
      }

      // Validate message content
      if (!message.content || message.content.trim().length === 0) {
        return;
      }

      // Rate limiting (simple implementation)
      const client = clients.get(clientId);
      if (client) {
        if (!client.lastMessageTime) {
          client.lastMessageTime = Date.now();
          client.messageCount = 1;
        } else {
          const now = Date.now();
          const timeDiff = now - client.lastMessageTime;

          // Reset counter after 10 seconds
          if (timeDiff > 10000) {
            client.lastMessageTime = now;
            client.messageCount = 1;
          } else {
            client.messageCount++;

            // Rate limit: max 5 messages in 10 seconds
            if (client.messageCount > 5) {
              const rateLimitMessage = JSON.stringify({
                userId: "server",
                userName: "Servidor",
                userColor: "#ef4444",
                content:
                  "Você está enviando mensagens muito rápido. Por favor, aguarde alguns segundos.",
              });

              ws.send(rateLimitMessage);
              return;
            }
          }
        }
      }

      // Broadcast message to all clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data.toString());
        }
      });

      // Log message (in production, consider using a proper logging system)
      console.log(
        `Message from ${message.userName}: ${message.content.substring(0, 50)}${
          message.content.length > 50 ? "..." : ""
        }`
      );
    } catch (error) {
      console.error("Invalid message received:", error);

      // Send error message to client
      const errorMessage = JSON.stringify({
        userId: "server",
        userName: "Servidor",
        userColor: "#ef4444",
        content: "Erro ao processar mensagem. Por favor, tente novamente.",
      });

      ws.send(errorMessage);
    }
  });

  console.log(`Client connected: ${clientId}`);
});

// Heartbeat to check for dead connections
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping();
  });
}, HEARTBEAT_INTERVAL);

// Clean up on server close
wss.on("close", () => {
  clearInterval(interval);
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
  console.log(`HTTP server running on http://localhost:${PORT}`);
});
