const express = require('express');
const router = express.Router();


router.get('/', (req, res) => {
    res.locals.user = req.user;
    req.session.returnTo = req.path;

    res.render('donate');
});
module.exports = router;