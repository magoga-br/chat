const { WebSocketServer, WebSocket } = require("ws")
const dotenv = require("dotenv")
const http = require("http")

// Load environment variables
dotenv.config()

// Create HTTP server for potential future expansion
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" })
  res.end("WebSocket Server Running")
})

// Create WebSocket server
const wss = new WebSocketServer({
  server,
  // Add ping/pong for connection stability
  clientTracking: true,
})

// Connection tracking
const clients = new Map()

// Interval for checking connections
const HEARTBEAT_INTERVAL = 30000

// Set up WebSocket server
wss.on("connection", (ws, req) => {
  // Set up error handling
  ws.on("error", (error) => {
    console.error("WebSocket error:", error)
  })

  // Set up ping/pong for connection stability
  ws.isAlive = true
  ws.on("pong", () => {
    ws.isAlive = true
  })

  // Generate client ID
  const clientId = Math.random().toString(36).substring(2, 15)
  clients.set(clientId, { ws, userId: null, userName: null })

  // Broadcast online count
  const broadcastOnlineCount = () => {
    const count = wss.clients.size
    const message = JSON.stringify({ type: "onlineCount", count })

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })
  }

  // Initial online count
  broadcastOnlineCount()

  // Handle client disconnect
  ws.on("close", () => {
    // Remove client from tracking
    clients.delete(clientId)

    // Update online count
    broadcastOnlineCount()

    console.log(`Client disconnected: ${clientId}`)
  })

  // Handle messages
  ws.on("message", (data) => {
    try {
      // Parse message
      const message = JSON.parse(data)

      // Store user info if first message
      if (!clients.get(clientId).userId && message.userId) {
        clients.get(clientId).userId = message.userId
        clients.get(clientId).userName = message.userName

        // Broadcast join message if not an empty message
        if (!message.content || message.content.length === 0) {
          const joinMessage = JSON.stringify({
            userId: "server",
            userName: "Servidor",
            userColor: "#f59e0b",
            content: `${message.userName} entrou no chat!`,
          })

          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(joinMessage)
            }
          })

          return
        }
      }

      // Validate message content
      if (!message.content || message.content.trim().length === 0) {
        return
      }

      // Rate limiting (simple implementation)
      const client = clients.get(clientId)
      if (client) {
        if (!client.lastMessageTime) {
          client.lastMessageTime = Date.now()
          client.messageCount = 1
        } else {
          const now = Date.now()
          const timeDiff = now - client.lastMessageTime

          // Reset counter after 10 seconds
          if (timeDiff > 10000) {
            client.lastMessageTime = now
            client.messageCount = 1
          } else {
            client.messageCount++

            // Rate limit: max 5 messages in 10 seconds
            if (client.messageCount > 5) {
              const rateLimitMessage = JSON.stringify({
                userId: "server",
                userName: "Servidor",
                userColor: "#ef4444",
                content: "Você está enviando mensagens muito rápido. Por favor, aguarde alguns segundos.",
              })

              ws.send(rateLimitMessage)
              return
            }
          }
        }
      }

      // Broadcast message to all clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data.toString())
        }
      })

      // Log message (in production, consider using a proper logging system)
      console.log(
        `Message from ${message.userName}: ${message.content.substring(0, 50)}${message.content.length > 50 ? "..." : ""}`,
      )
    } catch (error) {
      console.error("Invalid message received:", error)

      // Send error message to client
      const errorMessage = JSON.stringify({
        userId: "server",
        userName: "Servidor",
        userColor: "#ef4444",
        content: "Erro ao processar mensagem. Por favor, tente novamente.",
      })

      ws.send(errorMessage)
    }
  })

  console.log(`Client connected: ${clientId}`)
})

// Heartbeat to check for dead connections
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      return ws.terminate()
    }

    ws.isAlive = false
    ws.ping()
  })
}, HEARTBEAT_INTERVAL)

// Clean up on server close
wss.on("close", () => {
  clearInterval(interval)
})

// Start server
const PORT = process.env.PORT || 8080
server.listen(PORT, () => {
  console.log(`WebSocket server running on ws://localhost:${PORT}`)
  console.log(`HTTP server running on http://localhost:${PORT}`)
})
