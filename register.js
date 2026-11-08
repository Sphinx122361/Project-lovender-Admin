const registerForm = document.getElementById("adminRegisterForm");
const registerMessage = document.getElementById("registerMessage");

document.querySelectorAll(".toggle-password").forEach(button => {
    button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.target);

        if (!input) return;

        const isHidden = input.type === "password";

        input.type = isHidden ? "text" : "password";
        button.textContent = isHidden ? "Hide" : "Show";
    });
});

if (registerForm) {
    registerForm.addEventListener("submit", event => {
        event.preventDefault();

        const fullName = document.getElementById("adminFullName").value.trim();
        const username = document.getElementById("adminUsername").value.trim();
        const email = document.getElementById("adminEmail").value.trim();
        const password = document.getElementById("adminPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        registerMessage.style.color = "#B42336";
        registerMessage.textContent = "";

        if (!fullName || !username || !email || !password || !confirmPassword) {
            registerMessage.textContent = "Please complete all fields.";
            return;
        }

        if (password.length < 8) {
            registerMessage.textContent = "Password must be at least 8 characters.";
            return;
        }

        if (password !== confirmPassword) {
            registerMessage.textContent = "Passwords do not match.";
            return;
        }

        registerMessage.style.color = "#39966C";
        registerMessage.textContent =
            "Form validated. Connect the registration API to create your account.";
    });
}