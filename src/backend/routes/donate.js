/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:19:31
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:19:31
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const router = require('express').Router();

router.get('/', (req, res) => {
    res.locals.user = req.user;
    req.session.returnTo = req.path;

    res.render('donate');
});

module.exports = router;