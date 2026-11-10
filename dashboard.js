
(() => {

    const DB_NAME = "ProjectLavenderDB";
    const DB_VERSION = 2;

    const $ = id => document.getElementById(id);

    const menuToggle = $("menuToggle");
    const sidebar = $("sidebar");
    const logoutBtn = $("logoutBtn");

    function initializeNavigation() {

        if (menuToggle && sidebar) {
            menuToggle.addEventListener("click", () => {
                const isOpen = sidebar.classList.toggle("show");

                menuToggle.setAttribute("aria-expanded", isOpen);
            });

            sidebar.querySelectorAll(".nav-link").forEach(link => {
                link.addEventListener("click", () => {
                    sidebar.classList.remove("show");
                    menuToggle.setAttribute("aria-expanded", "false");
                });
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener("click", event => {
                event.preventDefault();

                if (confirm("Are you sure you want to log out?")) {
                    window.location.href = "admin_login.html";
                }
            });
        }
    }

    function openAdminDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onsuccess = () => {
                const db = request.result;

                if (!db.objectStoreNames.contains("orders")) {
                    db.close();
                    reject(new Error("Orders store not found."));
                    return;
                }

                resolve(db);
            };

            request.onerror = () => reject(request.error);
        });
    }

    async function fetchAdminOrders() {
        const db = await openAdminDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction("orders", "readonly");
            const request = transaction.objectStore("orders").getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);

            transaction.oncomplete = () => db.close();
            transaction.onabort = () => db.close();
            transaction.onerror = () => db.close();
        });
    }

    function updateDashboardStats(orders) {

        const counts = {
            totalOrders: orders.length,
            submittedOrders: 0,
            processingOrders: 0,
            completedOrders: 0
        };

        orders.forEach(order => {
            if (order.status === "Order Submitted") {
                counts.submittedOrders++;
            } else if (order.status === "Processing") {
                counts.processingOrders++;
            } else if (order.status === "Completed") {
                counts.completedOrders++;
            }
        });

        Object.entries(counts).forEach(([id, count]) => {
            const element = $(id);

            if (element) {
                element.textContent = count;
            }
        });
    }

    function displayRecentOrders(orders) {
        const table = $("recentOrders");

        if (!table) return;

        table.replaceChildren();

        const recentOrders = [...orders]
            .sort((a, b) =>
                new Date(b.createdAt || 0) -
                new Date(a.createdAt || 0)
            )
            .slice(0, 5);

        if (!recentOrders.length) {
            const row = table.insertRow();
            const cell = row.insertCell();

            cell.colSpan = 6;
            cell.className = "empty-message";
            cell.textContent = "No orders available.";

            return;
        }

        recentOrders.forEach(order => {
            const row = table.insertRow();

            [
                order.id,
                order.studentName,
                order.type,
                order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString()
                    : "—",
                order.status
            ].forEach(value => {
                row.insertCell().textContent = String(value ?? "—");
            });

            const actionCell = row.insertCell();
            const button = document.createElement("a");

            button.href = "admin_order.html";
            button.className = "view-btn";
            button.textContent = "Manage";

            actionCell.appendChild(button);
        });
    }

    async function loadDashboard() {

        if (!$("recentOrders") && !$("totalOrders")) return;

        try {
            const orders = await fetchAdminOrders();

            updateDashboardStats(orders);
            displayRecentOrders(orders);

        } catch (error) {
            console.error("Dashboard loading error:", error);

            const table = $("recentOrders");

            if (table) {
                table.replaceChildren();

                const row = table.insertRow();
                const cell = row.insertCell();

                cell.colSpan = 6;
                cell.textContent = "Unable to load orders.";
            }
        }
    }

    initializeNavigation();

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", loadDashboard);
    } else {
        loadDashboard();
    }

})();
