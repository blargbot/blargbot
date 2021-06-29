const BaseCommand = require('../structures/BaseCommand'),
    bbEngine = require('../structures/bbtag/Engine'),
    bbtag = require('../core/bbtag'),
    snekfetch = require('snekfetch'),
    crypto = require('crypto');
const stringify = BaseCommand.stringify;
const newbutils = require('../newbu');


const subcommands = [
    {
        name: 'author',
        args: '<name>',
        desc: 'Displays the name of the custom command\'s author'
    },
    {
        name: 'cooldown',
        args: '<name> [time]',
        desc: 'Sets the cooldown of a ccommand, in milliseconds. Cooldowns must be greater than 500ms'
    },
    {
        name: 'create',
        args: '<name> <content>',
        desc: 'Creates a ccommand with the given name and content',
        aliases: ['add']
    },
    {
        name: 'debug',
        args: '<name>',
        desc: 'Executes the specified ccommand and sends a file containing all the debug information'
    },
    {
        name: 'delete',
        args: '<name>',
        desc: 'Deletes the ccommand with the given name',
        aliases: ['remove']
    },
    {
        name: 'docs',
        args: '[topic]',
        desc: 'Displays help documentation for BBTag, specific to ccommands'
    },
    {
        name: 'edit',
        args: '<name> <content>',
        desc: 'Edits an existing ccommand with the given content'
    },
    {
        name: 'flag',
        args: '<name> | <add|remove> <name> <flags>',
        desc: 'Retrieves or sets the flags for a custom command.\n'
            + 'Flags are added in the format `-x <name> <desc>`. For example, `-f flag This is a flag!`'
    },
    {
        name: 'hide',
        args: '<name>',
        desc: 'Toggles the visibility of a custom command. Hidden commands cannot be executed directly.'
    },
    {
        name: 'help',
        args: '[command]',
        desc: 'Shows this message'
    },
    {
        name: 'import',
        args: '<tag> [name]',
        desc: 'Imports a tag as a ccommand, retaining all data such as author variables'
    },
    {
        name: 'list',
        args: '',
        desc: 'Displays the list of ccommands on the guild'
    },
    {
        name: 'raw',
        args: '<name>',
        desc: 'Displays the raw code of a ccommand'
    },
    {
        name: 'rename',
        args: '<ccommand1> <ccommand2>',
        desc: 'Renames the ccommand `ccommand1` to `ccommand2`'
    },
    {
        name: 'set',
        args: '<name> <content>',
        desc: 'Provides the functionnality of `create` and `edit` in a single command'
    },
    {
        name: 'sethelp',
        args: '<name> [help text]',
        desc: 'Sets the help message for a custom command'
    },
    {
        name: 'setlang',
        args: '<name> [lang]',
        desc: 'Sets the language to use when returning the raw text of your ccommand'
    },
    {
        name: 'setrole',
        args: '<name> [rolenames...]',
        desc: 'Sets the roles required to execute the ccommand'
    },
    {
        name: 'test',
        args: '<content>',
        desc: 'Uses the BBTag engine to execute the content as it was a ccommand.',
        aliases: ['eval', 'exec', 'vtest']
    }
];

