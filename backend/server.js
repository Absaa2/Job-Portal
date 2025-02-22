const express = require('express');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
const cors = require('cors');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


const notifications = require('../frontend/public/js/notifications');
const router = express.Router(); 

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cors());

// MySQL connection pool
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'abisha@2',
    database: 'job_portal',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


const { Sequelize, DataTypes } = require('sequelize');

// Initialize Sequelize
const sequelize = new Sequelize('job_portal', 'root', 'abisha@2', {
  host: 'localhost',
  dialect: 'mysql', // Using MySQL as your database
  logging: false, // Set to true for debug purposes
});

try {
  // Test the connection
  sequelize.authenticate();
  console.log('✅ Connected to MySQL Database');
} catch (error) {
  console.error('Database connection failed:', error);
}

module.exports = { sequelize, DataTypes };  // Export the sequelize instance and DataTypes

// models/Application.js


const Application = sequelize.define('Application', {
  // Define model attributes
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // Add any other necessary columns here
});

// Synchronize models with the database
sequelize.sync()
  .then(() => console.log('Models synchronized with the database.'))
  .catch((err) => console.error('Error syncing models:', err));

module.exports = Application;


// Attach the router to the express app

app.use('/api', router);  // Attach the router to the /api base path

// 🚀 Company Registration Route
app.post("/api/company/register", async (req, res) => {
  try {
    const { company_name, email, contact, password } = req.body;

    // 🛑 Check if all fields are provided
    if (!company_name || !email || !contact || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // 🔐 Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🛢 Save company data to MySQL
    const sql = "INSERT INTO company_accounts (company_name, email, contact, password) VALUES (?, ?, ?, ?)";
    db.query(sql, [company_name, email, contact, hashedPassword], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.status(201).json({ message: "Company registered successfully", companyId: result.insertId });
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/company/login", async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // 🛢 Query to find company by email
      const sql = "SELECT * FROM company_accounts WHERE email = ?";
      db.query(sql, [email], async (err, results) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: "Database error" });
        }
  
        // 🛑 No company found
        if (results.length === 0) {
          console.log("No company found with this email.");
          return res.status(401).json({ error: "Invalid email or password" });
        }
  
        const company = results[0];
        console.log("Company Found:", company);
  
        // 🔐 Check password
        const isMatch = await bcrypt.compare(password, company.password);
        console.log("Password Match:", isMatch);
  
        if (!isMatch) {
          return res.status(401).json({ error: "Invalid email or password" });
        }
  
        // ✅ Insert login record into company_logins table
        const loginSql = "INSERT INTO company_logins (company_id, login_time) VALUES (?, NOW())";
        db.query(loginSql, [company.id], (loginErr, loginResult) => {
          if (loginErr) {
            console.error("Error logging login:", loginErr);
          }
        });
  
        // 🎉 Success response
        res.status(200).json({
          message: "Login successful",
          companyId: company.id
        });
      });
  
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
// API Endpoint to Post a Job
app.post("/api/company/post-job", (req, res) => {
    console.log("Received job post data:", req.body); // Log the incoming data
    const { title, industry, description, location, salary, company_id } = req.body;

    if (!company_id) {
        return res.status(400).json({ error: "Company ID is missing in the request." });
    }

    const sql = "INSERT INTO jobs (title, industry, location, description, salary, company_id) VALUES (?, ?, ?, ?, ?, ?)";
    const values = [title, industry, location, description, salary, company_id];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.status(201).json({ message: "Job posted successfully", jobId: result.insertId });
    });
});

app.get("/company/jobs", (req, res) => {
    const companyId = req.query.companyId;

    if (!companyId) {
        return res.status(400).json({ error: "Company ID is required." });
    }

    const sql = "SELECT * FROM jobs WHERE company_id = ?";
    db.query(sql, [companyId], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.status(200).json({ jobs: result });
    });
});
app.delete("/company/job/:jobId", (req, res) => {
    const jobId = req.params.jobId;
    const { companyId } = req.body;

    if (!companyId) {
        return res.status(400).json({ error: "Company ID is required for authorization." });
    }

    const sql = "DELETE FROM jobs WHERE id = ? AND company_id = ?";
    db.query(sql, [jobId, companyId], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (result.affectedRows > 0) {
            res.status(200).json({ success: true, message: "Job deleted successfully" });
        } else {
            res.status(400).json({ error: "Job not found or unauthorized action" });
        }
    });
});
// Update job
app.put("/company/job/:jobId", (req, res) => {
    const jobId = req.params.jobId;
    const { title, industry, location, description, salary, company_id } = req.body;

    if (!title || !industry || !location || !description || !salary || !company_id) {
        return res.status(400).json({ error: "All fields are required." });
    }

    // Ensure the job belongs to the company
    const sqlCheckJob = "SELECT * FROM jobs WHERE id = ? AND company_id = ?";
    db.query(sqlCheckJob, [jobId, company_id], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: "Job not found or unauthorized." });
        }

        // Update the job
        const sqlUpdateJob = `
            UPDATE jobs 
            SET title = ?, industry = ?, location = ?, description = ?, salary = ?
            WHERE id = ? AND company_id = ?
        `;
        db.query(sqlUpdateJob, [title, industry, location, description, salary, jobId, company_id], (err, result) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Failed to update job." });
            }
            res.status(200).json({ success: true, message: "Job updated successfully." });
        });
    });
});





