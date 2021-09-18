const BaseCommand = require('../structures/BaseCommand');

class CensorCommand extends BaseCommand {
    constructor() {
        super({
            name: 'censor',
            category: bu.CommandType.ADMIN,
            usage: 'censor help',
            info: 'Creates message censorships.\nCommands:\n   ADD <text> [flags] - Adds a censor with for the provided text.\n   EDIT [text] [flags] - Brings up a menu to edit a censor where `text` can be the new trigger phrase\n   REMOVE - Brings up a menu to remove a censor\n   EXCEPTION <add | remove> [flags] - Adds or removes an exception.\n   RULE [flags] - Sets the censorship rules.\n   INFO - Displays information about censors.',
            flags: [{
                flag: 'R',
                word: 'regex',
                desc: 'Add/Edit: If specified, parse as /regex/ rather than plaintext. Unsafe and very long (more than 2000 characters) regexes will not parse successfully.'
            },
            {
                flag: 'w',
                word: 'weight',
                desc: 'Add/Edit: How many incidents the censor is worth.'
            },
            {
                flag: 'r',
                word: 'reason',
                desc: 'Add/Edit: A custom modlog reason. NOT BBTag compatible.'
            },
            {
                flag: 'd',
                word: 'deletemessage',
                desc: 'Add/Rule/Edit: The BBTag-compatible message to send after a message is deleted. Adds override rules.'
            },
            {
                flag: 'k',
                word: 'kickmessage',
                desc: 'Add/Rule/Edit: The BBTag-compatible message to send after a user is kicked. Adds override rules.'
            },
            {
                flag: 'b',
                word: 'banmessage',
                desc: 'Add/Rule/Edit: The BBTag-compatible message to send after a user is banned. Adds override rules.'
            },
            {
                flag: 'u',
                word: 'users',
                desc: 'Exception: A list of users that are exempt from censorship.'
            },
            {
                flag: 'r',
                word: 'roles',
                desc: 'Exception: A list of roles that are exempt from censorship.'
            },
            {
                flag: 'c',
                word: 'channels',
                desc: 'Exception: A list of channels that are exempt from censorship.'
            }]
        });
    }

