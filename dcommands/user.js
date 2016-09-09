var e = module.exports = {};
var bu = require('./../util.js');
var moment = require('moment');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'user [id/name/mention]';
e.info = 'Gets information about specified user';
e.category = bu.CommandType.GENERAL;

e.execute = (msg, words) => {
    var userToGet;
    if (!words[1]) {
        userToGet = msg.member;
    } else {
        userToGet = bu.getUserFromName(msg, words[1]);
        userToGet = bot.guilds.get(msg.channel.guild.id).members.get(userToGet.id);
    }
    if (!userToGet) {
        //   sendMessageToDiscord(msg.channel.id, 'Unable to find that user on this guild!');
        return;
    }
    //  var avatarUrl = `https://cdn.discordapp.com/avatars/${userToGet.user.id}/${userToGet.user.avatar}.jpg`;
    var message = `\`\`\`xl
User: ${userToGet.user.username}#${userToGet.user.discriminator}
Username: ${userToGet.user.username}
Nickname: ${userToGet.nick}
Discriminator: ${userToGet.user.discriminator}
${!userToGet.user.bot ? 'Account Type: User' : 'Account Type: Bot'}
ID: ${userToGet.user.id}
Account created on ${moment(userToGet.user.createdAt).format('dddd, MMMM Do YYYY, h:mm:ss a')}
Account joined guild '${msg.channel.guild.name}' on ${moment(userToGet.joinedAt).format('dddd, MMMM Do YYYY, h:mm:ss a')}
${userToGet.game == null ? `Not playing anything` : `Currently ${userToGet.game.type != null && userToGet.game.type > 0 ? 'streaming' : 'playing'} ${userToGet.game.name}`}
Allowed permissions: ${userToGet.permission.allow}
Denied permissions: ${userToGet.permission.deny}
\`\`\`
${userToGet.user.avatarURL}`;
    bu.sendMessageToDiscord(msg.channel.id, message);
};