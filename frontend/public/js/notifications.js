const db = require('./db');

// Function to get notifications for a specific user
function getNotificationsForUser(userId) {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, results) => {
            if (err) {
                return reject({ error: true, message: 'Error fetching notifications', details: err });
            }
            resolve({ success: true, notifications: results });
        });
    });
}

// Function to send a notification to the user
function sendNotification(userId, message, status = 'pending') {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO notifications (user_id, message, status) VALUES (?, ?, ?)';
        db.query(query, [userId, message, status], (err, result) => {
            if (err) {
                return reject({ error: true, message: 'Error sending notification', details: err });
            }
            resolve({ success: true, message: 'Notification sent successfully' });
        });
    });
}

module.exports = { getNotificationsForUser, sendNotification };
