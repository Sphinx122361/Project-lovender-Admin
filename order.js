
const DB_NAME = "ProjectLavenderDB";
const DB_VERSION = 2;

let allOrders = [];
let selectedOrder = null;
let currentFileURL = null;

const $ = id => document.getElementById(id);

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onsuccess = () => {
            const db = request.result;

            if (!db.objectStoreNames.contains("orders")) {
                db.close();
                reject(new Error("Orders database store does not exist."));
                return;
            }

            resolve(db);
        };

        request.onerror = () => reject(request.error);
    });
}

async function getAllOrders() {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction("orders", "readonly");
        const request = transaction.objectStore("orders").getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);

        transaction.oncomplete = () => db.close();
        transaction.onerror = () => db.close();
        transaction.onabort = () => db.close();
    });
}

function formatDate(date) {
    if (!date) return "—";

    const parsedDate = new Date(date);

    return Number.isNaN(parsedDate.getTime())
        ? "—"
        : parsedDate.toLocaleString();
}

function updateSummary() {
    const counts = {
        totalOrders: allOrders.length,
        submittedOrders: 0,
        processingOrders: 0,
        readyOrders: 0,
        completedOrders: 0
    };

    allOrders.forEach(order => {
        switch (order.status) {
            case "Order Submitted":
                counts.submittedOrders++;
                break;

            case "Processing":
                counts.processingOrders++;
                break;

            case "Ready for Pickup":
                counts.readyOrders++;
                break;

            case "Completed":
                counts.completedOrders++;
                break;
        }
    });

    Object.entries(counts).forEach(([id, count]) => {
        const element = $(id);

        if (element) {
            element.textContent = count;
        }
    });
}

function displayOrders() {
    const table = $("ordersTable");

    const search = $("searchOrders").value.toLowerCase().trim();
    const status = $("statusFilter").value;
    const type = $("typeFilter").value;

    const filteredOrders = allOrders.filter(order => {

        const matchesSearch =
            String(order.id || "").toLowerCase().includes(search) ||
            String(order.studentName || "").toLowerCase().includes(search);

        const matchesStatus =
            !status || order.status === status;

        const matchesType =
            !type || order.type === type;

        return matchesSearch && matchesStatus && matchesType;
    });

    table.replaceChildren();

    $("orderCount").textContent =
        `${filteredOrders.length} orders found`;

    if (!filteredOrders.length) {
        const row = table.insertRow();
        const cell = row.insertCell();

        cell.colSpan = 8;
        cell.className = "empty-message";
        cell.textContent = "No orders found.";

        return;
    }

    filteredOrders.forEach(order => {
        const row = table.insertRow();

        [
            order.id,
            order.studentName,
            order.type,
            order.paperSize,
            order.copies,
            formatDate(order.createdAt),
            order.status
        ].forEach(value => {
            row.insertCell().textContent = String(value ?? "—");
        });

        const actionCell = row.insertCell();
        const button = document.createElement("button");

        button.type = "button";
        button.textContent = "View";
        button.className = "view-btn";
        button.dataset.orderId = order.id;

        actionCell.appendChild(button);
    });
}

async function loadAdminOrders() {
    try {
        allOrders = await getAllOrders();

        updateSummary();
        displayOrders();

        console.log("Orders loaded:", allOrders);

    } catch (error) {
        console.error("Unable to load orders:", error);

        const table = $("ordersTable");
        table.replaceChildren();

        const row = table.insertRow();
        const cell = row.insertCell();

        cell.colSpan = 8;
        cell.textContent = "Unable to load orders. Check your database.";
    }
}

