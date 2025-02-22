document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ Apply page loaded");

    // Check if the user is logged in using sessionToken
    const sessionToken = sessionStorage.getItem('sessionToken');

    if (!sessionToken) {
        alert("⚠️ You must be logged in to apply for a job.");
        window.location.href = '../html/login.html';
        return;
    }

    // Retrieve job ID from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('jobId'); // Get jobId from URL

    // Handle form submission
    const applyForm = document.getElementById('apply-form');
    applyForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Collect form data
        const fullname = document.getElementById('fullname').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const address = document.getElementById('address').value.trim();
        const coverLetter = document.getElementById('cover-letter').value.trim();
        const school = document.getElementById('school').value.trim();
        const degree = document.getElementById('degree').value.trim();
        const graduationYear = document.getElementById('graduation-year').value.trim();
        const company = document.getElementById('company').value.trim();
        const position = document.getElementById('position').value.trim();
        const duration = document.getElementById('duration').value.trim();
        const resume = document.getElementById('resume').files[0]; // Resume file

        // Validate required fields
        if (!fullname || !email || !phone || !address || !coverLetter || !school || !degree || !graduationYear || !company || !position || !duration || !resume) {
            alert("⚠️ All fields are required!");
            return;
        }

        // Validate email format
        const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!emailPattern.test(email)) {
            alert("⚠️ Please enter a valid email address.");
            return;
        }

        // Validate phone number format (10 digits)
        const phonePattern = /^[0-9]{10}$/;
        if (!phonePattern.test(phone)) {
            alert("⚠️ Please enter a valid 10-digit phone number.");
            return;
        }

        // Prepare form data for submission
        const formData = new FormData();
        formData.append('fullname', fullname);
        formData.append('email', email);
        formData.append('phone', phone);
        formData.append('address', address);
        formData.append('school', school);
        formData.append('degree', degree);
        formData.append('graduationYear', graduationYear);
        formData.append('company', company);
        formData.append('position', position);
        formData.append('duration', duration);
        formData.append('coverLetter', coverLetter);
        formData.append('resume', resume); // File attachment
        formData.append('jobId', jobId);  // Add jobId

        try {
            // Submit the form data to the server
            const response = await fetch('http://localhost:5000/apply', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${sessionToken}` // Send sessionToken for authentication
                },
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                alert("✅ Application submitted successfully!");
                window.location.href = '../html/job-search.html'; // Redirect to job search page
            } else {
                alert("❌ " + (data.message || "Error submitting application."));
            }
        } catch (error) {
            console.error("❌ Error submitting application:", error);
            alert("⚠️ Error submitting application. Please try again later.");
        }
    });
});
