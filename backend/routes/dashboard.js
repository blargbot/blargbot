/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:19:18
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:19:18
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const router = dep.express.Router();

router.get('/', async function(req, res) {
    if (!req.user) {
        res.redirect('/login');
        return;
    }
    res.locals.user = req.user;
    req.session.returnTo = req.path;
    //    logger.website();
    if (req.user) {
        res.locals.url = config.general.isbeta ? 'ws://localhost:8085' : 'wss://blargbot.xyz';
        res.locals.sessionId = req.sessionID;
        let settings = Object.keys(bu.settings).map(k => {
            let returnObj = bu.settings[k];
            returnObj.key = k;
            return returnObj;
        });
        //  logger.debug(settings);
        res.locals.gsettings = new dep.hbs.handlebars.SafeString(JSON.stringify(settings).replace(/`/g, '\\`'));
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