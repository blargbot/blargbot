/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:19:37
 * @Last Modified by: RagingLink
 * @Last Modified time: 2020-07-01 21:07:31
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const router = require('express').Router();

router.get('/', (req, res) => {
    res.locals.user = req.user;
    req.session.returnTo = req.path;
    let date = new Date(Date.now());
    // if (date.getMonth() === 6 && date.getDate() === 12)
    //     res.render('bsod-netneut')
    // else
    res.render('index');
});

router.get('/netneut', (req, res) => {
    res.locals.user = req.user;
    req.session.returnTo = req.path;

    res.render('bsod-netneut');
});

router.get('/main', (req, res) => {
    res.locals.user = req.user;
    req.session.returnTo = req.path;

    res.render('index');
});

router.get('/editor', (req, res) => {
    res.redirect('/tags/editor');
});

router.get('/update', (req, res) => {
    res.locals.user = req.user;
    req.session.returnTo = req.path;

    res.render('update');
});

router.get('/privacy', (req, res) => {
    res.locals.user = req.user;
    req.session.returnTo = req.path;

    res.render('privacy');
});

module.exports = router;
