const express = require('express');
const router = express.Router();
const hbs = require('hbs');

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