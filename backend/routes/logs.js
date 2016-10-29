const express = require('express');
const router = express.Router();
const moment = require('moment');
const hbs = require('hbs');

const types = [
    { name: 'Create', color: 'blue-grey darken-2' },
    { name: 'Update', color: 'edit' },
    { name: 'Delete', color: 'delete' }
];

router.get('/', (req, res) => {
    res.locals.user = req.user;
    req.session.returnTo = '/logs' + req.path;

    res.render('logsfirst');
});

router.post('/', async (req, res) => {
    res.locals.user = req.user;
    req.session.returnTo = '/logs' + req.path;

    logger.debug(req.body);
    let hash = req.body.hash;
    let db = 'blargdb';
    if (hash.startsWith('beta')) {
        res.locals.beta = true;
        db = 'blargbetadb';
        hash = hash.replace('beta', '');
    }
    res.locals.hash = hash;
    let logsSpecs = await bu.r.db(db).table('logs').get(hash).run();
    if (!logsSpecs) {
        res.locals.continue = false;
    } else {
        let messages = await bu.r.db(db).table('chatlogs')
            .between([logsSpecs.channel, logsSpecs.firsttime], [logsSpecs.channel, logsSpecs.lasttime], { index: 'channel_time' })
            .orderBy({ index: 'channel_time' })
            .filter(function (q) {
                return bu.r.expr(logsSpecs.users).count().eq(0).or(bu.r.expr(logsSpecs.users).contains(q('userid')))
                    .and(bu.r.expr(logsSpecs.types).count().eq(0).or(bu.r.expr(logsSpecs.types).contains(q('type')))
                    );
            })
            .limit(logsSpecs.limit).eqJoin('userid', bu.r.table('user'), { index: 'userid' }).zip().orderBy('msgtime').run();
        if (messages.length > 0) {
            messages = messages.map(m => {
                let user = bot.users.get(m.userid);
                if (!user) user = {
                    username: m.username,
                    discriminator: m.discriminator,
                    bot: m.bot === 1,
                    avatarURL: m.avatarURL
                };
                m.username = user.username;
                m.userdiscrim = user.discriminator;
                m.bot = user.bot;
                m.avatar = user.avatarURL || '/img/default.png';

                m.msgtime = moment.unix(m.msgtime).unix();
                let text = m.content;

                text = hbs.handlebars.Utils.escapeExpression(text);


                text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
                logger.website(text);

                m.content = new hbs.handlebars.SafeString(text);
                m.type = types[m.type];
                return m;
            });
            res.locals.messages = messages;
            res.locals.channel = logsSpecs.channel;
            res.locals.channelname = bot.getChannel(logsSpecs.channel).name;
            res.locals.guildname = bot.getChannel(logsSpecs.channel).guild.name;
            res.locals.users = logsSpecs.users.join(', ');
            res.locals.types = logsSpecs.types.join(', ');
            res.locals.firsttime = moment(logsSpecs.firsttime).valueOf();
            res.locals.lasttime = moment(logsSpecs.lasttime).valueOf();
            res.locals.limit = logsSpecs.limit;
            res.locals.continue = true;
        }
    }
    res.render('logs');
});
module.exports = router;