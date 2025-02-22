document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("company-login-form");

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("company-email").value;
        const password = document.getElementById("company-password").value;

        const requestData = {
            email: email,
            password: password
        };

        try {
            const response = await fetch("http://localhost:5000/api/company/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestData),
            });

            const data = await response.json();

            if (response.ok) {
                alert("Login successful!");

                // Store company authentication data
                localStorage.setItem("companyToken", data.token);  // Store token (if applicable)
                localStorage.setItem("companyId", data.companyId); // Store company ID
                
                // Redirect to company post job page
                window.location.href = "company-post-job.html"; 
            } else {
                alert(data.error || "Invalid email or password!");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Something went wrong. Please try again later.");
        }
    });

    // 🔹 Ensure authentication on job posting page
    if (window.location.pathname.includes("company-post-job.html")) {
        const companyId = localStorage.getItem("companyId");

        if (!companyId) {
            alert("You must be logged in as a company to access this page.");
            window.location.href = "company-login.html"; // Redirect to login page
        }
    }
});
