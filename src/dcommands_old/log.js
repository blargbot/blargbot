const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

var events = [
    'memberban',
    'memberunban',
    'memberjoin',
    'memberleave',
    'messagedelete',
    'messageupdate',
    'nameupdate',
    'avatarupdate',
    'nickupdate'
];

class LogCommand extends BaseCommand {
    constructor() {
        super({
            name: 'log',
            category: newbutils.commandTypes.ADMIN,
            usage: 'log <list | enable <channel> <event name>... | disable <event name>... | ignore <users>... | track <users>...>',
            info: 'Toggles logging for the specified events. Available events are:' +
                '\n- memberban - when a user gets banned' +
                '\n- memberunban - when a user gets unbanned' +
                '\n- memberjoin - when a user joins' +
                '\n- memberleave - when a user leaves' +
                '\n- messagedelete - when a message gets deleted' +
                '\n- messageupdate - when a message gets updated' +
                '\n- nameupdate - when a user changes their username' +
                '\n- avatarupdate - when a user changes their avatar' +
                '\n- nickupdate - when a user changes their nickname' +
                '\n- role:<id> - when a role gets added or removed' +
                '\n- all - enables all of the events' +
                '\n\n`ignore` adds a list of users to ignore from logging. Useful for ignoring bots.' +
                '\n`track` removes users from the ignore list'
        });
    }

    async execute(msg, words, text) {
        let storedGuild = await bu.getGuild(msg.guild.id), args, users;
        if (!storedGuild.hasOwnProperty('log')) storedGuild.log = {};
        if (!storedGuild.hasOwnProperty('logIgnore')) storedGuild.logIgnore = [];
        if (words.length >= 2) {
            switch (words[1].toLowerCase()) {
                case 'list':
                    bu.send(msg, {
                        embed: {
                            fields: [
                                {
                                    name: 'Currently logged events',
                                    value: Object.keys(storedGuild.log).map(key => `**${key}** - <#${storedGuild.log[key]}>`).join('\n')
                                        || 'No events logged',
                                    inline: true
                                },
                                {
                                    name: 'Currently ignored users',
                                    value: storedGuild.logIgnore.map(id => `<@${id}> (${id})`).join('\n')
                                        || 'No ignored users',
                                    inline: true
                                }
                            ]
                        }
                    });
                    break;
                case 'enable':
                    if (words.length >= 3) {
                        let channel;
                        if (msg.channelMentions.length > 0) {
                            channel = msg.channelMentions[0];
                        } else channel = msg.channel.id;
                        if (!msg.guild.channels.get(channel))
                            return await bu.send(msg, 'The channel must be on this guild!');
                        args = words.slice(2);
                        if (args.map(m => m.toLowerCase()).includes('all')) {
                            for (let event of events) {
                                event = event.toLowerCase();
                                if (events.indexOf(event) > -1)
                                    storedGuild.log[event] = channel;
                            }
                        } else
                            for (let event of args) {
                                event = event.toLowerCase();
                                if (events.indexOf(event) > -1 || event.startsWith('role:'))
                                    storedGuild.log[event] = channel;
                            }
                        await r.table('guild').get(msg.channel.guild.id).replace(storedGuild);
                        bu.send(msg, 'Done!');
                    } else {
                        bu.send(msg, `Usage: \`${this.usage}\`\n${this.info}`);
                    }
                    break;
                case 'disable':
                    args = words.slice(2);
                    if (args.map(m => m.toLowerCase()).includes('all'))
                        for (let event of args) {
                            storedGuild.log = {};
                        }
                    else
                        for (let event of args) {
                            delete storedGuild.log[event.toLowerCase()];
                        }
                    await r.table('guild').get(msg.channel.guild.id).update({
                        log: r.literal(storedGuild.log)
                    });
                    bu.send(msg, 'Done!');
                    break;
                case 'ignore':
                    if (words.length >= 3) {
                        args = words.slice(2);
                        if (args.length == 1) {
                            let user = await bu.getUser(msg, args[0]);
                            if (user == null)
                                return;
                            users = [user.id];
                        } else {
                            users = await Promise.all(args.map(async arg => {
                                return {
                                    user: await bu.getUser(msg, arg, { quiet: true, suppress: true }),
                                    input: arg
                                };
                            }));
                            let failed = users.filter(u => u.user == null);
                            if (failed.length > 0) {
                                bu.send(msg, `Unable to find user${failed.length > 1 ? 's' : ''} ${failed.map(f => f.input).join(', ')}`);
                                break;
                            } else {
                                users = users.filter(u => u.user != null).map(u => u.user.id);
                            }
                        }
                        if (users.length == 0) {
                            bu.send(msg, 'No users found');
                        } else {
                            storedGuild.logIgnore.push(...users);
                            storedGuild.logIgnore = [...new Set(storedGuild.logIgnore)];
                            await r.table('guild').get(msg.channel.guild.id).replace(storedGuild);
                            bu.send(msg, 'Done!');
                        }
                    } else {
                        bu.send(msg, `Usage: \`${this.usage}\`\n${this.info}`);
                    }
                    break;
                case 'track':
                    if (words.length >= 3) {
                        args = words.slice(2);
                        if (args.length == 1) {
                            let user = await bu.getUser(msg, args[0]);
                            if (user == null)
                                return;
                            users = [user.id];
                        } else {
                            users = await Promise.all(args.map(async arg => {
                                return {
                                    user: await bu.getUser(msg, arg, { quiet: true, suppress: true }),
                                    input: arg
                                };
                            }));
                            let failed = users.filter(u => u.user == null);
                            if (failed.length > 0) {
                                bu.send(msg, `Unable to find user${failed.length > 1 ? 's' : ''} ${failed.map(f => f.input).join(', ')}`);
                                break;
                            } else {
                                users = users.filter(u => u.user != null).map(u => u.user.id);
                            }
                        }
                        if (users.length == 0) {
                            bu.send(msg, 'No users found');
                        } else {
                            for (const id of users) {
                                let index = storedGuild.logIgnore.indexOf(id);
                                if (index != -1)
                                    storedGuild.logIgnore.splice(index, 1);
                            }
                            await r.table('guild').get(msg.channel.guild.id).replace(storedGuild);
                            bu.send(msg, 'Done!');
                        }
                    } else {
                        bu.send(msg, `Usage: \`${this.usage}\`\n${this.info}`);
                    }
                    break;
                default:
                    bu.send(msg, `Usage: \`${this.usage}\`\n${this.info}`);
                    break;
            }
        } else {
            bu.send(msg, `Usage: \`${this.usage}\`\n${this.info}`);
        }
    }
}

module.exports = LogCommand;
