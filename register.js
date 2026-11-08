
const ADMIN_KEY = "lavenderAdminAccounts";

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

function getAdminAccounts() {
    try {
        return JSON.parse(localStorage.getItem(ADMIN_KEY)) || [];
    } catch {
        return [];
    }
}

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

        const accounts = getAdminAccounts();

        const existingAccount = accounts.some(account =>
            account.username.toLowerCase() === username.toLowerCase() ||
            account.email.toLowerCase() === email.toLowerCase()
        );

        if (existingAccount) {
            registerMessage.textContent =
                "Username or email is already registered.";
            return;
        }

        accounts.push({
            id: Date.now(),
            fullName,
            username,
            email,
            password
        });

        localStorage.setItem(ADMIN_KEY, JSON.stringify(accounts));

        registerMessage.style.color = "#39966C";
        registerMessage.textContent =
            "Admin account created successfully! Redirecting to login...";

        registerForm.reset();

        setTimeout(() => {
            window.location.href = "admin_login.html";
        }, 1500);
    });
}
