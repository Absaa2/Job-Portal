document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('auth-form');

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            const confirmPassword = document.getElementById('confirm-password').value.trim();

            if (!name || !email || !password || !confirmPassword) {
                alert('⚠️ All fields are required.');
                return;
            }

            if (password !== confirmPassword) {
                alert('⚠️ Passwords do not match.');
                return;
            }

            const loadingMessage = document.getElementById('loading-message');
            if (loadingMessage) {
                loadingMessage.style.display = 'block';
            }

            try {
                const response = await fetch('http://localhost:5000/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await response.json();

                if (loadingMessage) {
                    loadingMessage.style.display = 'none';
                }

                if (response.ok) {
                    alert("✅ Registration successful! Please log in.");
                    window.location.href = '../html/login.html';
                } else {
                    alert("❌ " + (data.message || "Signup failed"));
                }
            } catch (error) {
                if (loadingMessage) {
                    loadingMessage.style.display = 'none';
                }
                console.error("❌ Error during signup:", error);
                alert("Signup failed. Please try again later.");
            }
        });
    } else {
        console.error("❌ Signup form not found.");
    }
});
