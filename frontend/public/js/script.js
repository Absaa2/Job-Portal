document.addEventListener("DOMContentLoaded", () => {
    const currentPage = window.location.pathname;

    // Handle Login Form - Only for login.html
    if (currentPage.includes('/frontend/html/login.html')) {
        const loginForm = document.getElementById('auth-form');

        if (loginForm) {
            console.log("✅ Login form found.");
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value.trim();

                if (!email || !password) {
                    alert("⚠️ Please enter both email and password.");
                    return;
                }

                try {
                    const response = await fetch('http://localhost:5000/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password })
                    });

                    const data = await response.json();

                    if (data.success) {
                        sessionStorage.setItem('sessionToken', data.sessionToken);
                        sessionStorage.setItem('userEmail', email);
                        sessionStorage.setItem('userId', data.userId); // Store userId for applications
                        alert("✅ Login successful!");
                        window.location.href = '../html/job-search.html';  // Redirect to job search page
                    } else {
                        alert("❌ " + (data.message || "Invalid credentials"));
                    }
                } catch (error) {
                    console.error("❌ Error during login:", error);
                    alert("Login failed. Please try again later.");
                }
            });
        } else {
            console.error("❌ Login form not found. Check if ID is correct.");
        }
    }

    // Handle Job Search Form - Only for job-search.html
    if (currentPage.includes('/frontend/html/job-search.html')) {
        const searchBtn = document.getElementById('searchBtn');
        const keywordSearch = document.getElementById('keywordSearch');
        const industryFilter = document.getElementById('industryFilter');
        const locationFilter = document.getElementById('locationFilter');
        const jobList = document.getElementById('jobList');

        function isLoggedIn() {
            return sessionStorage.getItem('sessionToken') !== null;
        }

        function getUserId() {
            return sessionStorage.getItem('userId');
        }

        searchBtn.addEventListener('click', () => {
            const keyword = keywordSearch.value.trim();
            const industry = industryFilter.value;
            const location = locationFilter.value;

            let searchParams = `?keyword=${encodeURIComponent(keyword)}`;
            if (industry) searchParams += `&industry=${encodeURIComponent(industry)}`;
            if (location) searchParams += `&location=${encodeURIComponent(location)}`;

            fetch(`http://localhost:5000/jobs${searchParams}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success && data.jobs) {
                        displayJobResults(data.jobs);
                    } else {
                        jobList.innerHTML = '<li>No jobs found.</li>';
                    }
                })
                .catch(error => {
                    console.error('Error fetching jobs:', error);
                    alert('Failed to fetch jobs. Please try again.');
                });
        });

        function displayJobResults(jobs) {
            jobList.innerHTML = '';

            if (jobs.length === 0) {
                jobList.innerHTML = '<li>No jobs found.</li>';
                return;
            }

            jobs.forEach(job => {
                const jobItem = document.createElement('li');
                jobItem.innerHTML = `
                    <h4>${job.title}</h4>
                    <p>${job.description}</p>
                    <button class="applyBtn" data-job-id="${job.id}">Apply</button>
                `;
                jobList.appendChild(jobItem);
            });

            document.querySelectorAll('.applyBtn').forEach((btn) => {
                btn.addEventListener('click', (event) => {
                    const jobId = event.target.getAttribute('data-job-id');

                    if (!isLoggedIn()) {
                        alert("You must log in first.");
                        window.location.href = "./login.html";
                    } else {
                        window.location.href = `./apply.html?jobId=${jobId}`; // Redirect to apply page
                    }
                });
            });
        }
    }

    // Handle Job Application Form - Only for apply.html
    if (currentPage.includes('/frontend/html/apply.html')) {
        console.log("✅ Apply page loaded");

        // Check if the user is logged in
        const sessionToken = sessionStorage.getItem('sessionToken');
        if (!sessionToken) {
            alert("⚠️ You must be logged in to apply for a job.");
            window.location.href = '../html/login.html';
            return;
        }

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
            const resume = document.getElementById('resume').files[0];

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

            // Validate phone number format
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

            try {
                // Submit form data to the server
                const response = await fetch('http://localhost:5000/apply', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${sessionToken}` },
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    alert("✅ Application submitted successfully!");
                    window.location.href = '../html/job-search.html'; // Redirect to job search
                } else {
                    alert("❌ " + (data.message || "Error submitting application."));
                }
            } catch (error) {
                console.error("❌ Error submitting application:", error);
                alert("⚠️ Error submitting application. Please try again later.");
            }
        });
    }
});
