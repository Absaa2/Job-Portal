document.addEventListener("DOMContentLoaded", function () {
    const jobForm = document.getElementById("post-job-form");

    jobForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        // Get form values
        const title = document.getElementById("job-title").value;
        const industry = document.getElementById("job-industry").value;
        const description = document.getElementById("job-description").value;
        const location = document.getElementById("job-location").value;
        const salary = document.getElementById("job-salary").value;

        // Retrieve companyId from localStorage
        const companyId = localStorage.getItem("companyId");

        // Check if company_id is retrieved from localStorage
        console.log("Company ID from localStorage:", companyId); // Debugging log

        // Check if the company is logged in
        if (!companyId) {
            alert("You must be logged in to post a job.");
            return;
        }

        // Validate that all required fields are filled
        if (!title || !industry || !description || !location || !salary) {
            alert("All fields are required.");
            return;
        }

        // Validate that salary is a valid number
        if (isNaN(salary) || salary <= 0) {
            alert("Please enter a valid salary.");
            return;
        }

        // Prepare request data to send to the backend
        const requestData = {
            title: title,
            industry: industry,
            description: description,
            location: location,
            salary: parseInt(salary),
            company_id: parseInt(companyId)  // Include company_id in the request
        };

        console.log("Request Data:", requestData); // Debugging log

        try {
            const response = await fetch("http://localhost:5000/api/company/post-job", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestData),
            });

            const data = await response.json();

            if (response.ok) {
                alert("Job posted successfully!");
                jobForm.reset();
            } else {
                alert(data.error || "Failed to post job.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Something went wrong. Please try again later.");
        }
    });
});
