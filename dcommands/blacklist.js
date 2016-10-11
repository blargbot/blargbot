var e = module.exports = {};
var bu;
const async = require('asyncawait/async');
const await = require('asyncawait/await');

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

    e.category = bu.CommandType.COMMANDER;
};
e.isCommand = true;

e.hidden = false;
e.usage = 'blacklist';
e.info = 'Blacklists the current channel. The bot will not respond until you do `blacklist` again.';
e.longinfo = `<p>Blacklists the current channel. The bot will not respond until you do the command again.</p>`;

e.execute = async((msg) => {
    let storedGuild = await(bu.r.table('guild').get(msg.channel.guild.id).run());
    let channel = storedGuild.channels && storedGuild.channels.hasOwnProperty(msg.channel.id) 
    ? storedGuild.channels[msg.channel.id] : {
        nsfw: false
    };
    if (channel.blacklisted) {
        channel.blacklisted = false;
    } else {
        channel.blacklisted = true;
    }
    storedGuild.channels[msg.channel.id] = channel;
    bu.r.table('guild').get(msg.channel.guild.id).update({
        channels: storedGuild.channels
    });
});