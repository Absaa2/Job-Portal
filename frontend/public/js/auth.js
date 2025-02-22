document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ auth.js loaded successfully");

    // Check if the current page is login.html
    if (window.location.pathname.includes('login.html')) {
        const loginForm = document.getElementById('auth-form');

        // Check if the login form exists
        if (loginForm) {
            // Add event listener for form submission
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                // Get the email and password values from the form
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value.trim();

                // Validate if both fields are filled
                if (!email || !password) {
                    alert("⚠️ Please enter both email and password.");
                    return;
                }

                try {
                    // Send login request to the server
                    const response = await fetch('http://localhost:5000/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password })
                    });

                    // Parse the response from the server
                    const data = await response.json();
                    console.log("🔄 Login Response:", data);

                    // If login is successful and session token is returned
                    if (data.success && data.sessionToken) {
                        console.log("✅ Storing session token...");

                        // Store the session token, user email, and userId in sessionStorage
                        sessionStorage.setItem('sessionToken', data.sessionToken);
                        sessionStorage.setItem('userEmail', email);
                        sessionStorage.setItem('userId', data.userId); // Ensure userId is stored

                        alert("✅ Login successful!");

                        // Redirect to the job search page
                        window.location.href = '../html/job-search.html';
                    } else {
                        // If login failed, show the error message
                        alert("❌ " + (data.message || "Invalid credentials"));
                    }
                } catch (error) {
                    // Handle any errors that occur during the login process
                    console.error("❌ Error during login:", error);
                    alert("Login failed. Please try again later.");
                }
            });
        }
    }

    // Check if the current page is job-search.html (or any other protected page)
    if (window.location.pathname.includes('job-search.html')) {
        // Check if the user is logged in by verifying sessionStorage
        const sessionToken = sessionStorage.getItem('sessionToken');
        const userEmail = sessionStorage.getItem('userEmail');
        const userId = sessionStorage.getItem('userId'); // Make sure userId is also checked

        // If the sessionToken, userEmail, or userId is missing, redirect to login page
        if (!sessionToken || !userEmail || !userId) {
            alert("⚠️ You must be logged in to access this page.");
            window.location.href = '../html/login.html';
        }
    }

    // Handle logout for any page
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            // Remove session data upon logout
            sessionStorage.removeItem('sessionToken');
            sessionStorage.removeItem('userEmail');
            sessionStorage.removeItem('userId'); // Ensure userId is also removed from sessionStorage
            alert("✅ Logged out successfully!");

            // Redirect to the login page
            window.location.href = '../html/login.html';
        });
    }
});
