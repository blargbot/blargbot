var e = module.exports = {};




e.init = () => {



    e.category = bu.CommandType.ADMIN;

};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'unmute <user>';
e.info = 'Unmutes a user.\nIf mod-logging is enabled, the unmute will be logged.';
e.longinfo = `<p>Unmutes a user.</p>
    <p>If mod-logging is enabled, the unmute will be logged.</p>`;

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

                var botPos = bu.getPosition(msg.channel.guild.members.get(bot.user.id));
                var userPos = bu.getPosition(msg.member);
                var targetPos = role.position;
                if (targetPos >= botPos) {
                    bu.send(msg, `I don't have permission to get rid of the muted role!`);
                    return;
                }
                if (targetPos >= userPos) {
                    bu.send(msg, `You don't have permission to get rid of the muted role!`);
                    return;
                }

                if (member.roles.indexOf(mutedrole) == -1) {
                    bu.send(msg, 'That user isn\'t muted!');
                } else {
                    var roles = member.roles;
                    roles.splice(roles.indexOf(mutedrole), 1);
                    bot.editGuildMember(msg.channel.guild.id, user.id, {
                        roles: roles
                    });
                    bu.logAction(msg.channel.guild, user, msg.author, 'Unmute');
                    bu.send(msg, ':ok_hand:');
                }


                //   if (!bu.bans[msg.channel.guild.id])
                //        bu.bans[msg.channel.guild.id] = {}
                //    bu.bans[msg.channel.guild.id][user.id] = msg.author.id
                //    var deletedays = 0
                //    if (words[2])
                //       deletedays = parseInt(words[2])
                // bot.banGuildMember(msg.channel.guild.id, user.id, deletedays)
            }
            //bot.ban
            //           } else {
            //               bu.send(msg, `You don't have permission to mute users! Make sure you have the \`manage roles\` permission and try again.`);
            //           }
        } else {
            bu.send(msg, `I don't have permission to mute users! Make sure I have the \`manage roles\` permission and try again.`);
        }
    }
};