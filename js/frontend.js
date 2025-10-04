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