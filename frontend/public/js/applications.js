const db = require('./db');

function updateApplicationStatus(applicationId, status, adminToken, callback) {
    if (!['approved', 'rejected'].includes(status)) {
        return callback({ error: true, message: 'Invalid status' });
    }

    // Validate if the admin token is present
    if (!adminToken) {
        return callback({ error: true, message: 'Unauthorized: Admin session token is required' });
    }

    // Fetch the application details including session_token
    db.query('SELECT user_id, session_token FROM applications WHERE id = ?', [applicationId], (err, results) => {
        if (err) return callback({ error: true, message: 'Database error', details: err });

        if (results.length === 0) {
            return callback({ error: true, message: 'Application not found' });
        }

        const { user_id, session_token } = results[0];

        // Check if session token matches
        if (session_token !== adminToken) {
            return callback({ error: true, message: 'Unauthorized: Invalid admin session token' });
        }

        // Update application status
        db.query('UPDATE applications SET status = ? WHERE id = ?', [status, applicationId], (err, result) => {
            if (err) return callback({ error: true, message: 'Error updating application', details: err });

            if (result.affectedRows === 0) {
                return callback({ error: true, message: 'Application not found' });
            }

            // Notify user about application status update
            if (user_id) {
                const message = `Your application has been ${status}`;
                db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [user_id, message], (err) => {
                    if (err) return callback({ error: true, message: 'Error sending notification', details: err });

                    callback(null, `Application ${status} successfully and user notified.`);
                });
            } else {
                callback(null, `Application ${status} successfully, but no user to notify.`);
            }
        });
    });
}

function getApplicationResume(applicationId, callback) {
    db.query('SELECT resume FROM applications WHERE id = ?', [applicationId], (err, results) => {
        if (err) return callback({ error: true, message: 'Database error', details: err });

        if (results.length === 0) {
            return callback({ error: true, message: 'Application not found' });
        }

        callback(null, results[0].resume || 'No Resume Available');
    });
}

module.exports = { updateApplicationStatus, getApplicationResume };