// Endpoint to retrieve jobs
app.get("/jobs", (req, res) => {
    const { keyword, industry, location } = req.query;

    // Build SQL query based on filters
    let sql = "SELECT * FROM jobs WHERE 1=1"; // Start with all jobs
    const params = [];

    if (keyword) {
        sql += " AND title LIKE ?";
        params.push(`%${keyword}%`);
    }

    if (industry) {
        sql += " AND industry = ?";
        params.push(industry);
    }

    if (location) {
        sql += " AND location = ?";
        params.push(location);
    }

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Failed to fetch jobs" });
        }

        res.json({
            success: true,
            jobs: result,
        });
    });
});
// Endpoint to get all jobs posted by a company
app.get("/company/jobs", (req, res) => {
    const companyId = req.query.companyId;

    if (!companyId) {
        return res.status(400).json({ error: "Company ID is required" });
    }

    const sql = "SELECT * FROM jobs WHERE company_id = ?";
    db.query(sql, [companyId], (err, result) => {
        if (err) {
            console.error("Error fetching jobs:", err);
            return res.status(500).json({ error: "Failed to fetch jobs" });
        }

        res.json({ jobs: result });
    });
});


// Endpoint to delete a job
app.delete("/company/job/:jobId", (req, res) => {
    const jobId = req.params.jobId;
    const companyId = req.body.companyId;  // We assume companyId is passed in the request body

    const sql = "DELETE FROM jobs WHERE id = ? AND company_id = ?";
    db.query(sql, [jobId, companyId], (err, result) => {
        if (err) {
            console.error("Error deleting job:", err);
            return res.status(500).json({ error: "Failed to delete job" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Job not found or not authorized" });
        }

        res.json({ success: true, message: "Job deleted successfully" });
    });
});

// Endpoint to edit a job
app.put("/company/job/:jobId", (req, res) => {
    const jobId = req.params.jobId;
    const { title, industry, description, location, salary, companyId } = req.body;

    // Ensure all fields are provided
    if (!title || !industry || !description || !location || !salary ) {
        return res.status(400).json({ error: "All fields are required." });
    }

    const sql = `
        UPDATE jobs 
        SET title = ?, industry = ?, description = ?, location = ?, salary = ?
        WHERE id = ? AND company_id = ?
    `;

    db.query(sql, [title, industry, description, location, salary], (err, result) => {
        if (err) {
            console.error("Error updating job:", err);
            return res.status(500).json({ error: "Failed to update job." });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Job not found or not authorized." });
        }

        res.json({ success: true, message: "Job updated successfully." });
    });
});


// ✅ API to Fetch Jobs from MySQL
app.get("/jobs", (req, res) => {
    const sql = "SELECT * FROM jobs";  // Fetch all jobs from database
    db.query(sql, (err, result) => {
        if (err) {
            console.error("❌ Error fetching jobs:", err);
            res.status(500).json({ success: false, message: "Database error" });
            return;
        }
        res.json({ success: true, jobs: result });
    });
});
 // Ensure path is required
 // Import fs module to manage files

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = '/uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname); // Get the correct extension
        cb(null, uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /pdf|doc|docx/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only .pdf, .doc, and .docx files are allowed!'));
    }
});

// Serve static files and ensure PDFs open in the browser
app.use('//backend/uploads', express.static(path.join(__dirname, './uploads'), {
    setHeaders: (res, filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        if (ext === '.pdf') {
            res.setHeader('Content-Type', 'application/pdf');
        } else if (ext === '.docx') {
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        } else if (ext === '.doc') {
            res.setHeader('Content-Type', 'application/msword');
        }
    }
}));

// Upload route (For job applications)
app.post('/upload', upload.single('resume'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'File upload failed' });
    }

    res.json({
        success: true,
        message: 'File uploaded successfully',
        filePath: `./uploads/${req.file.filename}`
    });
});


