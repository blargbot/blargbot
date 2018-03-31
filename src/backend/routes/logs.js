/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:19:49
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-03-31 14:44:51
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const router = dep.express.Router();

const types = [{
    name: 'Create',
    color: 'blue-grey darken-2'
}, {
    name: 'Update',
    color: 'edit'
}, {
    name: 'Delete',
    color: 'delete'
}];

router.get('/', (req, res) => {
    res.locals.user = req.user;
    req.session.returnTo = '/logs' + req.path;

    res.render('logsfirst');
});

router.post('/', async (req, res) => {
    res.locals.user = req.user;
    req.session.returnTo = '/logs' + req.path;

    let hash = req.body.hash;
    let db = 'blargdb';
    if (hash.startsWith('beta')) {
        res.locals.beta = true;
        db = 'blargbetadb';
        hash = hash.replace('beta', '');
    }
    res.locals.hash = hash;
    let logsSpecs = await r.db(db).table('logs').get(parseInt(hash)).run();
    if (!logsSpecs) {
        res.locals.continue = false;
    } else {
        let messages = await r.db(db).table('chatlogs')
            .getAll(r.args(logsSpecs.ids), { index: 'msgid' })
            .orderBy('msgtime')
            .eqJoin('userid', r.table('user'), {
                index: 'userid'
            }).zip().orderBy('id').run();
        if (messages.length > 0) {
            messages = messages.filter(m => logsSpecs.types.includes(m.type));
            let messages2 = [];
            for (let m of messages) {
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
                m.avatar = (user.avatarURL || '').split('?size=')[0] || '/img/default.png';
                if (m.embeds)
                    for (const embed of m.embeds) {
                        if (embed.color) {
                            embed.color = embed.color.toString(16);
                        }
                        if (embed.timestamp && embed.footer)
                            embed.separateFooter = true;
                    }

                m.msgtime = dep.moment(bu.unmakeSnowflake(m.id)).unix();
                let text = m.content;

                text = dep.hbs.handlebars.Utils.escapeExpression(text);

                text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
                while (/&lt;@!?(\d+)&gt;/.test(text)) {
                    let id = text.match(/&lt;@!?(\d+)&gt;/)[1];
                    let user;
                    if (bot.users.get(id)) user = bot.users.get(id);
                    else {
                        try {
                            user = await bot.getRESTUser(id);
                        } catch (err) {
                            user = {
                                username: 'Unknown',
                                discriminator: '????'
                            };
                        }
                    }
                    text = text.replace(/&lt;@!?\d+&gt;/, `<span class='mention clipboard tooltipped' 
                    data-position='top' 
                    data-delay='50' 
                    data-tooltip='<span class="${id} mentiontooltip">${id}</span>' 
                    data-html='true'
                    data-user-id='${id}'
                    data-clipboard-text='${id}'>@${user.username}#${user.discriminator}</span>`);
                }
                m.content = new dep.hbs.handlebars.SafeString(text);
                m.type = types[m.type];
                messages2.push(m);
            }
            res.locals.messages = messages;
            res.locals.channel = logsSpecs.channel;
            let lookedUp = await spawner.lookupChannel(logsSpecs.channel);
            res.locals.channelname = lookedUp.channel;
            res.locals.guildname = lookedUp.guild;
            res.locals.users = logsSpecs.users.join(', ');
            res.locals.types = logsSpecs.types.join(', ');
            res.locals.first = logsSpecs.first;
            res.locals.last = logsSpecs.last;
            res.locals.limit = messages.length;
            res.locals.continue = true;
        }
    }
    res.render('logs');
});
module.exports = router;