function UIModule() {
  // DOM Elements
  let notificationContainer;
  let themeToggle;

  // Initialize module
  const initialize = () => {
    // Create notification container if it doesn't exist
    if (!document.querySelector(".notification-container")) {
      notificationContainer = document.createElement("div");
      notificationContainer.className = "notification-container";
      document.body.appendChild(notificationContainer);
    } else {
      notificationContainer = document.querySelector(".notification-container");
    }

    // Get theme toggle button
    themeToggle = document.querySelector(".theme-toggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", toggleTheme);
    }

    // Set up event listeners
    document.addEventListener("ui:notification", (event) => {
      showNotification(event.detail.message, event.detail.type);
    });

    // Initialize theme
    initializeTheme();

    // Add responsive handlers
    handleResponsiveLayout();
    window.addEventListener("resize", handleResponsiveLayout);
  };

  // Show notification
  const showNotification = (message, type = "info") => {
    const notification = document.createElement("div");
    notification.className = `notification notification--${type}`;
    notification.setAttribute("role", "alert");

    notification.innerHTML = `
      <div class="notification__icon">
        ${getNotificationIcon(type)}
      </div>
      <div class="notification__message">${message}</div>
    `;

    notificationContainer.appendChild(notification);

    // Add visible class after a small delay (for animation)
    setTimeout(() => {
      notification.classList.add("notification--visible");
    }, 10);

    // Remove notification after delay
    setTimeout(() => {
      notification.classList.remove("notification--visible");

      // Remove from DOM after animation completes
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 5000);
  };

  // Theme handling
  const initializeTheme = () => {
    const savedTheme = localStorage.getItem("theme");
    if (
      savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark-theme");
      updateThemeToggleIcon("dark");
    } else {
      document.documentElement.classList.remove("dark-theme");
      updateThemeToggleIcon("light");
    }
  };

  const toggleTheme = () => {
    if (document.documentElement.classList.contains("dark-theme")) {
      document.documentElement.classList.remove("dark-theme");
      localStorage.setItem("theme", "light");
      updateThemeToggleIcon("light");
    } else {
      document.documentElement.classList.add("dark-theme");
      localStorage.setItem("theme", "dark");
      updateThemeToggleIcon("dark");
    }
  };

  const updateThemeToggleIcon = (theme) => {
    if (!themeToggle) return;

    const iconElement = themeToggle.querySelector("span");
    if (iconElement) {
      iconElement.textContent = theme === "dark" ? "light_mode" : "dark_mode";
    }
  };

  // Responsive layout handling
  const handleResponsiveLayout = () => {
    const isMobile = window.innerWidth < 768;
    document.body.classList.toggle("is-mobile", isMobile);
  };

  // Utility functions
  const getNotificationIcon = (type) => {
    switch (type) {
      case "success":
        return '<span class="material-symbols-outlined">check_circle</span>';
      case "error":
        return '<span class="material-symbols-outlined">error</span>';
      case "warning":
        return '<span class="material-symbols-outlined">warning</span>';
      default:
        return '<span class="material-symbols-outlined">info</span>';
    }
  };

  // Public API
  return {
    initialize,
    showNotification,
  };
}

export default UIModule;