    async execute(msg, words, text) {
        let input = bu.parseInput(this.flags, words, true);
        if (!msg.guild) return;
        if (input.undefined.length == 0) {
            input.undefined[0] = '';
        }
        let storedGuild = await bu.getGuild(msg.guild.id);

        async function saveGuild() {
            await r.table('guild').get(msg.guild.id).update({
                censor: r.literal(storedGuild.censor)
            });
        }
        if (!storedGuild.censor) storedGuild.censor = {
            list: [],
            exception: {
                user: [],
                role: [],
                channel: []
            },
            rule: {},
            cases: {}
        };
        let changes = 0;
        let censorList, suffix, response, addCensor, term, messages;
        switch (input.undefined[0].toLowerCase()) {
            case 'create':
            case 'add':
                if (!storedGuild.censor.list) storedGuild.censor.list = [];
                addCensor = {
                    weight: 1
                };
                term = input.undefined.slice(1).join(' ');
                if (term == '') {
                    bu.send(msg, `You can't censor nothing!`);
                    return;
                }
                if (input.R) {
                    try {
                        bu.createRegExp(term);
                        addCensor.regex = true;
                    } catch (err) {
                        bu.send(msg, 'Unsafe or invalid regex! Terminating.');
                        return;
                    }
                } else addCensor.regex = false;
                addCensor.term = term;
                messages = [];
                if (input.d && input.d.length > 0) {
                    addCensor.deleteMessage = input.d.join(' ');
                    messages.push('delete');
                }
                if (input.k && input.k.length > 0) {
                    addCensor.kickMessage = input.k.join(' ');
                    messages.push('kick');
                }
                if (input.b && input.b.length > 0) {
                    addCensor.banMessage = input.b.join(' ');
                    messages.push('ban');
                }
                if (input.w && input.w.length > 0 && !isNaN(parseInt(input.w[0]))) {
                    addCensor.weight = parseInt(input.w[0]);
                }
                if (input.r && input.r.length > 0) {
                    addCensor.reason = input.r.join(' ');
                }
                storedGuild.censor.list.push(addCensor);
                await saveGuild();
                bu.send(msg, `Censor created!
**Trigger**: ${addCensor.term}
**Regex**: ${addCensor.regex}
**Messages**: ${messages.join(', ')}
**Weight**: ${addCensor.weight}
**Reason**: ${addCensor.reason || 'Default'}`);
                break;
            case 'edit':
                if (!storedGuild.censor.list || storedGuild.censor.list.length == 0) {
                    bu.send(msg, `There are no censors on this guild!`);
                    return;
                }
                censorList = "Existing censors:\n```prolog\n";
                suffix = "```\nPlease type the number of the censor you wish to view, or type 'c' to cancel. This prompt will expire in 5 minutes.";
                for (let i = 0; i < storedGuild.censor.list.length; i++) {
                    let phrase = `${i + 1}. ${storedGuild.censor.list[i].term}${storedGuild.censor.list[i].regex ? ' (regex)' : ''}\n`;
                    if (censorList.length + phrase.length + suffix.length > 1500) {
                        censorList += `...and ${storedGuild.censor.list.length - i} more.\n`;
                    } else {
                        censorList += phrase;
                    }
                }
                censorList += suffix;
                response = await bu.awaitQuery(msg, censorList, m => {
                    if (m.content.toLowerCase() == 'c') return true;
                    let choice = parseInt(m.content);
                    return !isNaN(choice) && choice > 0 && choice <= storedGuild.censor.list.length;
                });
                if (response.content.toLowerCase() == 'c') {
                    bu.send(msg, 'Query canceled.');
                    return;
                }
                let index = parseInt(response.content) - 1;
                addCensor = storedGuild.censor.list[index];
                term = input.undefined.slice(1).join(' ') || addCensor.term;

                if (input.R) {
                    try {
                        bu.createRegExp(term);
                        addCensor.regex = true;
                    } catch (err) {
                        bu.send(msg, 'Unsafe or invalid regex! Terminating.');
                        return;
                    }
                } else addCensor.regex = false;
                if (term != '')
                    addCensor.term = term;
                messages = [];
                if (input.d && input.d.length > 0) {
                    addCensor.deleteMessage = input.d.join(' ');
                    messages.push('delete');
                }
                if (input.k && input.k.length > 0) {
                    addCensor.kickMessage = input.k.join(' ');
                    messages.push('kick');
                }
                if (input.b && input.b.length > 0) {
                    addCensor.banMessage = input.b.join(' ');
                    messages.push('ban');
                }
                if (input.w && input.w.length > 0 && !isNaN(parseInt(input.w[0]))) {
                    addCensor.weight = parseInt(input.w[0]);
                }
                if (input.r && input.r.length > 0) {
                    addCensor.reason = input.r.join(' ');
                }
                storedGuild.censor.list[index] = addCensor;
                await saveGuild();
                bu.send(msg, `Censor edited!
**Trigger**: ${addCensor.term}
**Regex**: ${addCensor.regex}
**Messages**: ${messages.join(', ')}
**Weight**: ${addCensor.weight}
**Reason**: ${addCensor.reason || 'Default'}`);
                break;
            case 'delete':
            case 'remove':
                if (!storedGuild.censor.list || storedGuild.censor.list.length == 0) {
                    bu.send(msg, `There are no censors on this guild!`);
                    return;
                }
                censorList = "Existing censors:\n```prolog\n";
                suffix = "```\nPlease type the number of the censor you wish to remove, or type 'c' to cancel. This prompt will expire in 5 minutes.";
                for (let i = 0; i < storedGuild.censor.list.length; i++) {
                    let phrase = `${i + 1}. ${storedGuild.censor.list[i].term}${storedGuild.censor.list[i].regex ? ' (regex)' : ''}\n`;
                    if (censorList.length + phrase.length + suffix.length > 1500) {
                        censorList += `...and ${storedGuild.censor.list.length - i} more.\n`;
                        break;
                    } else {
                        censorList += phrase;
                    }
                }
                censorList += suffix;
                response = await bu.awaitQuery(msg, censorList, m => {
                    if (m.content.toLowerCase() == 'c') return true;
                    let choice = parseInt(m.content);
                    return !isNaN(choice) && choice > 0 && choice <= storedGuild.censor.list.length;
                });
                if (response.content.toLowerCase() == 'c') {
                    bu.send(msg, 'Query canceled.');
                    return;
                }
                let removed = storedGuild.censor.list.splice(parseInt(response.content) - 1, 1);
                await saveGuild();
                bu.send(msg, `Censor \`${removed[0].term}\` removed!`);
                break;
            case 'exceptions':
            case 'exception':
                if (!storedGuild.censor.exception) storedGuild.censor.exception = {
                    user: [],
                    role: [],
                    channel: []
                };
                let userList = [];
                let roleList = [];
                let channelList = [];
                if (input.u && input.u.length > 0) {
                    for (const name of input.u) {
                        let user = await bu.getUser(msg, name);
                        if (user) userList.push(user.id);
                    }
                }
                if (input.r && input.r.length > 0) {
                    for (const name of input.r) {
                        let role = await bu.getRole(msg, name);
                        if (role) roleList.push(role.id);
                    }
                }
                if (input.c && input.c.length > 0) {
                    for (const name of input.c) {
                        if (/(\d+)/.test(name)) {
                            let channel = name.match(/(\d+)/)[1];
                            let guild = bot.channelGuildMap[channel];
                            if (guild == msg.guild.id) channelList.push(channel);
                        }
                    }
                }
                console.debug(userList, roleList, channelList);
                if (input.undefined[1]) {
                    switch (input.undefined[1].toLowerCase()) {
                        case 'delete':
                        case 'remove':
                            for (const id of userList) {
                                let index = storedGuild.censor.exception.user.indexOf(id);
                                if (index > -1) {
                                    storedGuild.censor.exception.user.splice(index, 1);
                                    changes++;
                                }
                            }
                            for (const id of roleList) {
                                let index = storedGuild.censor.exception.role.indexOf(id);
                                if (index > -1) {
                                    storedGuild.censor.exception.role.splice(index, 1);
                                    changes++;
                                }
                            }
                            for (const id of channelList) {
                                let index = storedGuild.censor.exception.channel.indexOf(id);
                                if (index > -1) {
                                    storedGuild.censor.exception.channel.splice(index, 1);
                                    changes++;
                                }
                            }
                            await saveGuild();
                            bu.send(msg, `${changes} exceptions removed.`);
                            break;
                        case 'create':
                        case 'add':
                        default:
                            for (const id of userList) {
                                if (!storedGuild.censor.exception.user.includes(id)) {
                                    storedGuild.censor.exception.user.push(id);
                                    changes++;
                                }
                            }
                            for (const id of roleList) {
                                if (!storedGuild.censor.exception.role.includes(id)) {
                                    storedGuild.censor.exception.role.push(id);
                                    changes++;
                                }
                            }
                            for (const id of channelList) {
                                if (!storedGuild.censor.exception.channel.includes(id)) {
                                    storedGuild.censor.exception.channel.push(id);
                                    changes++;
                                }
                            }
                            await saveGuild();
                            bu.send(msg, `${changes} exceptions created.`);
                            break;
                    }
                }
                break;
            case 'rules':
            case 'rule':
                if (!storedGuild.censor.rule) storedGuild.censor.rule = {};
                if (input.k && input.k.length > 0) {
                    storedGuild.censor.rule.kickMessage = input.k.join(' ');
                    changes++;
                }
                if (input.d && input.d.length > 0) {
                    storedGuild.censor.rule.deleteMessage = input.d.join(' ');
                    changes++;
                }
                if (input.b && input.b.length > 0) {
                    storedGuild.censor.rule.banMessage = input.b.join(' ');
                    changes++;
                }
                if (input.K && input.K.length > 0 && !isNaN(parseInt(input.K[0]))) {
                    storedGuild.censor.rule.kickAt = parseInt(input.K[0]);
                    changes++;
                }
                if (input.K && input.B.length > 0 && !isNaN(parseInt(input.B[0]))) {
                    storedGuild.censor.rule.banAt = parseInt(input.B[0]);
                    changes++;
                }
                await saveGuild();
                bu.send(msg, `Updated ${changes} rules.`);
                break;
            case 'info':
                if (!storedGuild.censor.list || storedGuild.censor.list.length == 0) {
                    bu.send(msg, `There are no censors on this guild!`);
                    return;
                }
                censorList = "Existing censors:\n```prolog\n";
                suffix = "```\nPlease type the number of the censor you wish to view, or type 'c' to cancel. This prompt will expire in 5 minutes.";
                for (let i = 0; i < storedGuild.censor.list.length; i++) {
                    let phrase = `${i + 1}. ${storedGuild.censor.list[i].term}${storedGuild.censor.list[i].regex ? ' (regex)' : ''}\n`;
                    if (censorList.length + phrase.length + suffix.length > 3500) {
                        censorList += `...and ${storedGuild.censor.list.length - i} more.\n`;
                        break;
                    } else {
                        censorList += phrase;
                    }
                }
                censorList += suffix;
                response = await bu.awaitQuery(msg, censorList, m => {
                    if (m.content.toLowerCase() == 'c') return true;
                    let choice = parseInt(m.content);
                    return !isNaN(choice) && choice > 0 && choice <= storedGuild.censor.list.length;
                });
                if (response.content.toLowerCase() == 'c') {
                    bu.send(msg, 'Query canceled.');
                    return;
                }
                let censor = storedGuild.censor.list[parseInt(response.content) - 1];
                let triggeredMessages = [];
                if (censor.deleteMessage) triggeredMessages.push('**Delete Message**: ' + censor.deleteMessage);
                if (censor.kickMessage) triggeredMessages.push('**Kick Message**: ' + censor.kickMessage);
                if (censor.banMessage) triggeredMessages.push('**Ban Message**: ' + censor.banMessage);
                bu.send(msg, `Censor Details:
**Trigger**: ${censor.term}
**Regex**: ${censor.regex}${triggeredMessages.length > 0 ? '\n' + triggeredMessages.join('\n') : ''}
**Weight**: ${censor.weight}
**Reason**: ${censor.reason || 'Default'}`);
                break;
            default:
                let output = `There are currently ${storedGuild.censor.list.length} censors active.
**__Exceptions__**
User Exceptions: ${storedGuild.censor.exception.user.map(u => {
                        let user = bot.users.get(u);
                        if (user) return bu.getFullName(user);
                        else return u;
                    }).join(', ')}
Role Exceptions: ${storedGuild.censor.exception.role.map(r => {
                        let role = msg.guild.roles.get(r);
                        if (role) return role.name;
                        else return r;
                    }).join(', ')}
Channel Exceptions: ${storedGuild.censor.exception.channel.map(c => `<#${c}>`).join(', ')}

**__Settings__**
Kick At: ${storedGuild.settings.kickat || 'Not set'}
Ban At: ${storedGuild.settings.banat || 'Not set'}
Delete Message: ${storedGuild.censor.rule.deleteMessage || 'Default'}
Kick Message: ${storedGuild.censor.rule.kickMessage || 'Default'}
Ban Message: ${storedGuild.censor.rule.banMessage || 'Default'}
`;
                bu.send(msg, output);
                break;
        }
    }
}

module.exports = CensorCommand;
