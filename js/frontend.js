document.addEventListener("DOMContentLoaded", () => {
  // Load header
  fetch("/includes/header.html")
    .then(response => {
      if (!response.ok) throw new Error("Header not found");
      return response.text();
    })
    .then(data => {
      document.getElementById("header").innerHTML = data;
    })
    .catch(err => console.error("Error loading header:", err));

  // Load footer (optional)
  fetch("/includes/footer.html")
    .then(response => {
      if (!response.ok) throw new Error("Footer not found");
      return response.text();
    })
    .then(data => {
      document.getElementById("footer").innerHTML = data;
    })
    .catch(err => console.error("Error loading footer:", err));
});

document.addEventListener("DOMContentLoaded", () => {
  // Load header
  fetch("/includes/header.html")
    .then(res => res.text())
    .then(data => {
      document.getElementById("header").innerHTML = data;
      setupThemeToggle(); // call after header is loaded
    });
});

// 🌙 Theme handling
function setupThemeToggle() {
  const toggleButton = document.getElementById("themeToggle");
  const savedTheme = localStorage.getItem("theme");

  // Apply saved theme or system preference
  if (savedTheme === "dark" || 
      (savedTheme === null && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.body.classList.add("dark-mode");
  }

  // Set initial icon
  updateButtonIcon();

  // Toggle on click
  toggleButton.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    updateButtonIcon();
  });
}

function updateButtonIcon() {
  const toggleButton = document.getElementById("themeToggle");
  if (!toggleButton) return;
  toggleButton.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
}