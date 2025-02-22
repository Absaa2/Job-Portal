const express = require('express');
const router = express.Router();

// Company Registration Route
router.post('/register', (req, res) => {
    res.send('Company registration route');
});

// Company Login Route
router.post('/login', (req, res) => {
    res.send('Company login route');
});

module.exports = router;
