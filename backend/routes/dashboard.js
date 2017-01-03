const express = require('express');
const router = express.Router();

router.get('/', async function(req, res) {
    res.locals.user = req.user;
    req.session.returnTo = req.path;
    //    logger.website();
    if (req.user) {
        res.locals.url = config.general.isbeta ? 'ws://localhost:8085' : 'wss://blargbot.xyz';
        res.locals.sessionId = req.sessionID;

        let guilds = req.user.guilds;
        let firstGuildCount = guilds.length;

        guilds = guilds.filter(g => {
            return bot.guilds.get(g.id) != undefined;
        });
        res.locals.otherGuilds = firstGuildCount - guilds.length;

        guilds = await Promise.filter(guilds, async function(g) {
            return await bu.isUserStaff(req.user.id, g.id);
        });
        res.locals.guilds = guilds;
    }
    res.render('dashboard');
});
module.exports = router;