
const ADMIN_KEY = "lavenderAdminAccounts";
const ADMIN_SESSION_KEY = "lavenderAdminSession";

const DB_NAME = "ProjectLavenderDB";
const DB_VERSION = 2;

let allOrders = [];

const $ = id => document.getElementById(id);

function getAdminAccounts() {
    try {
        return JSON.parse(localStorage.getItem(ADMIN_KEY)) || [];
    } catch (error) {
        console.error("Unable to read admin accounts:", error);
        return [];
    }
}

const loginForm = $("adminLoginForm");

if (loginForm) {
    const togglePassword = $("togglePassword");

    if (togglePassword) {
        togglePassword.addEventListener("click", () => {
            const password = $("adminPassword");
            const isHidden = password.type === "password";

            password.type = isHidden ? "text" : "password";
            togglePassword.textContent = isHidden ? "Hide" : "Show";
        });
    }

    loginForm.addEventListener("submit", event => {
        event.preventDefault();

        const username = $("adminUsername").value.trim();
        const password = $("adminPassword").value;
        const message = $("loginMessage");

        message.style.color = "#B42336";
        message.textContent = "";

        const accounts = getAdminAccounts();

        const admin = accounts.find(account =>
            account.username.toLowerCase() === username.toLowerCase() &&
            account.password === password
        );

        if (!admin) {
            message.textContent = "Incorrect username or password.";
            return;
        }

        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({
            id: admin.id,
            username: admin.username,
            fullName: admin.fullName
        }));

        message.style.color = "#39966C";
        message.textContent = "Login successful! Redirecting...";

        setTimeout(() => {
            window.location.href = "admin_order.html";
        }, 1000);
    });
}

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = event => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains("orders")) {
                db.createObjectStore("orders", {
                    keyPath: "id"
                });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getAllOrders() {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        if (!db.objectStoreNames.contains("orders")) {
            db.close();
            reject(new Error("Orders object store does not exist."));
            return;
        }

        const transaction = db.transaction("orders", "readonly");
        const request = transaction.objectStore("orders").getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);

        transaction.oncomplete = () => db.close();
        transaction.onerror = () => db.close();
    });
}

function displayOrders(orders) {
    const table = $("ordersTable");

    if (!table) return;

    table.replaceChildren();

    if (!orders.length) {
        const row = table.insertRow();
        const cell = row.insertCell();

        cell.colSpan = 9;
        cell.textContent = "No student orders found.";

        return;
    }

    orders.forEach(order => {
        const row = table.insertRow();

        [
            order.id,
            order.studentName,
            order.studentId,
            order.type,
            order.paperSize,
            order.copies,
            order.color,
            order.fileName,
            order.status
        ].forEach(value => {
            row.insertCell().textContent = String(value ?? "");
        });
    });
}

async function loadAdminOrders() {
    try {
        allOrders = await getAllOrders();

        console.log("Orders retrieved:", allOrders);

        displayOrders(allOrders);

    } catch (error) {
        console.error("Unable to load orders:", error);

        const table = $("ordersTable");

        if (table) {
            table.innerHTML =
                '<tr><td colspan="9">Unable to load orders. Check the browser console.</td></tr>';
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if ($("ordersTable")) {
        loadAdminOrders();
    }
});
