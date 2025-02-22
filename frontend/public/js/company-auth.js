document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.getElementById("company-register-form");

    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const companyName = document.getElementById("company-name").value;
        const email = document.getElementById("company-email").value;
        const contact = document.getElementById("company-contact").value;
        const password = document.getElementById("company-password").value;
        const confirmPassword = document.getElementById("company-confirm-password").value;

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        const requestData = {
            company_name: companyName,
            email: email,
            contact: contact,
            password: password
        };

        try {
            const response = await fetch("http://localhost:5000/api/company/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestData),
            });

            const data = await response.json();

            if (response.ok) {
                alert("Company registered successfully!");
                window.location.href = "company-login.html"; // Redirect to login page
            } else {
                alert(data.error || "Registration failed!");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Something went wrong. Please try again later.");
        }
    });
});
