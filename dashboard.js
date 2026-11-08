const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const logoutBtn = document.getElementById("logoutBtn");

if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", () => {
        sidebar.classList.toggle("show");
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", event => {
        event.preventDefault();

        const confirmLogout = confirm("Are you sure you want to log out?");

        if (confirmLogout) {
            window.location.href = "admin_login.html";
        }
    });
}