const BaseCommand = require('../structures/BaseCommand');

class UserCommand extends BaseCommand {
    constructor() {
        super({
            name: 'user',
            category: bu.CommandType.GENERAL,
            usage: 'user [id/name/mention]',
            info: 'Gets information about specified user'
        });
    }

    async execute(msg, words, text) {
        var userToGet;
        let isMember = true;
        if (!words[1]) {
            userToGet = msg.member;
        } else {
            userToGet = await bu.getUser(msg, words[1]);
            if (userToGet) {
                if (bot.guilds.get(msg.channel.guild.id).members.get(userToGet.id))
                    userToGet = bot.guilds.get(msg.channel.guild.id).members.get(userToGet.id);
                else isMember = false;
            } else return;
        }
        if (!userToGet) {
            //   sendMessageToDiscord(msg.channel.id, 'Unable to find that user on this guild!');
            return;
        }
        //  var avatarUrl = `https://cdn.discordapp.com/avatars/${userToGet.user.id}/${userToGet.user.avatar}.jpg`;
        var message;
        if (isMember) {
            message = `\`\`\`prolog
${bu.padLeft('User', 19)} : ${userToGet.user.username}#${userToGet.user.discriminator}
${bu.padLeft('Username', 19)} : ${userToGet.user.username}
${bu.padLeft('Nickname', 19)} : ${userToGet.nick}
${bu.padLeft('Discriminator', 19)} : ${userToGet.user.discriminator}
${!userToGet.user.bot ? `${bu.padLeft('Account Type', 19)} : User` : `${bu.padLeft('Account Type', 19)} : Bot`}
${bu.padLeft('ID', 19)} : ${userToGet.user.id}
${bu.padLeft('Allowed Permissions', 19)} : ${userToGet.permission.allow}
${bu.padLeft('Denied Permissions', 19)} : ${userToGet.permission.deny}
${bu.padLeft('Avatar URL', 19)} : ${userToGet.user.avatarURL}
Account created on ${dep.moment(userToGet.user.createdAt).format('llll')}
Account joined guild '${msg.channel.guild.name}' on ${dep.moment(userToGet.joinedAt).format('llll')}
${userToGet.game == null ? `Not playing anything` : `Currently ${userToGet.game.type != null && userToGet.game.type > 0 ? 'streaming' : 'playing'} ${userToGet.game.name}`}
\`\`\``;
        } else {
            message = `\`\`\`prolog
${bu.padLeft('User', 14)} : ${userToGet.username}#${userToGet.discriminator}
${bu.padLeft('Username', 14)} : ${userToGet.username}
${bu.padLeft('Discriminator', 14)} : ${userToGet.discriminator}
${!userToGet.bot ? `${bu.padLeft('Account Type', 14)} : User` : `${bu.padLeft('Account Type', 14)} : Bot`}
${bu.padLeft('ID', 14)} : ${userToGet.id}
${bu.padLeft('Avatar URL', 14)} : ${userToGet.avatarURL}
Account created on ${dep.moment(userToGet.createdAt).format('llll')}
\`\`\``;
        }
        bu.sendFile(msg.channel.id, message, isMember ? userToGet.user.avatarURL : userToGet.avatarURL);
    }
}

module.exports = UserCommand;
