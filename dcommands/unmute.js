var e = module.exports = {};



e.init = () => {
    e.category = bu.CommandType.ADMIN;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'unmute <user> [flags]';
e.info = 'Unmutes a user.\nIf mod-logging is enabled, the unmute will be logged.';
e.longinfo = `<p>Unmutes a user.</p>
    <p>If mod-logging is enabled, the unmute will be logged.</p>`;

e.flags = [{
    flag: 'r',
    word: 'reason',
    desc: 'The reason for the unmute.'
}];

e.execute = async function(msg, words) {
    let mutedrole = await bu.guildSettings.get(msg.channel.guild.id, 'mutedrole');

    if (!mutedrole) {
        bu.send(msg, `No muted users were found. You can only unmute users muted with \`mute\`.`);
    }
    if (words.length > 1) {

        if (msg.channel.guild.members.get(bot.user.id).permission.json.manageRoles) {
            //     if (msg.member.permission.json.manageRoles) {
            let role = msg.guild.roles.get(mutedrole);
            if (words[1]) {
                var user = await bu.getUser(msg, words[1]);
                var member = msg.channel.guild.members.get(user.id);
                if (!user)
                    return;

                if (member.roles.indexOf(mutedrole) == -1) {
                    bu.send(msg, 'That user isn\'t muted!');
                } else {
                    var roles = member.roles;
                    roles.splice(roles.indexOf(mutedrole), 1);
                    let voiceMute = msg.guild.members.get(bot.user.id).permission.json.voiceMuteMembers;
                    try {
                        await bot.editGuildMember(msg.channel.guild.id, user.id, {
                            roles: roles,
                            mute: voiceMute ? false : undefined
                        });
                        let input = bu.parseInput(e.flags, words);
                        bu.logAction(msg.channel.guild, user, msg.author, 'Unmute', input.r);
                        bu.send(msg, ':ok_hand:');
                    } catch (err) {
                        bu.send(msg, `Failed to remove the muted role! Please check your permission settings and command and retry. \nIf you still can't get it to work, please report it to me by doing \`b!report <your issue>\` with the following:\`\`\`\n${err.message}\n${err.response}\`\`\``);
                        throw err;
                    }
                }
            }
        } else {
            bu.send(msg, `I don't have permission to unmute users! Make sure I have the \`manage roles\` permission and try again.`);
        }
    }
};

e.event = async function(args) {
    let guild = bot.guilds.get(args.guild);
    if (!guild || !guild.members.get(args.user)) return;
    let member = guild.members.get(args.user);

    var roles = member.roles;
    if (roles.indexOf(args.role) > -1) {
        roles.splice(roles.indexOf(args.role), 1);
        let voiceMute = guild.members.get(bot.user.id).permission.json.voiceMuteMembers;
        await bot.editGuildMember(guild.id, member.id, {
            roles: roles,
            mute: voiceMute ? false : undefined
        });
        bu.logAction(guild, member.user, bot.user, 'Auto-Unmute', `Automatically unmuted after ${dep.moment.duration(args.duration).humanize()}.`);
    }
};