/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:19:14
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-12-09 00:50:18
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const router = require('express').Router();
const hbs = require('hbs');
const settings = require('../../dcommands_old/settings');

router.get('/', (req, res) => {
    res.locals.user = req.user;
    req.session.returnTo = '/commands' + req.path;

    res.render('commands');
});

router.get('/settings', (req, res) => {
    res.locals.user = req.user;
    req.session.returnTo = '/commands/settings' + req.path;
    res.locals.botsettings = Object.keys(bu.settings).map(k => {
        let settings = bu.settings[k];
        settings.key = k.toUpperCase();
        settings.desc = new hbs.handlebars.SafeString(settings.desc);
        return settings;
    });
    res.render('settings');
});

module.exports = router;