var e = module.exports = {};
var bu = require('./../util.js');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'mute <user>';
e.info = 'Mutes a user.';
e.category = bu.CommandType.ADMIN;

e.execute = (msg, words, text) => {
    bu.guildSettings.get(msg.channel.guild.id, 'mutedrole').then(mutedrole => {
        if (!mutedrole) {
            if (msg.channel.guild.members.get(bot.user.id).permission.json.manageRoles) {
                bot.createRole(msg.channel.guild.id).then(role => {
                    console.log(role.id);
                    bot.editRole(msg.channel.guild.id, role.id, {
                        color: 16711680,
                        name: 'Muted',
                        permissions: 0
                    });
                    bu.guildSettings.set(msg.channel.guild.id, 'mutedrole', role.id).then(() => {
                        if (msg.channel.guild.members.get(bot.user.id).permission.json.manageChannels) {
                            var channels = msg.channel.guild.channels.map(m => m);
                            console.log(channels.length);
                            for (var i = 0; i < channels.length; i++) {
                                console.log(`Modifying ${channels[i].name}`);
                                bot.editChannelPermission(channels[i].id, role.id, 0, 2048, 'role').catch(logError);
                            }
                            e.execute(msg, words, text);
                        } else {
                            bu.sendMessageToDiscord(msg.channel.id, `I created a \`muted\` role, but don't have permissions to configure it! Either configure it yourself, or make sure I have the \`manage channel\` permission, delete the \`muted\` role, and try again.`);
                        }
                    });
                });
            } else {
                bu.sendMessageToDiscord(msg.channel.id, `I don't have enough permissions to create a \`muted\` role! Make sure I have the \`manage roles\` permission and try again.`);
            }

            return;
        } else {
            if (!msg.channel.guild.roles.get(mutedrole)) {
                bu.guildSettings.remove(msg.channel.guild.id, 'mutedrole').then(() => {
                    e.execute(msg, words, text);
                });
                return;
            }
        }
        if (words.length > 1) {
            if (msg.channel.guild.members.get(bot.user.id).permission.json.manageRoles) {
                if (msg.member.permission.json.manageRoles) {
                    if (words[1]) {
                        var user = bu.getUserFromName(msg, words[1]);
                        var member = msg.channel.guild.members.get(user.id);
                        if (!user)
                            return;

                        var botPos = bu.getPosition(msg.channel.guild.members.get(bot.user.id));
                        var userPos = bu.getPosition(msg.member);
                        var targetPos = bu.getPosition(msg.channel.guild.members.get(user.id));
                        if (targetPos >= botPos) {
                            bu.sendMessageToDiscord(msg.channel.id, `I don't have permission to mute ${user.username}!`);
                            return;
                        }
                        if (targetPos >= userPos) {
                            bu.sendMessageToDiscord(msg.channel.id, `You don't have permission to mute ${user.username}!`);
                            return;
                        }

                        if (member.roles.indexOf(mutedrole) > -1) {
                            bu.sendMessageToDiscord(msg.channel.id, 'That user is already muted!');
                        } else {
                            var roles = member.roles;
                            roles.push(mutedrole);
                            bot.editGuildMember(msg.channel.guild.id, user.id, {
                                roles: roles
                            });
                            bu.logAction(msg.channel.guild, user, msg.author, 'Mute');
                            bu.sendMessageToDiscord(msg.channel.id, ':ok_hand:');
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
                } else {
                    bu.sendMessageToDiscord(msg.channel.id, `You don't have permission to mute users! Make sure you have the \`manage roles\` permission and try again.`);
                }
            } else {
                bu.sendMessageToDiscord(msg.channel.id, `I don't have permission to mute users! Make sure I have the \`manage roles\` permission and try again.`);
            }
        }
    });
};

function logError(err) {
    console.log(err);
}