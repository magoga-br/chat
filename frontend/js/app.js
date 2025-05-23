// Import module definitions (assuming they are in separate files)
import AuthModule from "./auth.js"
import ChatModule from "./chat.js"
import UIModule from "./ui.js"

// Main application entry point
document.addEventListener("DOMContentLoaded", () => {
  // Initialize modules - these functions are now available globally
  const authModule = AuthModule()
  const chatModule = ChatModule()
  const uiModule = UIModule()

  // Set up event listeners for application flow
  authModule.initialize()
  chatModule.initialize()
  uiModule.initialize()
})
