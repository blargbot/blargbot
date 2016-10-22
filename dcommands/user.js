var e = module.exports = {};
var bu;
var moment = require('moment');



var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

    e.category = bu.CommandType.GENERAL;

};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'user [id/name/mention]';
e.info = 'Gets information about specified user';
e.longinfo = `<p>Gets information about the specified user.</p>`;

e.execute = async function(msg, words) {
    var userToGet;
    if (!words[1]) {
        userToGet = msg.member;
    } else {
        userToGet = await bu.getUser(msg, words[1]);
        if (userToGet)
            userToGet = bot.guilds.get(msg.channel.guild.id).members.get(userToGet.id);
        else return;
    }
    if (!userToGet) {
        //   sendMessageToDiscord(msg.channel.id, 'Unable to find that user on this guild!');
        return;
    }
    //  var avatarUrl = `https://cdn.discordapp.com/avatars/${userToGet.user.id}/${userToGet.user.avatar}.jpg`;
    var message = `\`\`\`prolog
User: ${userToGet.user.username}#${userToGet.user.discriminator}
Username: ${userToGet.user.username}
Nickname: ${userToGet.nick}
Discriminator: ${userToGet.user.discriminator}
${!userToGet.user.bot ? 'Account Type: User' : 'Account Type: Bot'}
ID: ${userToGet.user.id}
Account created on ${moment(userToGet.user.createdAt).format('llll')}
Account joined guild '${msg.channel.guild.name}' on ${moment(userToGet.joinedAt).format('llll')}
${userToGet.game == null ? `Not playing anything` : `Currently ${userToGet.game.type != null && userToGet.game.type > 0 ? 'streaming' : 'playing'} ${userToGet.game.name}`}
Allowed permissions: ${userToGet.permission.allow}
Denied permissions: ${userToGet.permission.deny}
Avatar URL: ${userToGet.user.avatarURL}
\`\`\``;
    bu.sendFile(msg.channel.id, message, userToGet.user.avatarURL);
};