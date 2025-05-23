// Remove the import statements since we're using vanilla JavaScript without modules
// Replace the imports with direct function calls

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
