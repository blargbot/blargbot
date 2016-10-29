const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.locals.user = req.user;
    req.session.returnTo = '/commands' + req.path;

    res.render('commands');
});

module.exports = router;