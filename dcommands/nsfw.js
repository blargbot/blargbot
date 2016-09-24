var e = module.exports = {};
var bu;

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;
    e.category = bu.CommandType.COMMANDER;

};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'nsfw';
e.info = 'Designates the current channel as NSFW, allowing you to use NSFW commands.';
e.longinfo = '<p>Designates the current channel as NSFW, allowing you to use NSFW commands.</p>';


e.execute = (msg) => {
    // if (!bu.hasPerm(msg, 'Bot Commander')) {
    //     return;
    //  }
    bu.isNsfwChannel(msg.channel.id).then(nsfw => {
        if (nsfw) {
            bu.db.query(`update channel set nsfw = false where channelid = ?`, [msg.channel.id], () => {
                bu.sendMessageToDiscord(msg.channel.id, `Channel **${msg.channel.name}** is no longer NSFW.`);
            });

        } else {
            bu.db.query(`insert into channel (channelid, guildid, nsfw) values (?, ?, true)
            on duplicate key update nsfw=true`, [msg.channel.id, msg.channel.guild.id], () => {
                    bu.sendMessageToDiscord(msg.channel.id, `Channel **${msg.channel.name}** is now NSFW.`);
                });

        }
    });
};