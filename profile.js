
const ADMIN_KEY = "lavenderAdminAccounts";
const ADMIN_SESSION_KEY = "lavenderAdminSession";

const $ = id => document.getElementById(id);

function getAdminAccounts() {
    try {
        return JSON.parse(localStorage.getItem(ADMIN_KEY)) || [];
    } catch (error) {
        console.error("Unable to load admin accounts:", error);
        return [];
    }
}

function getAdminSession() {
    try {
        return JSON.parse(sessionStorage.getItem(ADMIN_SESSION_KEY)) || null;
    } catch (error) {
        console.error("Unable to load admin session:", error);
        return null;
    }
}

function saveAdminAccounts(accounts) {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(accounts));
}

function saveAdminSession(admin) {
    sessionStorage.setItem(
        ADMIN_SESSION_KEY,
        JSON.stringify({
            id: admin.id,
            username: admin.username,
            fullName: admin.fullName
        })
    );
}

function updateAdminProfile(admin) {
    const fullName = admin.fullName || admin.username || "Administrator";
    const username = admin.username || "Not provided";
    const email = admin.email || "Not provided";
    const role = admin.role || "System Administrator";
    const initial = fullName.charAt(0).toUpperCase();

    if ($("profileAvatar")) {
        $("profileAvatar").textContent = initial;
    }

    if ($("profileName")) {
        $("profileName").textContent = fullName;
    }

    if ($("profileUserName")) {
        $("profileUserName").textContent = username;
    }

    if ($("profileFullName")) {
        $("profileFullName").textContent = fullName;
    }

    if ($("profileEmail")) {
        $("profileEmail").textContent = email;
    }

    if ($("profilePassword")) {
        $("profilePassword").textContent = "*".repeat(
            admin.password ? String(admin.password).length : 8
        );
    }

    if ($("profileRole")) {
        $("profileRole").textContent = role;
    }

    if ($("profileAccountStatus")) {
        $("profileAccountStatus").textContent = "Active";
    }

    if ($("statusDot")) {
        $("statusDot").classList.add("online");
    }

    if ($("topbarAvatar")) {
        $("topbarAvatar").textContent = initial;
    }

    if ($("topbarName")) {
        $("topbarName").textContent = fullName;
    }
}

function findCurrentAdmin(session, accounts) {
    if (!session) return null;

    return accounts.find(account => {
        if (session.id && account.id) {
            return String(account.id) === String(session.id);
        }

        return String(account.username || "").toLowerCase() ===
            String(session.username || "").toLowerCase();
    }) || null;
}

function setUpProfile() {
    const session = getAdminSession();

    if (!session) {
        window.location.href = "admin_login.html";
        return;
    }

    const accounts = getAdminAccounts();
    const admin = findCurrentAdmin(session, accounts);

    if (!admin) {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        alert("Administrator account not found. Please log in again.");
        window.location.href = "admin_login.html";
        return;
    }

    updateAdminProfile(admin);

    const changeNameButton = $("changeName");

    if (changeNameButton) {
        changeNameButton.addEventListener("click", () => {
            const newName = prompt(
                "Enter your new full name:",
                admin.fullName || ""
            );

            if (newName === null) return;

            const fullName = newName.trim();

            if (!fullName) {
                alert("Full name cannot be empty.");
                return;
            }

            const latestAccounts = getAdminAccounts();

            const index = latestAccounts.findIndex(account => {
                if (admin.id && account.id) {
                    return String(account.id) === String(admin.id);
                }

                return String(account.username || "").toLowerCase() ===
                    String(admin.username || "").toLowerCase();
            });

            if (index === -1) {
                alert("Unable to find your administrator account.");
                return;
            }

            latestAccounts[index].fullName = fullName;

            try {
                saveAdminAccounts(latestAccounts);

                admin.fullName = fullName;

                saveAdminSession(admin);
                updateAdminProfile(admin);

                alert("Your profile has been updated.");
            } catch (error) {
                console.error("Unable to update profile:", error);
                alert("Unable to save your changes.");
            }
        });
    }
}

function setUpLogout() {
    const logoutButtons = [
        $("logoutBtn"),
        $("profileLogoutBtn")
    ];

    logoutButtons.forEach(button => {
        if (!button) return;

        button.addEventListener("click", event => {
            event.preventDefault();

            if (!confirm("Are you sure you want to log out?")) {
                return;
            }

            sessionStorage.removeItem(ADMIN_SESSION_KEY);
            window.location.href = "admin_login.html";
        });
    });
}

function setUpSidebar() {
    const menuToggle = $("menuToggle");
    const sidebar = $("sidebar");

    if (!menuToggle || !sidebar) return;

    menuToggle.addEventListener("click", () => {
        const isOpen = sidebar.classList.toggle("show");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", event => {
        if (
            window.innerWidth <= 750 &&
            !sidebar.contains(event.target) &&
            !menuToggle.contains(event.target)
        ) {
            sidebar.classList.remove("show");
            menuToggle.setAttribute("aria-expanded", "false");
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    setUpProfile();
    setUpLogout();
    setUpSidebar();
});
