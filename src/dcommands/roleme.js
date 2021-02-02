const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class RolemeCommand extends BaseCommand {
    constructor() {
        super({
            name: 'roleme',
            category: newbutils.commandTypes.ADMIN,
            usage: 'roleme <list | add | remove | edit>',
            info: 'A roleme is a system to automatically give/remove roles to a user when they say a specific catchphrase. You can make these catchphrases anything you want, case sensitive/insensitive, and only activate in specific channels. The roleme command has three subcommands:\n\n**list**: lists all the rolemes active on the guild.\n**add**: adds a roleme to the guild. Just follow the instructions, or use flags.\n**remove**: returns a list of rolemes so you can choose one to remove.\n**edit**: modifies a roleme using the provided flags',
            flags: [{
                flag: 'a',
                word: 'add',
                desc: 'Add: A list of roles to add in the roleme'
            },
            {
                flag: 'r',
                word: 'remove',
                desc: 'Add: A list of roles to remove in the roleme'
            },
            {
                flag: 'p',
                word: 'phrase',
                desc: 'Add: The phrase to respond to'
            },
            {
                flag: 'C',
                word: 'case',
                desc: 'Add: Whether the phrase is case sensitive'
            },
            {
                flag: 'c',
                word: 'channel',
                desc: 'Add: The channels the roleme should be in'
            },
            {
                flag: 'm',
                word: 'message',
                desc: 'Add: The BBTag-compatible message to output on activation'
            }]
        });
    }

    async execute(msg, words, text) {
        let input = newbutils.parse.flags(this.flags, words);
        if (input.undefined[0]) {
            let storedGuild = await bu.getGuild(msg.guild.id);
            let roleme = storedGuild.roleme;
            let res, rolemeString, rolemeList, condensed = false;
            if (roleme == undefined) roleme = [];
            let addList = [],
                removeList = [],
                channelList = [],
                resList, activationMessage, caseSensitive, outputMessage, query;
            switch (input.undefined[0].toLowerCase()) {
                case 'create':
                case 'add':
                    let perms = msg.member.permission;
                    if (!perms.has('manageRoles') && !perms.has('administrator'))
                        return bu.send(msg, 'You do not have permission to manage roles.');
                    if ((input.a || input.r) && input.p && input.p.length > 0) {
                        if (input.a) {
                            for (let i = 0; i < input.a.length; i++) {
                                let role = await bu.getRole(msg, input.a[i]);
                                if (role)
                                    addList.push(role);
                            }
                        }
                        if (input.r) {
                            for (let i = 0; i < input.r.length; i++) {
                                let role = await bu.getRole(msg, input.r[i]);
                                if (role)
                                    removeList.push(role);
                            }
                        }
                        activationMessage = input.p.join(' ');
                        caseSensitive = input.C !== undefined;
                        if (input.m) {
                            outputMessage = input.m.join(' ');
                        }
                        if (input.c) {
                            for (const part of input.c) {
                                if (/\d{17,23}/.test(part))
                                    channelList.push(part.match(/(\d{17,23})/)[0]);
                            }
                        }

                    } else {
                        res = (await bu.awaitQuery(msg, 'List all the roles that this will add, each on a new line. If you do not wish any roles, type `0`.')).content;
                        if (res != 0) {
                            resList = res.split('\n');
                            for (let i = 0; i < resList.length; i++) {
                                let role = await bu.getRole(msg, resList[i]);
                                if (role)
                                    addList.push(role);
                            }
                        }
                        res = (await bu.awaitQuery(msg, 'List all the roles that this will remove, each on a new line. If you do not wish any roles, type `0`.')).content;
                        if (res != 0) {
                            resList = res.split('\n');
                            for (let i = 0; i < resList.length; i++) {
                                let role = await bu.getRole(msg, resList[i]);
                                if (role)
                                    removeList.push(role);
                            }
                        }
                        if (addList.length == 0 && removeList.length == 0) {
                            await bu.send(msg, 'You must have some roles!');
                            break;
                        }
                        res = (await bu.awaitQuery(msg, 'Mention all the channels that this will apply to (in #<channelname> format). Alternatively, don\'t mention any channels to make it apply everywhere.'));
                        channelList = res.channelMentions;
                        activationMessage = (await bu.awaitQuery(msg, 'Type the sentence that users should type in order for this action to happen.')).content;
                        caseSensitive = (await bu.awaitQuery(msg, 'Type `1` if the previous sentence should be case-sensitive. Type anything else to make it match regardless of capitalization.'));
                        caseSensitive = caseSensitive.content == '1' ? true : false;
                    }
                    // Check role positions
                    let topRole = msg.guild.ownerID == msg.author.id
                        ? Number.MAX_SAFE_INTEGER
                        : Math.max(msg.member.roles.map(id => (msg.guild.roles.get(id) || { position: 0 }).position));
                    if (addList.find(role => role.position >= topRole) || removeList.find(role => role.position >= topRole))
                        return bu.send(msg, 'You cannot add or remove roles higher than your top role');

                    roleme.push({
                        add: addList.map(r => r.id),
                        remove: removeList.map(r => r.id),
                        channels: channelList,
                        message: activationMessage,
                        casesensitive: caseSensitive,
                        output: outputMessage
                    });
                    await r.table('guild').get(msg.channel.guild.id).update({
                        roleme: roleme
                    }).run();
                    bu.send(msg, 'Roleme added!');
                    break;
                case 'remove':
                case 'delete':
                    if (roleme.length == 0) {
                        await bu.send(msg, 'You have no rolemes created!');
                        break;
                    }
                    rolemeString = 'Here are the rolemes on your guild:\n```prolog\n';
                    if (roleme.length >= 30) {
                        rolemeList = roleme.map(m => {
                            return `Message: ${m.message}`;
                        });
                        condensed = true;
                    } else {
                        rolemeList = roleme.map(m => {
                            return `  Message: ${m.message}
  Channel(s): ${m.channels.join(' ')}`;
                        });
                    }
                    for (let i = 0; i < rolemeList.length; i++) {
                        rolemeString += `${i + 1}:${condensed ? ' ' + (i < 9 ? ' ' : '') : '\n'}${rolemeList[i]}\n`;
                    }
                    if (rolemeString.length > 1900) rolemeString = rolemeString.substring(0, 1850) + '...';
                    rolemeString += '```\nPlease type the number of the roleme you wish to remove, or `c` to cancel.';
                    //  console.debug(rolemeString.length, rolemeString);
                    query = await bu.createQuery(msg, rolemeString, m => (!isNaN(parseInt(m.content)) && parseInt(m.content) > 0 && parseInt(m.content) <= rolemeList.length) || m.content.toLowerCase() == 'c');
                    res = await query.response;
                    if (res.content.toLowerCase() == 'c') {
                        await bu.send(msg, 'Remove canceled!');
                        break;
                    }
                    roleme.splice(parseInt(res.content) - 1, 1);
                    storedGuild.roleme = roleme;
                    await r.table('guild').get(msg.channel.guild.id).replace(storedGuild).run();
                    await bot.deleteMessage(query.prompt.channel.id, query.prompt.id);
                    await bu.send(msg, 'Done! :ok_hand:');
                    break;
                case 'edit':
                    if (roleme.length == 0) {
                        await bu.send(msg, 'You have no rolemes created!');
                        break;
                    }
                    rolemeString = 'Here are the rolemes on your guild:\n```prolog\n';
                    if (roleme.length >= 30) {
                        rolemeList = roleme.map(m => {
                            return `Message: ${m.message}`;
                        });
                        condensed = true;
                    } else {
                        rolemeList = roleme.map(m => {
                            return `  Message: ${m.message}
  Channel(s): ${m.channels.join(' ')}`;
                        });
                    }
                    for (let i = 0; i < rolemeList.length; i++) {
                        rolemeString += `${i + 1}:${condensed ? ' ' + (i < 9 ? ' ' : '') : '\n'}${rolemeList[i]}\n`;
                    }
                    if (rolemeString.length > 1900) rolemeString = rolemeString.substring(0, 1850) + '...';
                    rolemeString += '```\nPlease type the number of the roleme you wish to edit, or `c` to cancel.';
                    //  console.debug(rolemeString.length, rolemeString);
                    query = await bu.createQuery(msg, rolemeString, m => (!isNaN(parseInt(m.content)) && parseInt(m.content) > 0 && parseInt(m.content) <= rolemeList.length) || m.content.toLowerCase() == 'c');
                    res = await query.response;
                    if (res.content.toLowerCase() == 'c') {
                        await bu.send(msg, 'Edit canceled!');
                        break;
                    }
                    await bot.deleteMessage(query.prompt.channel.id, query.prompt.id);
                    let index = parseInt(res.content) - 1;

                    if (input.a) {
                        for (let i = 0; i < input.a.length; i++) {
                            let role = await bu.getRole(msg, input.a[i]);
                            if (role)
                                addList.push(role.id);
                        }
                        roleme[index].add = addList;
                    }
                    if (input.r) {
                        for (let i = 0; i < input.r.length; i++) {
                            let role = await bu.getRole(msg, input.r[i]);
                            if (role)
                                removeList.push(role.id);
                        }
                        roleme[index].remove = removeList;
                    }
                    if (input.p && input.p.length > 0) {
                        activationMessage = input.p.join(' ');
                        roleme[index].message = activationMessage;
                    }
                    if (input.C) {
                        caseSensitive = input.C !== undefined;
                        roleme[index].casesensitive = caseSensitive;
                    }
                    if (input.c) {
                        for (const part of input.c) {
                            if (/\d{17,23}/.test(part))
                                channelList.push(part.match(/(\d{17,23})/)[0]);
                        }
                        roleme[index].channels = channelList;
                    }
                    if (input.m) {
                        outputMessage = input.m.join(' ');
                        roleme[index].output = outputMessage;
                    }

                    storedGuild.roleme = roleme;
                    await r.table('guild').get(msg.channel.guild.id).replace(storedGuild).run();

                    await bu.send(msg, 'Done! :ok_hand:');
                    break;
                case 'list':
                    if (roleme.length == 0) {
                        await bu.send(msg, 'You have no rolemes created!');
                        break;
                    }
                    rolemeString = 'Here are the rolemes on your guild:\n```prolog\n';
                    if (roleme.length >= 30) {
                        rolemeList = roleme.map(m => {
                            return `Message: ${m.message}`;
                        });
                        condensed = true;
                    } else {
                        rolemeList = roleme.map(m => {
                            return `  Message: ${m.message}
  Channel(s): ${m.channels.join(' ')}`;
                        });
                    }
                    for (let i = 0; i < rolemeList.length; i++) {
                        rolemeString += `${i + 1}:${condensed ? ' ' + (i < 9 ? ' ' : '') : '\n'}${rolemeList[i]}\n`;
                    }
                    if (rolemeString.length > 2000) rolemeString = rolemeString.substring(0, 1994) + '...';
                    rolemeString += '```';
                    bu.send(msg, rolemeString);
                    break;
                default:
                    bu.send(msg, this.info);
                    break;
            }
        } else {
            bu.send(msg, this.info);
        }
    }
}

module.exports = RolemeCommand;