// Middleware to verify session token for normal users
function verifySessionToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ success: false, message: '⚠️ No authorization header found' });
    }

    const sessionToken = authHeader.split(' ')[1];
    console.log("🔍 Verifying Session Token:", sessionToken);

    if (!sessionToken) {
        return res.status(401).json({ success: false, message: '⚠️ Missing session token' });
    }

    db.query(
        'SELECT users.email FROM user_session INNER JOIN users ON user_session.user_id = users.id WHERE session_token = ? AND expires_at > NOW()', 
        [sessionToken],
        (err, results) => {
            if (err) {
                console.error('❌ Database error:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }

            if (results.length === 0) {
                console.log("❌ Invalid or expired session token.");
                return res.status(401).json({ success: false, message: '⚠️ Invalid or expired session token' });
            }

            req.userEmail = results[0].email;
            console.log("✅ Token Verified for:", req.userEmail);
            next();
        }
    );
}

// Middleware to verify admin session token
function verifyAdminSessionToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        console.log("⚠️ No authorization header found");
        return res.status(401).json({ success: false, message: '⚠️ No authorization header found' });
    }

    const sessionToken = authHeader.split(' ')[1];
    console.log("🔍 Verifying Admin Session Token:", sessionToken);

    if (!sessionToken) {
        return res.status(401).json({ success: false, message: '⚠️ Missing session token' });
    }

    db.query(
        'SELECT users.email, users.role, admin_session.expires_at FROM admin_session INNER JOIN users ON admin_session.admin_id = users.id WHERE session_token = ? AND users.role = "admin" AND (expires_at IS NULL OR expires_at > NOW())',
        [sessionToken],
        (err, results) => {
            console.log("🔍 Query Results:", results); // This will help debug
        
            req.userEmail = results[0]?.email;
            req.userRole = results[0]?.role;
            console.log("✅ Admin Token Verified for:", req.userEmail);
            next();
        }
    );
}
app.post('/upload', upload.single('resume'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'File upload failed' });
    }

    console.log("✅ File uploaded:", req.file.filename); // Debugging line

    res.json({ 
        success: true, 
        message: 'File uploaded successfully', 
        filePath: `./uploads/${req.file.filename}`
    });
});
app.post('/apply', upload.single('resume'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'File upload failed' });
    }

    const sessionToken = req.headers.authorization?.split(' ')[1]; // Get session token from headers

    if (!sessionToken) {
        return res.status(401).json({ success: false, message: 'Unauthorized: No session token provided' });
    }

    // Fetch user_id from session_token
    db.query('SELECT id FROM user_session WHERE session_token = ?', [sessionToken], (err, result) => {
        if (err) {
            console.error('❌ Database error:', err);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }

        if (result.length === 0) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Invalid session token' });
        }

        const userId = result[0].id;

        // Extract application details
        const { fullname, email, phone, address, school, degree, graduationYear, company, position, duration, coverLetter, jobId } = req.body;
        const resumeFilePath = `./uploads/${req.file.filename}`;

        // Insert application into the database
        const query = `
            INSERT INTO applications (fullname, email, phone, address, school, degree, graduation_year, company, position, duration, cover_letter, resume, job_id, status, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(query, [
            fullname, email, phone, address, school, degree, graduationYear, company, position, duration, coverLetter, resumeFilePath, jobId, 'pending', userId
        ], (err, result) => {
            if (err) {
                console.error('❌ Database error:', err);
                return res.status(500).json({ success: false, message: 'Internal Server Error' });
            }

            console.log('✅ Application saved to database', result);
            res.json({ success: true, message: 'Application submitted successfully!', filePath: resumeFilePath });
        });
    });
});

  

// Signup route
app.post('/signup', (req, res) => {
    const { name, email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Error checking user:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (results.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Error hashing password:', err);
                return res.status(500).json({ success: false, message: 'Password hash error' });
            }

            db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword], (err, results) => {
                if (err) {
                    console.error('Error inserting user:', err);
                    return res.status(500).json({ success: false, message: 'Database error' });
                }

                return res.json({ success: true, message: 'Signup successful' });
            });
        });
    });
});

// Route to mark notification as read
app.put('/notifications/:id/read', verifySessionToken, (req, res) => {
    const notificationId = req.params.id;

    // Update notification's read status to 1 (read)
    db.query('UPDATE notifications SET read_status = 1 WHERE id = ?', [notificationId], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });

        res.json({ success: true, message: 'Notification marked as read' });
    });
});

// Route to fetch user notifications
app.get('/notifications', verifySessionToken, (req, res) => {
    // Extract the session token from the authorization header
    const sessionToken = req.headers.authorization.split(' ')[1];
    
    console.log('Session Token:', sessionToken);  // Log token to verify it's being passed

    if (!sessionToken) {
        return res.status(400).json({ success: false, message: 'Session token is required' });
    }

    // SQL query to get notifications, excluding session_token
    const query = `
        SELECT id, user_id, message, status, read_status, created_at 
        FROM notifications 
        WHERE user_id = (
            SELECT user_id FROM user_session WHERE session_token = ?
        ) 
        ORDER BY created_at DESC LIMIT 0, 1000;
    `;
    
    // Execute the query with the session token as a parameter
    db.query(query, [sessionToken], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);  // Log the error for debugging
            return res.status(500).json({ success: false, message: 'Database error', error: err });
        }

        console.log('Query Results:', results);  // Log the query results for debugging

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'No notifications found' });
        }

        // Send the results back as the response
        res.json({ success: true, notifications: results });
    });


    
    // Log the query for debugging
    console.log('Executing query:', query, 'With session token:', sessionToken);

    // Execute the query
    db.query(query, [sessionToken], (err, results) => {
        if (err) {
            console.error('Database Error:', err);  // Log the actual error from the database
            return res.status(500).json({ success: false, message: 'Database error', error: err });
        }

        // Log query results to verify if anything is returned
        console.log('Query Results:', results);

        res.json({ success: true, notifications: results });
    });
});


// Route to update application status and send notifications
app.put('/admin/applications/:id', verifyAdminSessionToken, (req, res) => {
    const applicationId = req.params.id;
    const { status } = req.body;
    const sessionToken = req.headers.authorization.split(' ')[1]; // Extract the session token

    // Validate status to be either "approved" or "rejected"
    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    // Fetch the user_id before updating the application status
    db.query('SELECT user_id FROM applications WHERE id = ?', [applicationId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Database error', error: err });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        const userId = results[0].user_id;

        // Now update the application status
        db.query('UPDATE applications SET status = ? WHERE id = ?', [status, applicationId], (err, updateResult) => {
            if (err) {
                console.error('Error updating application status:', err);
                return res.status(500).json({ success: false, message: 'Error updating application status', error: err });
            }

            if (updateResult.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Application not found' });
            }

            // If user_id exists, insert a notification
            if (userId) {
                const message = `Your application has been ${status}`;

                // Insert notification into the database
                db.query(
                    'INSERT INTO notifications (user_id, message, status, read_status, session_token, created_at) VALUES (?, ?, ?, 0, ?, NOW())',
                    [userId, message, 'pending', sessionToken],  // Pass the sessionToken here
                    (err) => {
                        if (err) {
                            console.error('Error inserting notification:', err);
                            return res.status(500).json({ success: false, message: 'Error sending notification', error: err });
                        }

                        // If notification is inserted successfully, respond with success
                        res.json({
                            success: true,
                            message: `Application ${status} successfully and user notified!`
                        });
                    }
                );
            } else {
                // No user to notify
                res.json({
                    success: true,
                    message: `Application ${status} successfully, but no user to notify.`
                });
            }
        });
    });
});

// Middleware to verify Admin session token
function verifyAdminSessionToken(req, res, next) {
    const sessionToken = req.headers.authorization.split(' ')[1]; // Extract token from header
    
    console.log('Admin Session Token:', sessionToken);  // Log token to verify it's being passed

    // SQL query to check if session token is valid and belongs to an admin
    db.query('SELECT user_id FROM user_session WHERE session_token = ?', [sessionToken], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0) return res.status(401).json({ message: 'Invalid session token' });

        const userId = results[0].user_id;

        // Query user details to check if the user is an admin (e.g., user role in `users` table)
        db.query('SELECT role FROM users WHERE id = ?', [userId], (err, userResults) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            if (userResults.length === 0 || userResults[0].role !== 'admin') {
                return res.status(403).json({ message: 'Access denied. Admin only.' });
            }
            next(); // Continue to the next middleware or route handler
        });
    });
}

// Route to fetch notifications for the admin
app.get('/notifications', verifySessionToken, (req, res) => {
    const sessionToken = req.headers.authorization.split(' ')[1]; // Extract token from header

    console.log('Session Token:', sessionToken);  // Log token to verify it's being passed

    // SQL query to get notifications, excluding session_token
    const query = `
        SELECT id, user_id, message, status, read_status, created_at 
        FROM notifications 
        WHERE user_id = (
            SELECT user_id FROM user_session WHERE session_token = ?
        ) 
        ORDER BY created_at DESC LIMIT 0, 1000;
    `;

    db.query(query, [sessionToken], (err, notifications) => {
        if (err) {
            console.error('Error fetching notifications:', err);
            return res.status(500).json({ success: false, message: 'Error fetching notifications', error: err });
        }

        // Respond with notifications data
        res.json({ success: true, notifications });
    });
});



// Login route
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Error checking login:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'User not found. Please register first.' });
        }

        const user = results[0];

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Error comparing passwords:', err);
                return res.status(500).json({ success: false, message: 'Password comparison error' });
            }

            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            const sessionToken = crypto.randomBytes(32).toString('hex'); // Secure token generation
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

            db.query('INSERT INTO user_session (user_id, session_token, expires_at) VALUES (?, ?, ?)', [user.id, sessionToken, expiresAt], (err, result) => {
                if (err) {
                    console.error('Error creating session:', err);
                    return res.status(500).json({ success: false, message: 'Error creating session' });
                }

                res.json({ success: true, message: 'Login successful', sessionToken });
            });
        });
    });
});require("dotenv").config();


app.use(cors());
app.use(express.json());


// Fetch all tables data for admin
app.get("/admin/data", (req, res) => {
    const queries = {
        users: "SELECT * FROM users",
        company_accounts: "SELECT * FROM company_accounts",
        jobs: "SELECT * FROM jobs",
        applications: "SELECT * FROM applications",
        notifications: "SELECT * FROM notifications"
    };

    let results = {};
    let completed = 0;
    for (const [key, query] of Object.entries(queries)) {
        db.query(query, (err, data) => {
            if (err) return res.status(500).json({ error: err.message });
            results[key] = data;
            completed++;
            if (completed === Object.keys(queries).length) {
                res.json(results);
            }
        });
    }
});

// Delete a record
app.delete("/admin/delete/:table/:id", (req, res) => {
    const { table, id } = req.params;
    const query = `DELETE FROM ?? WHERE id = ?`;

    db.query(query, [table, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "Record deleted successfully" });
    });
});

// Update application status
app.post("/admin/update-application-status", (req, res) => {
    const { applicationId, newStatus } = req.body;
    const query = `UPDATE applications SET status = ? WHERE id = ?`;

    db.query(query, [newStatus, applicationId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: `Application ${newStatus}` });
    });
});



// Admin Login route (with hardcoded credentials)
app.post('/admin/login', (req, res) => {
    const { email, password } = req.body;

    // Hardcoded admin credentials
    const adminEmail = 'admin';
    const adminPassword = 'admin123';

    if (email !== adminEmail || password !== adminPassword) {
        return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = null;  // Admin session never expires

    db.query(
        'INSERT INTO admin_session (admin_id, session_token, expires_at) VALUES (?, ?, ?)',
        [1, sessionToken, expiresAt], // Assuming `admin_id` 1 for simplicity
        (err) => {
            if (err) return res.status(500).json({ success: false, message: 'Error creating session' });

            res.json({ success: true, message: 'Admin login successful', sessionToken });
        }
    );
});
// Fetch jobs
app.get('/jobs', (req, res) => {
    const keyword = req.query.keyword || '';

    db.query('SELECT * FROM jobs WHERE title LIKE ? OR industry LIKE ? OR location LIKE ?',
    [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });

        res.json({ success: true, jobs: results });
    });
});
// Fetch all job applications (with optional filtering by status)
app.get('/admin/applications', verifyAdminSessionToken, (req, res) => {
    const { status } = req.query; // Allow filtering by status (optional)
    
    let sql = 'SELECT fullname, email, phone, address, school, degree, graduation_year, company, position, duration, cover_letter, resume, applied_at, job_id, status, id, user_id FROM applications';
    let params = [];

    if (status) {
        sql += ' WHERE status = ?';
        params.push(status);
    }

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        res.json({ success: true, applications: results });
    });
});
const connection = require("../frontend/public/js/db"); 
app.patch("/admin/update/:table/:id", async (req, res) => {
    const { table, id } = req.params;
    const { status } = req.body;

    try {
        const query = `UPDATE ?? SET status = ? WHERE id = ?`;
        const values = [table, status, id];

        connection.query(query, values, (error, results) => {
            if (error) {
                console.error("Error updating record:", error);
                return res.status(500).json({ success: false, error: "Database error" });
            }

            res.json({ success: true, affectedRows: results.affectedRows });
        });
    } catch (error) {
        console.error("Error updating record:", error);
        res.status(500).json({ success: false, error: "Database error" });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
