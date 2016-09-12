var e = module.exports = {};
var bu = require('./../util.js');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};

e.isCommand = true;
e.hidden = false;
e.usage = 'blacklist';
e.info = 'Blacklists the current channel. The bot will not respond until you do `blacklist` again.';
e.longinfo = `<p>Blacklists the current channel. The bot will not respond until you do the command again.</p>`;
e.category = bu.CommandType.COMMANDER;

e.execute = (msg) => {
    //  if (bu.hasPerm(msg, 'Bot Commander')) {
    bu.isBlacklistedChannel(msg.channel.id).then(blacklisted => {
        if (blacklisted) {
            bu.db.query(`update channel set blacklisted = false where channelid = ?`, [msg.channel.id], () => {
                bu.sendMessageToDiscord(msg.channel.id, `Channel **${msg.channel.name}** is no longer blacklisted.`);
            });

        } else {
            bu.db.query(`insert into channel (channelid, guildid, blacklisted) values (?, ?, true)
            on duplicate key update blacklisted=true`, [msg.channel.id, msg.channel.guild.id], () => {
                    bu.sendMessageToDiscord(msg.channel.id, `Channel **${msg.channel.name}** is now blacklisted.`);
                });

        }
    });
};