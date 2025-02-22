document.addEventListener("DOMContentLoaded", () => {
    const editJobForm = document.getElementById("edit-job-form");
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get("jobId"); // Get the jobId from the URL

    if (!jobId) {
        alert("Job ID is missing.");
        window.location.href = "company-dashboard.html"; // Redirect to dashboard if jobId is missing
    }

    // Fetch job details to populate the form
    fetchJobDetails(jobId);

    function fetchJobDetails(jobId) {
        fetch(`http://localhost:5000/company/job/${jobId}`)
            .then((response) => response.json())
            .then((data) => {
                if (data.job) {
                    populateForm(data.job);
                } else {
                    alert("Job not found.");
                    window.location.href = "company-dashboard.html"; // Redirect if the job is not found
                }
            })
            .catch((error) => {
                console.error("Error fetching job details:", error);
                alert("Failed to load job details. Please try again.");
            });
    }

    function populateForm(job) {
        // Fill the form with the current job data
        document.getElementById("job-title").value = job.title;
        document.getElementById("job-industry").value = job.industry;
        document.getElementById("job-location").value = job.location;
        document.getElementById("job-description").value = job.description;
        document.getElementById("job-salary").value = job.salary;
    }

    // Handle form submission to update job
    editJobForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const title = document.getElementById("job-title").value;
        const industry = document.getElementById("job-industry").value;
        const location = document.getElementById("job-location").value;
        const description = document.getElementById("job-description").value;
        const salary = document.getElementById("job-salary").value;
        const companyId = localStorage.getItem("companyId");

        if (!companyId) {
            alert("You must be logged in as a company to edit this job.");
            window.location.href = "company-login.html"; // Redirect to login if not logged in
            return;
        }

        // Validate fields
        if (!title || !industry || !location || !description || !salary) {
            alert("All fields are required.");
            return;
        }

        const updatedJob = {
            title,
            industry,
            location,
            description,
            salary: parseInt(salary),
            company_id: parseInt(companyId), // Include companyId for authorization
        };

        updateJob(jobId, updatedJob);
    });

    function updateJob(jobId, updatedJob) {
        fetch(`http://localhost:5000/company/job/${jobId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedJob),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    alert("Job updated successfully!");
                    window.location.href = "company-dashboard.html"; // Redirect to dashboard after update
                } else {
                    alert(data.error || "Failed to update the job.");
                }
            })
            .catch((error) => {
                console.error("Error updating job:", error);
                alert("Failed to update the job. Please try again.");
            });
    }
});
