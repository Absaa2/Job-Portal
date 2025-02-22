document.addEventListener("DOMContentLoaded", () => {
    let allData = {}; // Store all fetched data
    fetchAllData();

    // Function to fetch data from the server
    async function fetchAllData() {
        try {
            const response = await fetch("http://localhost:5000/admin/data");
            allData = await response.json();
            createTableTabs(allData); // Once data is fetched, create tabs
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

    // Function to display the table data
    function displayTable(table, records) {
        const container = document.getElementById("tableContainer");
        container.innerHTML = ""; // Clear existing table

        const tableElement = generateTableHTML(table, records); // Generate table HTML
        container.appendChild(tableElement);

        // Set the active tab
        const tabs = document.querySelectorAll(".tabButton");
        tabs.forEach((tab) => tab.classList.remove("active"));
        const activeTab = Array.from(tabs).find(
            (tab) => tab.textContent === table.toUpperCase()
        );
        if (activeTab) activeTab.classList.add("active");
    }

    // Function to create table tabs dynamically
    function createTableTabs(data) {
        const tabsContainer = document.getElementById("tableTabs");
        tabsContainer.innerHTML = ""; // Clear existing tabs

        for (const table of Object.keys(data)) {
            const tabButton = document.createElement("button");
            tabButton.className = "tabButton";
            tabButton.textContent = table.toUpperCase();
            tabButton.onclick = () => displayTable(table, data[table]); // Bind the displayTable function to the tab button click
            tabsContainer.appendChild(tabButton);
        }

        // Display the first table by default if available
        if (Object.keys(data).length > 0) {
            const firstTable = Object.keys(data)[0];
            displayTable(firstTable, data[firstTable]);
            tabsContainer.children[0].classList.add("active");
        }
    }

    // Function to generate table HTML dynamically based on records
    function generateTableHTML(table, records) {
        if (records.length === 0) return document.createTextNode("No records found.");

        const tableElement = document.createElement("table");
        tableElement.border = "1";

        const thead = tableElement.createTHead();
        const tbody = tableElement.createTBody();
        const headerRow = thead.insertRow();

        // Create table headers from record keys
        Object.keys(records[0]).forEach((col) => {
            const th = document.createElement("th");
            th.textContent = col;
            headerRow.appendChild(th);
        });

        // Add "Actions" column for all tables
        const actionTh = document.createElement("th");
        actionTh.textContent = "Actions";
        headerRow.appendChild(actionTh);

        // Add rows to the table for each record
        records.forEach((record) => {
            const row = tbody.insertRow();

            Object.values(record).forEach((value) => {
                const cell = row.insertCell();
                cell.textContent = value;
            });

            const actionCell = row.insertCell();

            // Add specific buttons for the "applications" table
            if (table === "applications") {
                const approveBtn = document.createElement("button");
                approveBtn.className = "approveBtn";
                approveBtn.textContent = "Approve";
                approveBtn.onclick = () => updateRecordStatus(table, record.id, "approved");
                actionCell.appendChild(approveBtn);

                const rejectBtn = document.createElement("button");
                rejectBtn.className = "rejectBtn";
                rejectBtn.textContent = "Reject";
                rejectBtn.onclick = () => updateRecordStatus(table, record.id, "rejected");
                actionCell.appendChild(rejectBtn);

                if (record.resume_url) {
                    const viewResumeBtn = document.createElement("button");
                    viewResumeBtn.className = "viewResumeBtn";
                    viewResumeBtn.textContent = "View Resume";
                    viewResumeBtn.onclick = () => window.open(record.resume_url, "_blank");
                    actionCell.appendChild(viewResumeBtn);
                }
            }

            // Always add a Delete button
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "deleteBtn";
            deleteBtn.textContent = "Delete";
            deleteBtn.onclick = () => deleteRecord(table, record.id);
            actionCell.appendChild(deleteBtn);
        });

        return tableElement;
    }

    // Function to update the status of a record (e.g., approve or reject)
    async function updateRecordStatus(table, id, status) {
        try {
            const response = await fetch(`http://localhost:5000/admin/update/${table}/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });

            const data = await response.json();
            if (data.success) {
                alert(`Record ${status} successfully!`);
                fetchAllData(); // Refresh data after updating status
            }
        } catch (error) {
            console.error("Error updating record status:", error);
        }
    }

    // Function to delete a record
    async function deleteRecord(table, id) {
        if (!confirm("Are you sure you want to delete this record?")) return;

        try {
            const response = await fetch(`http://localhost:5000/admin/delete/${table}/${id}`, {
                method: "DELETE",
            });
            const data = await response.json();
            if (data.success) {
                alert("Record deleted successfully!");
                fetchAllData(); // Refresh data after deletion
            }
        } catch (error) {
            console.error("Error deleting record:", error);
        }
    }
});
