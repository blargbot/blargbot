var e = module.exports = {};
const moment = require('moment');

e.init = () => {
    e.category = bu.CommandType.ADMIN;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'mute <user> [flags]';
e.info = 'Gives the user a special muted role. On first run, this role will be created. The bot needs to be able to ' +
    '`manage roles` to create and assign the role, and `manage channels` to configure ' +
    'the role. You are able to manually configure the role without the bot, but the bot has to make it. ' +
    'Deleting the muted role causes it to be regenerated.\n' +
    'If mod-logging is enabled, the mute will be logged.\nYou can also specify a length of time the user should be muted for, using formats such as `1 hour 2 minutes` or `1h2m`.';
e.longinfo = `<p>Gives the user a special muted role. On first run, this role will be created. The bot needs to be able to
        <code>manage roles</code> to create and assign the role, and <code>manage channels</code> to configure
        the role. You are able to manually configure the role without the bot, but the bot has to make it.
        Deleting the muted role causes it to be regenerated.</p>
    <p>If mod-logging is enabled, the mute will be logged.</p>
    You can also specify a length of time the user should be muted for, using formats such as <code>1 hour 2 minutes</code> or <code>1h2m</code></p>`;

e.flags = [{
    flag: 'r',
    word: 'reason',
    desc: 'The reason for the mute.'
}, {
    flag: 't',
    word: 'time',
    desc: `The amount of time to mute for, formatted as '1 day 2 hours 3 minutes and 4 seconds', '1d2h3m4s', or some other combination.`
}];

e.execute = async function(msg, words, text) {
    let mutedrole = await bu.guildSettings.get(msg.channel.guild.id, 'mutedrole');

    if (!mutedrole) {
        if (msg.channel.guild.members.get(bot.user.id).permission.json.manageRoles) {
            let role = await bot.createRole(msg.channel.guild.id);
            logger.debug(role.id);
            bot.editRole(msg.channel.guild.id, role.id, {
                color: 16711680,
                name: 'Muted',
                permissions: 0
            });
            await bu.guildSettings.set(msg.channel.guild.id, 'mutedrole', role.id);
            if (msg.channel.guild.members.get(bot.user.id).permission.json.manageChannels) {
                var channels = msg.channel.guild.channels.map(m => m);
                logger.debug(channels.length);
                for (var i = 0; i < channels.length; i++) {
                    logger.debug(`
Modifying $ {
    channels[i].name
}
`);
                    bot.editChannelPermission(channels[i].id, role.id, 0, 2048, 'role').catch(logError);
                }
                e.execute(msg, words, text);
            } else {
                bu.send(msg, `I created a \`muted\` role, but don't have permissions to configure it! Either configure it yourself, or make sure I have the \`manage channel\` permission, delete the \`muted\` role, and try again.`);
            }
        } else {
            bu.send(msg, `I don't have enough permissions to create a \`muted\` role! Make sure I have the \`manage roles\` permission and try again.`);
        }
        return;
    } else {
        if (!msg.channel.guild.roles.get(mutedrole)) {
            await bu.send(msg, `Couldn't find the muted role! Attempting to regenerate it...`);
            await bu.guildSettings.remove(msg.channel.guild.id, 'mutedrole');
            await e.execute(msg, words, text);
            return;
        }
    }
    if (words.length > 1) {
        if (msg.channel.guild.members.get(bot.user.id).permission.json.manageRoles) {
            let role = msg.guild.roles.get(mutedrole);
            //        if (msg.member.permission.json.manageRoles) {
            if (words[1]) {
                var user = await bu.getUser(msg, words[1]);
                if (!user) {
                    await bu.send(msg, `I couldn't find that user!`);
                    return;
                }
                var member = msg.channel.guild.members.get(user.id);
                if (!member) {
                    await bu.send(msg, `I couldn't find that user!`);
                    return;
                }
                /*
                var botPos = bu.getPosition(msg.channel.guild.members.get(bot.user.id));
                var userPos = bu.getPosition(msg.member);
                var targetPos = role.position;
                if (targetPos >= botPos) {
                    bu.send(msg, `I don't have permission to assign the muted role!\nError: target is higher than me in the role heirarchy.`);
                    return;
                }
                if (targetPos >= userPos) {
                    bu.send(msg, `You don't have permission to assign the muted role!\nError: target is higher than you in the role heirarchy.`);
                    return;
                }
                */
                if (member.roles.indexOf(mutedrole) > -1) {
                    bu.send(msg, 'That user is already muted!');
                } else {

                    var roles = member.roles;
                    roles.push(mutedrole);
                    await bot.editGuildMember(msg.channel.guild.id, user.id, {
                        roles: roles
                    });
                    let input = bu.parseInput(e.flags, words);
                    let reason;
                    if (input.r) reason = input.r.join(' ');
                    bu.logAction(msg.channel.guild, user, msg.author, 'Mute');
                    let suffix = '';
                    if (words[2]) {
                        let duration = bu.parseDuration(input.t.join(' '));
                        if (duration.asMilliseconds() > 0) {
                            await r.table('events').insert({
                                type: 'unmute',
                                user: user.id,
                                guild: msg.guild.id,
                                duration: duration.toJSON(),
                                role: mutedrole,
                                endtime: r.epochTime(moment().add(duration).unix())
                            });
                            suffix = `The user will be unmuted ${duration.humanize(true)}.`;
                        } else {
                            suffix = `The user was muted, but the duration was either 0 seconds or improperly formatted so they won't automatically be unmuted.`;
                        }
                    }
                    bu.send(msg, ':ok_hand: ' + suffix);
                }
            }
        } else {
            bu.send(msg, `I don't have permission to mute users! Make sure I have the \`manage roles\` permission and try again.`);
        }
    }
};

function logError(err) {
    logger.error(err);
}