function filterTitle(title) {
    return (title || '').replace(/[^\d\w .,\/#!$%\^&\*;:{}[\]=\-_~()<>]/gi, '').toLowerCase();
}

class CcommandCommand extends BaseCommand {
    constructor() {
        super({
            name: 'ccommand',
            aliases: ['cc'],
            category: newbutils.commandTypes.ADMIN,
            usage: 'ccommand <subcommand>',
            info: 'Creates a custom command, using the BBTag language.\n\n'
                + 'Custom commands take precedent over all other commands. As such, you can use it to overwrite commands, or '
                + 'disable them entirely. If the command content is "null" (without the quotations), blargbot will have no output '
                + 'whatsoever, allowing you to disable any built-in command you wish. You cannot overwrite the \'ccommand\' command. '
                + 'For more in-depth command customization, see the `editcommand` command.\n'
                + '\n**Subcommands:**\n'
                + `${subcommands.map(x => `**${x.name}**`).join(', ')}`
                + '\nFor more information about a subcommand, do `b!cc help <subcommand>`.\n'
                + '\nFor more information about BBTag, visit <https://blargbot.xyz/tags>.'
        });
    }

    async execute(msg, words, text) {
        console.debug('Text:', text);
        if (words[1]) {
            let tag, content, title, lang, result, hidden;
            switch (words[1].toLowerCase()) {
                case 'shrinkwrap': {
                    let output = 'Salutations! You have discovered the super handy ShrinkWrapper9000!\n\nIf you decide to proceed, this will:\n';
                    let storedGuild = await r.table('guild').get(msg.guild.id);
                    let commands = {};
                    let autoresponses = [];
                    let are = null;
                    for (let key of words.slice(2)) {
                        key = key.toLowerCase();
                        let command = storedGuild.ccommands[key];
                        if (command) {
                            delete command.authorizer;
                            delete command.author;
                            delete command.vars;

                            output += ` - Export the custom command \`${key}\`\n`;
                            if (command.managed) {
                                let ar = storedGuild.autoresponse.list.find(a => {
                                    return a.executes === key;
                                });
                                if (ar) {
                                    output += `   - Export the associated autoresponse to \`${ar.term}\`${ar.regex ? ' (regex)' : ''}\n`;
                                    ar.executes = command;
                                    autoresponses.push(ar);
                                } else if (storedGuild.autoresponse.everything.executes === key) {
                                    output += `   - Export the associated everything autoresponse\n`;

                                    are = storedGuild.autoresponse.everything;
                                    are.executes = command;
                                }
                            } else {
                                commands[key] = command;
                            }
                        }
                    }
                    let key = 'thanks, shrinkwrapper!';
                    output += `\nThis will not:\n - Export variables\n - Export authors or authorizers\n - Export depedencies\n\nIf you wish to continue, please say \`${key}\`.`;
                    let response = await bu.awaitQuery(msg, output);
                    if (response.content.toLowerCase() === key) {
                        let res = {
                            cc: commands,
                            ar: autoresponses,
                            are
                        };
                        let resStr = JSON.stringify(res);
                        let hash = crypto.createHmac('sha256', config.general.interface_key).update(resStr).digest('hex');
                        await bu.send(msg, 'No problem, my job here is done.', {
                            file: JSON.stringify({
                                signature: hash,
                                payload: res
                            }, null, 2), name: 'shrinkwrap.json'
                        });
                    } else {
                        await bu.send(msg, 'Maybe next time then.');
                    }
                    break;
                }
                case 'install': {
                    let url;
                    if (msg.attachments.length > 0) {
                        url = msg.attachments[0].url;
                    } else if (words.length > 2) {
                        url = words[2];
                    }
                    if (!url) {
                        return await bu.send('You have to upload the installation file, or give me a URL to one.');
                    }
                    let res;
                    try {
                        res = await snekfetch.get(url);
                    } catch (err) {
                        return await bu.send('Sorry, I had trouble downloading that file. Try again.');
                    }
                    let body = res.body;
                    let signedType = 'signed';
                    if (body.payload && body.signature) {
                        let hash = crypto.createHmac('sha256', config.general.interface_key).update(JSON.stringify(body.payload)).digest('hex');
                        if (hash !== body.signature) signedType = 'invalid';
                        body = body.payload;
                    } else signedType = 'unsigned';
                    if (body.cc === undefined || body.ar === undefined || body.are === undefined) {
                        return await bu.send(msg, 'Your installation file was malformed.');
                    }
                    let output = '';
                    switch (signedType) {
                        case 'unsigned':
                            output += '⚠ **Warning**: This installation file is **unsigned**. It did not come from me. Please double check to make sure you want to go through with this.\n\n';
                            break;
                        case 'invalid':
                            output += '🛑 **Warning**: This installation file\'s signature is **incorrect**. There is a 100% chance that it has been tampered with. Please double check to make sure you want to go through with this.\n\n';
                            break;
                    }
                    output += 'Salutations! You have discovered the super handy CommandInstaller9000!\n\nIf you decide to proceed, this will:\n';
                    let storedGuild = await r.table('guild').get(msg.guild.id);
                    let ccommands = {};
                    for (const key in body.cc) {
                        let command = body.cc[key];
                        if (storedGuild.ccommands[key]) {
                            output += `❌ Ignore the command \`${key}\` as a command with that name already exists\n`;
                        } else {
                            command.author = msg.author.id;
                            delete command.authorizer;
                            delete command.vars;
                            delete command.hidden;
                            delete command.managed;
                            ccommands[key] = command;
                            output += `✅ Import the command \`${key}\`\n`;
                        }
                    }
                    for (const ar of body.ar) {
                        if (storedGuild.autoresponse.list.length >= 20) {
                            output += `❌ Ignore the autoresponse to \`${ar.term}\`${ar.regex ? ' (regex)' : ''} as the limit has been reached.\n`;
                        } else {
                            let key;
                            do {
                                key = `_autoresponse_${storedGuild.autoresponse.index++}`;
                            } while (storedGuild.ccommands[key]);
                            let command = ar.executes;
                            command.author = msg.author.id;
                            delete command.authorizer;
                            delete command.vars;
                            command.hidden = true;
                            command.managed = true;
                            ccommands[key] = command;
                            ar.executes = key;
                            storedGuild.autoresponse.list.push(ar);
                            output += `✅ Import the autoresponse to \`${ar.term}\`${ar.regex ? ' (regex)' : ''}\n`;
                            output += `<${config.discord.emotes.blank}>✅ Import the associated command as \`${key}\`\n`;
                        }
                    }
                    if (body.are) {
                        if (storedGuild.autoresponse.everything) {
                            output += `❌ Ignore everything autoresponse as one already exists\n`;
                        } else {
                            let key;
                            do {
                                key = `_autoresponse_${storedGuild.autoresponse.index++}`;
                            } while (storedGuild.ccommands[key]);
                            let command = body.are.executes;
                            command.author = msg.author.id;
                            delete command.authorizer;
                            delete command.vars;
                            command.hidden = true;
                            command.managed = true;
                            ccommands[key] = command;
                            body.are.executes = key;
                            storedGuild.autoresponse.everything = body.are;
                            output += `✅ Import the autoresponse to everything\n`;
                            output += `<${config.discord.emotes.blank}> ✅ Export the associated command as \`${key}\`\n`;
                        }
                    }
                    let key = 'thanks, commandinstaller!';
                    output += `\nThis will also:\n - Set you as the author for all imported commands\n\nIf you wish to continue, please say \`${key}\`.`;
                    let response = await bu.awaitQuery(msg, output);
                    if (response.content.toLowerCase() === key) {
                        await r.table('guild').get(msg.guild.id).update({
                            ccommands, autoresponse: storedGuild.autoresponse
                        });
                        await bu.send(msg, 'No problem, my job here is done.');
                    } else {
                        await bu.send(msg, 'Maybe next time then.');
                    }
                    break;
                }
                case 'hide':
                    title = filterTitle(words[2]);
                    tag = await bu.ccommand.get(msg.guild.id, title);
                    if (!tag) {
                        bu.send(msg, 'That ccommand doesn\'t exist!');
                        return;
                    }
                    if (tag.managed) {
                        return await bu.send(msg, `❌ You can't hide/unhide a managed ccommand! ❌`);
                    }
                    if (tag && tag.author != msg.author.id) {
                        bu.send(msg, `❌ You don't own this custom command! ❌`);
                        break;
                    }
                    await r.table('guild').get(msg.guild.id).update({
                        ccommands: { [title]: { hidden: !tag.hidden } }
                    });
                    return await bu.send(msg, `✅ The custom command \`${title}\` is now ${tag.hidden ? 'visible' : 'hidden'}. ✅`);
                    break;
                case 'setrole':
                    if (words.length > 2) {
                        title = filterTitle(words[2]);
                        tag = await bu.ccommand.get(msg.guild.id, title);
                        if (!tag) {
                            bu.send(msg, 'That ccommand doesn\'t exist!');
                            return;
                        }
                        let roles = [];
                        if (words[3]) roles = words.slice(3);
                        tag.roles = roles;
                        await bu.ccommand.set(msg.guild.id, title, tag);
                        if (roles.length === 0) {
                            bu.send(msg, `Removed the custom role requirement of '${title}'.`);
                        } else
                            bu.send(msg, `Set the custom role requirements of '${title}' to \`\`\`fix\n${words.slice(3).join(', ')}\n\`\`\` `);
                    } else {
                        bu.send(msg, 'Not enough arguments! Do `help ccommand` for more information.');
                    }
                    break;
                case 'import':
                    if (words.length > 2) {
                        if (!words[3])
                            title = filterTitle(words[2]);
                        else
                            title = filterTitle(words[3]);

                        let existing = await bu.ccommand.get(msg.channel.guild.id, title);
                        if (existing) {
                            bu.send(msg, 'That ccommand already exists!');
                            break;
                        }

                        tag = await r.table('tag').get(words[2]).run();
                        if (tag) {
                            let author = await r.table('user').get(tag.author).run();
                            await bu.ccommand.set(msg.channel.guild.id, title, {
                                alias: tag.name,
                                authorizer: msg.author.id
                            });
                            bu.send(msg, `✅ The tag \`${tag.name}\` by **${author.username}#${author.discriminator}** ` +
                                `has been imported as \`${title}\` and is authorized by **${msg.author.username}#${msg.author.discriminator}**. ✅`);
                        } else {
                            bu.send(msg, `A tag with the name of \`${words[2]}\` could not be found.`);
                        }
                    } else bu.send(msg, `Not enough arguments! Usage is: \`ccommand import <tag> [name]\`.`);

                    break;
                case 'sethelp':
                    if (words.length > 3) {
                        title = filterTitle(words[2]);
                        tag = await bu.ccommand.get(msg.channel.guild.id, title);
                        if (!tag) {
                            bu.send(msg, 'That ccommand doesn\'t exist!');
                            break;
                        }
                        if (tag.managed) {
                            return await bu.send(msg, `❌ You can't set help on a managed ccommand! ❌`);
                        }
                        if (tag.hidden) {
                            return await bu.send(msg, `❌ You can't set help on a hidden ccommand! ❌`);
                        }
                        content = words.slice(3).join(' ');
                        var message = "";
                        if (await bu.ccommand.sethelp(msg.channel.guild.id, title, content)) {
                            message = `✅ Help for custom command \`${title}\` set. ✅`;
                        } else {
                            message = `Custom command \`${title}\` not found. Do \`help\` for a list of all commands, including ccommands`;
                        }
                        bu.send(msg, message);
                    } else if (words.length == 2) {
                        title = filterTitle(words[2]);
                        await bu.ccommand.sethelp(msg.channel.guild.id, title, undefined);
                        bu.send(msg, `✅ Help text for \`${title}\` removed. ✅`);
                    } else {
                        bu.send(msg, `You have to tell me the name of the ccommand!`);
                    }
                    break;
                case 'help':
                    if (words.length > 2) {
                        let command = subcommands.filter(s => {
                            return s.name == words[2].toLowerCase() || (s.aliases || []).includes(words[2].toLowerCase());
                        });
                        if (command.length > 0) {
                            let subcommandHelp = `**Subcommand:** ${command[0].name}\n`;
                            if (command[0].aliases && command[0].aliases.length > 0)
                                subcommandHelp += `**Aliases:** ${(command[0].aliases || []).join(', ')}\n`;
                            if (command[0].args)
                                subcommandHelp += `**Args:** \`${command[0].args}\`\n`;
                            subcommandHelp += `${command[0].desc}`;
                            bu.send(msg, subcommandHelp);
                        } else {
                            bu.send(msg, 'That subcommand was not found!');
                        }
                    } else {
                        bu.send(msg, this.info);
                    }
                    break;
                default:
                    bu.send(msg, 'Improper usage. Do \`help ccommand\` for more details.');
                    break;
            }
        } else {
            bu.send(msg, 'Improper usage. Do \`help ccommand\` for more details.');
        }
    }
}

module.exports = CcommandCommand;