function showOrderDetails(order) {
    selectedOrder = order;

    $("detailOrderId").textContent = order.id || "—";
    $("detailStudentName").textContent = order.studentName || "—";
    $("detailStudentId").textContent = order.studentId || "—";
    $("detailOrderType").textContent = order.type || "—";
    $("detailPaperSize").textContent = order.paperSize || "—";
    $("detailCopies").textContent = order.copies ?? "—";
    $("detailPrintColor").textContent = order.color || "—";
    $("detailDate").textContent = formatDate(order.createdAt);

    $("detailInstructions").textContent =
        order.instructions || "No additional instructions.";

    const fileLink = $("detailFile");

    if (currentFileURL) {
        URL.revokeObjectURL(currentFileURL);
        currentFileURL = null;
    }

    fileLink.removeAttribute("href");
    fileLink.removeAttribute("download");

    if (order.file instanceof Blob) {
        currentFileURL = URL.createObjectURL(order.file);

        fileLink.href = currentFileURL;
        fileLink.download = order.fileName || "uploaded-file";
        fileLink.textContent = order.fileName || "Download file";
    } else {
        fileLink.textContent = order.fileName || "No file available";
    }

    $("updateStatus").value =
        order.status || "Order Submitted";

    $("modalMessage").textContent = "";

    $("orderModal").style.display = "flex";
    $("orderModal").setAttribute("aria-hidden", "false");
}

function closeModal() {
    $("orderModal").style.display = "none";
    $("orderModal").setAttribute("aria-hidden", "true");

    selectedOrder = null;

    if (currentFileURL) {
        URL.revokeObjectURL(currentFileURL);
        currentFileURL = null;
    }
}

async function saveOrderStatus() {

    if (!selectedOrder) {
        $("modalMessage").textContent = "No order selected.";
        return;
    }

    const newStatus = $("updateStatus").value;
    const updatedOrder = {
        ...selectedOrder,
        status: newStatus
    };

    const saveButton = $("saveStatus");

    saveButton.disabled = true;

    try {
        const db = await openDatabase();

        try {
            await new Promise((resolve, reject) => {
                const transaction = db.transaction("orders", "readwrite");

                transaction.objectStore("orders").put(updatedOrder);

                transaction.oncomplete = resolve;
                transaction.onerror = () => reject(transaction.error);
                transaction.onabort = () => reject(transaction.error);
            });
        } finally {
            db.close();
        }

        selectedOrder = updatedOrder;

        const notificationKey = "lavenderNotifications";

        let notifications = [];

        try {
            notifications = JSON.parse(
                localStorage.getItem(notificationKey) || "[]"
            );

            if (!Array.isArray(notifications)) {
                notifications = [];
            }
        } catch {
            notifications = [];
        }

        notifications.unshift({
            id: Date.now() + Math.random(),
            studentId: updatedOrder.studentId,
            message: `Your order ${updatedOrder.id} status has been updated to ${newStatus}.`,
            is_read: false,
            created_at: new Date().toISOString()
        });

        localStorage.setItem(
            notificationKey,
            JSON.stringify(notifications)
        );

        await loadAdminOrders();

        $("modalMessage").textContent =
            "Order status updated successfully!";

        selectedOrder = allOrders.find(order =>
            String(order.id) === String(updatedOrder.id)
        );

        if (selectedOrder) {
            $("updateStatus").value = selectedOrder.status;
        }

    } catch (error) {
        console.error("Status update failed:", error);

        $("modalMessage").textContent =
            "Unable to update order status.";
    } finally {
        saveButton.disabled = false;
    }
}

document.addEventListener("DOMContentLoaded", () => {

    $("ordersTable").addEventListener("click", event => {
        const button = event.target.closest("[data-order-id]");

        if (!button) return;

        const order = allOrders.find(item =>
            String(item.id) === button.dataset.orderId
        );

        if (order) {
            showOrderDetails(order);
        }
    });

    $("searchOrders").addEventListener("input", displayOrders);
    $("statusFilter").addEventListener("change", displayOrders);
    $("typeFilter").addEventListener("change", displayOrders);

    $("closeModal").addEventListener("click", closeModal);
    $("cancelModal").addEventListener("click", closeModal);
    $("saveStatus").addEventListener("click", saveOrderStatus);

    $("orderModal").addEventListener("click", event => {
        if (event.target === $("orderModal")) {
            closeModal();
        }
    });

    document.addEventListener("keydown", event => {
        if (
            event.key === "Escape" &&
            $("orderModal").getAttribute("aria-hidden") === "false"
        ) {
            closeModal();
        }
    });

    loadAdminOrders();
});
