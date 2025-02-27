const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('index');
})

router.get('/our-team', (req, res) => {
    res.render('our-team');
})

module.exports = router;