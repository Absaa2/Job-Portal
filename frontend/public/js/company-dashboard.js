document.addEventListener("DOMContentLoaded", () => {
    const jobList = document.getElementById("jobList");
    const createJobBtn = document.getElementById("createJobBtn");
    const editJobForm = document.getElementById("editJobForm");
    const cancelEditBtn = document.getElementById("cancelEditBtn");
    const editJobFormDetails = document.getElementById("editJobFormDetails");

    const companyId = localStorage.getItem("companyId");

    // Redirect if companyId is not found
    if (!companyId) {
        alert("You must be logged in as a company to view this page.");
        window.location.href = "//frontend/html/company-dashboard.html"; // Redirect to login if not logged in
    }

    // Fetch and display posted jobs
    fetchJobs(companyId);

    // Fetch jobs from the backend
    function fetchJobs(companyId) {
        fetch(`http://localhost:5000/company/jobs?companyId=${companyId}`)
            .then((response) => response.json())
            .then((data) => {
                if (data.jobs && data.jobs.length > 0) {
                    displayJobs(data.jobs);
                } else {
                    jobList.innerHTML = "<tr><td colspan='6'>No jobs posted.</td></tr>";
                }
            })
            .catch((error) => {
                console.error("Error fetching jobs:", error);
                alert("Failed to load your jobs. Please try again.");
            });
    }

    // Display jobs in the table
    function displayJobs(jobs) {
        jobList.innerHTML = ""; // Clear previous jobs

        jobs.forEach((job) => {
            const jobRow = document.createElement("tr");
            jobRow.innerHTML = `
                <td>${job.title}</td>
                <td>${job.industry}</td>
                <td>${job.description}</td>  <!-- Fixed spelling -->
                <td>${job.location}</td>
                <td>${job.salary}</td>
                <td>
                    <button class="editBtn" data-job-id="${job.id}">Edit</button>
                    <button class="deleteBtn" data-job-id="${job.id}">Delete</button>
                </td>
            `;
            jobList.appendChild(jobRow);
        });

        // Attach event listeners for edit and delete buttons
        document.querySelectorAll(".editBtn").forEach((button) => {
            button.addEventListener("click", handleEdit);
        });

        document.querySelectorAll(".deleteBtn").forEach((button) => {
            button.addEventListener("click", handleDelete);
        });
    }

    // Handle Edit Job
    function handleEdit(event) {
        const jobId = event.target.getAttribute("data-job-id");
        const jobRow = event.target.closest("tr");
        
        const title = jobRow.querySelector("td:nth-child(1)").textContent;
        const industry = jobRow.querySelector("td:nth-child(2)").textContent;
        const description = jobRow.querySelector("td:nth-child(3)").textContent; // FIXED ID
        const location = jobRow.querySelector("td:nth-child(4)").textContent;
        const salary = jobRow.querySelector("td:nth-child(5)").textContent;
    

        // Set form values
    document.getElementById("editJobId").value = jobId;
    document.getElementById("editJobTitle").value = title;
    document.getElementById("editJobIndustry").value = industry;
    document.getElementById("editJobDescription").value = description; // FIXED ID
    document.getElementById("editJobLocation").value = location;
    document.getElementById("editJobSalary").value = salary;

    // Show edit form
    editJobForm.style.display = "block";
    }

    // Handle Cancel Edit
    cancelEditBtn.addEventListener("click", () => {
        editJobForm.style.display = "none"; // Hide the form when canceled
    });

    // Handle Save Job Edit
    editJobFormDetails.addEventListener("submit", (event) => {
        event.preventDefault();

        const jobId = document.getElementById("editJobId").value;
        const title = document.getElementById("editJobTitle").value;
        const industry = document.getElementById("editJobIndustry").value;
        const description = document.getElementById("editJobDescription").value;
        const location = document.getElementById("editJobLocation").value;
        const salary = document.getElementById("editJobSalary").value;

        // Prepare request data
        const requestData = {
            title,
            industry,
            description, // Fixed spelling
            location,
            salary,
            company_id: companyId, // Changed from "companyId" to "company_id" to match backend
        };

        // Make the request to update the job
        fetch(`http://localhost:5000/company/job/${jobId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestData),
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                alert("Job updated successfully!");
                editJobForm.style.display = "none"; // Hide the form
                fetchJobs(companyId); // Reload the jobs
            } else {
                alert(data.error || "Failed to update the job.");
            }
        })
        .catch((error) => {
            console.error("Error updating job:", error);
            alert("Failed to update the job. Please try again.");
        });
    });

    // Handle Delete Job
    function handleDelete(event) {
        const jobId = event.target.getAttribute("data-job-id");

        const confirmation = confirm("Are you sure you want to delete this job?");
        if (confirmation) {
            deleteJob(jobId);
        }
    }

    // Delete job via API
    function deleteJob(jobId) {
        fetch(`http://localhost:5000/company/job/${jobId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                company_id: companyId, // Changed from "companyId" to "company_id"
            }),
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                alert(data.message);
                fetchJobs(companyId); // Reload the jobs
            } else {
                alert(data.error || "Failed to delete the job.");
            }
        })
        .catch((error) => {
            console.error("Error deleting job:", error);
            alert("Failed to delete the job. Please try again.");
        });
    }

    // Create New Job button
    createJobBtn.addEventListener("click", () => {
        window.location.href = "//frontend/html/company-post-job.html"; // Redirect to job posting page
    });
});
