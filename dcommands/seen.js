var e = module.exports = {};
const moment = require('moment');

e.init = () => {
    e.category = bu.CommandType.GENERAL;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'seen <user>';
e.info = 'Tells you the last time I saw a user speak!';
e.longinfo = `<p>Tells you the last time I saw a user speak!</p>`;

e.execute = async function(msg, words) {
    if (!words[1]) {
        bu.send(msg, 'You have to tell me what user you want!');
        return;
    }
    let user = await bu.getUser(msg, words.slice(1).join(' '));
    if (user) {
        let storedUser = await r.table('user').get(user.id);
        let lastSeen = moment(storedUser.lastspoke);
        logger.debug(storedUser.lastspoke, lastSeen.format('llll'));
        let diff = moment.duration(moment() - lastSeen);
        diff = diff.subtract(diff.asMilliseconds() * 2, 'ms');
        bu.send(msg, `I last saw **${bu.getFullName(user)}** ${diff.humanize(true)}`);
    }
};