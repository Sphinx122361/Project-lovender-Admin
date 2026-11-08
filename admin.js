
const DB_NAME = "ProjectLavenderDB";
const DB_VERSION = 2;

let allOrders = [];

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

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };

        transaction.oncomplete = () => db.close();
        transaction.onerror = () => db.close();
    });
}

function displayOrders(orders) {
    const table = document.getElementById("ordersTable");

    if (!table) {
        console.error("Cannot find the ordersTable element.");
        return;
    }

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

        const table = document.getElementById("ordersTable");

        if (table) {
            table.innerHTML =
                '<tr><td colspan="9">Unable to load orders. Check the browser console.</td></tr>';
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadAdminOrders();
});
