/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:19:37
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-09-12 08:53:10
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

router.get('/shards', (req, res) => {
    res.locals.url = config.general.isbeta ? 'ws://localhost:8085' : 'wss://blargbot.xyz';

    res.render('shards');
})

router.get('/netneut', (req, res) => {
    res.locals.user = req.user;
    req.session.returnTo = req.path;

    res.render('bsod-netneut');
})

router.get('/main', (req, res) => {
    res.locals.user = req.user;
    req.session.returnTo = req.path;

    res.render('index');
})

router.get('/editor', (req, res) => {
    res.redirect('/tags/editor');
});
module.exports = router;
