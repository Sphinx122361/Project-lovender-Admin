
const DB_NAME = "ProjectLavenderDB";
const DB_VERSION = 1;

let allOrders = [];
let selectedOrder = null;

const $ = id => document.getElementById(id);

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onsuccess = () => {
            const db = request.result;

            if (!db.objectStoreNames.contains("orders")) {
                db.close();
                reject(new Error("The orders database store does not exist."));
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

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);

        transaction.oncomplete = () => db.close();
        transaction.onerror = () => db.close();
    });
}

function formatDate(date) {
    if (!date) return "—";

    const result = new Date(date);

    return Number.isNaN(result.getTime())
        ? "—"
        : result.toLocaleString();
}

function updateSummary() {
    $("totalOrders").textContent = allOrders.length;

    $("submittedOrders").textContent =
        allOrders.filter(o => o.status === "Order Submitted").length;

    $("processingOrders").textContent =
        allOrders.filter(o => o.status === "Processing").length;

    $("readyOrders").textContent =
        allOrders.filter(o => o.status === "Ready for Pickup").length;

    $("completedOrders").textContent =
        allOrders.filter(o => o.status === "Completed").length;
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

        return matchesSearch &&
            (!status || order.status === status) &&
            (!type || order.type === type);
    });

    table.replaceChildren();

    $("orderCount").textContent =
        `${filteredOrders.length} orders found`;

    if (!filteredOrders.length) {
        const row = table.insertRow();
        const cell = row.insertCell();

        cell.colSpan = 8;
        cell.textContent = "No orders available.";

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
        button.dataset.orderId = order.id;
        button.className = "view-btn";

        actionCell.appendChild(button);
    });
}

async function loadAdminOrders() {
    try {
        allOrders = await getAllOrders();

        console.log("Orders retrieved:", allOrders);

        updateSummary();
        displayOrders();

    } catch (error) {
        console.error("Unable to load orders:", error);

        $("ordersTable").innerHTML =
            '<tr><td colspan="8">Unable to load orders. Check Console.</td></tr>';
    }
}

async function saveOrderStatus() {
    if (!selectedOrder) {
        $("modalMessage").textContent = "No order selected.";
        return;
    }

    const newStatus = $("updateStatus").value;
    const orderId = selectedOrder.id;

    try {
        const db = await openDatabase();

        await new Promise((resolve, reject) => {
            const transaction = db.transaction("orders", "readwrite");

            transaction.objectStore("orders").put({
                ...selectedOrder,
                status: newStatus
            });

            transaction.oncomplete = resolve;
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error);
        });

        db.close();

        const notifications = JSON.parse(
            localStorage.getItem("lavenderNotifications") || "[]"
        );

        notifications.unshift({
            id: Date.now() + Math.random(),
            studentId: selectedOrder.studentId,
            message: `Your order ${orderId} status has been updated to ${newStatus}.`,
            is_read: false,
            created_at: new Date().toISOString()
        });

        localStorage.setItem(
            "lavenderNotifications",
            JSON.stringify(notifications)
        );

        $("modalMessage").textContent =
            "Order status updated successfully!";

        await loadAdminOrders();

        selectedOrder = allOrders.find(order =>
            String(order.id) === String(orderId)
        );

        if (selectedOrder) {
            $("updateStatus").value = selectedOrder.status;
        }

    } catch (error) {
        console.error("Status update failed:", error);

        $("modalMessage").textContent =
            "Unable to update order status.";
    }
}

document.addEventListener("DOMContentLoaded", () => {

    $("ordersTable").addEventListener("click", event => {
        const button = event.target.closest("[data-order-id]");

        if (!button) return;

        const order = allOrders.find(item =>
            String(item.id) === button.dataset.orderId
        );

        if (!order) return;

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

        if (order.file instanceof Blob) {
            const fileURL = URL.createObjectURL(order.file);

            fileLink.href = fileURL;
            fileLink.download = order.fileName || "uploaded-file";
            fileLink.textContent = order.fileName || "Download file";
        } else {
            fileLink.removeAttribute("href");
            fileLink.textContent = order.fileName || "No file available";
        }

        $("updateStatus").value = order.status || "Order Submitted";

        $("modalMessage").textContent = "";

        $("orderModal").style.display = "flex";
        $("orderModal").setAttribute("aria-hidden", "false");
    });

    $("searchOrders").addEventListener("input", displayOrders);
    $("statusFilter").addEventListener("change", displayOrders);
    $("typeFilter").addEventListener("change", displayOrders);

    function closeModal() {
        $("orderModal").style.display = "none";
        $("orderModal").setAttribute("aria-hidden", "true");
    }

    $("closeModal").addEventListener("click", closeModal);
    $("cancelModal").addEventListener("click", closeModal);

    $("saveStatus").addEventListener("click", saveOrderStatus);

    $("orderModal").addEventListener("click", event => {
        if (event.target === $("orderModal")) {
            closeModal();
        }
    });

    loadAdminOrders();
});
