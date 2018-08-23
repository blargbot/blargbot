const BaseCommand = require('../structures/BaseCommand'),
    bbEngine = require('../structures/bbtag/Engine'),
    bbtag = require('../core/bbtag'),
    snekfetch = require('snekfetch');

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
        name: 'help',
        args: '',
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
        aliases: ['eval', 'exec']
    }
];

function filterTitle(title) {
    return title.replace(/[^\d\w .,\/#!$%\^&\*;:{}[\]=\-_~()<>]/gi, '');
}

class CcommandCommand extends BaseCommand {
    constructor() {
        super({
            name: 'ccommand',
            aliases: ['cc'],
            category: bu.CommandType.ADMIN,
            usage: 'ccommand <subcommand>',
            info: 'Creates a custom command, using the BBTag language.\n\n'
                + 'Custom commands take precedent over all other commands. As such, you can use it to overwrite commands, or '
                + 'disable them entirely. If the command content is "null" (without the quotations), blargbot will have no output '
                + 'whatsoever, allowing you to disable any built-in command you wish. You cannot overwrite the \'ccommand\' command. '
                + 'For more in-depth command customization, see the `editcommand` command.\n'
                + '\n**Subcommands:**\n'
                + `${subcommands.map(x => `**${x.name}**`).join(', ')}`
                + '\nFor more information about a subcommand, do `b!cc help <subcommand>.`\n'
                + '\nFor more information about BBTag, visit <https://blargbot.xyz/tags>.'
        });
    }

    async execute(msg, words, text) {
        console.debug('Text:', text);
        if (words[1]) {
            let tag, content, title, lang, result;
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
                            if (command.hidden) {
                                let ar = storedGuild.autoresponse.list.find(a => {
                                    return a.executes === key;
                                });
                                if (ar) {
                                    output += `   - Export the associated autoresponse to \`${ar.term}\`${ar.regex ? ' (regex)' : ''}\n`
                                    ar.executes = command;
                                    autoresponses.push(ar);
                                } else if (storedGuild.autoresponse.everything.executes === key) {
                                    output += `   - Export the associated everything autoresponse\n`

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
                        }
                        await bu.send(msg, 'No problem, my job here is done.', { file: JSON.stringify(res), name: 'shrinkwrap.json' });
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
                    let output = 'Salutations! You have discovered the super handy CommandInstaller9000!\n\nIf you decide to proceed, this will:\n';
                    let storedGuild = await r.table('guild').get(msg.guild.id);
                    let ccommands = {};
                    for (const key in res.body.cc) {
                        let command = res.body.cc[key];
                        if (storedGuild.ccommands[key]) {
                            output += `❌ Ignore the command \`${key}\` as a command with that name already exists\n`
                        } else {
                            command.author = msg.author.id;
                            delete command.authorizer;
                            delete command.vars;
                            delete command.hidden;
                            ccommands[key] = command;
                            output += `✅ Import the command \`${key}\`\n`
                        }
                    }
                    for (const ar of res.body.ar) {
                        if (storedGuild.autoresponse.list.length >= 20) {
                            output += `❌ Ignore the autoresponse to \`${ar.term}\`${ar.regex ? ' (regex)' : ''} as the limit has been reached.\n`
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
                            ccommands[key] = command;
                            ar.executes = key;
                            storedGuild.autoresponse.list.push(ar);
                            output += `✅ Import the autoresponse to \`${ar.term}\`${ar.regex ? ' (regex)' : ''}\n`;
                            output += `<:blank:275482460358180865> ✅ Export the associated command as \`${key}\`\n`;
                        }
                    }
                    if (res.body.are) {
                        if (storedGuild.autoresponse.everything) {
                            output += `❌ Ignore everything autoresponse as one already exists\n`
                        } else {
                            let key;
                            do {
                                key = `_autoresponse_${storedGuild.autoresponse.index++}`;
                            } while (storedGuild.ccommands[key]);
                            let command = res.body.are.executes;
                            command.author = msg.author.id;
                            delete command.authorizer;
                            delete command.vars;
                            command.hidden = true;
                            ccommands[key] = command;
                            res.body.are.executes = key;
                            storedGuild.autoresponse.everything = res.body.are;
                            output += `✅ Import the autoresponse to everything\n`;
                            output += `<:blank:275482460358180865> ✅ Export the associated command as \`${key}\`\n`;
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
                case 'cooldown':
                    title = filterTitle(words[2]);
                    let cooldown;
                    if (words[3]) {
                        cooldown = parseInt(words[3]);
                        if (isNaN(cooldown)) {
                            bu.send(msg, `❌ The cooldown must be a valid integer (in milliseconds)! ❌`);
                            break;
                        }
                        if (cooldown < 0) {
                            bu.send(msg, `❌ The cooldown must be greater than 0ms! ❌`);
                            break;
                        }
                    }
                    tag = await bu.ccommand.get(msg.guild.id, title);
                    if (!tag) {
                        bu.send(msg, `❌ That custom command doesn't exist! ❌`);
                        break;
                    }
                    if (tag.hidden) {
                        return await bu.send(msg, `❌ You can't put a cooldown on a hidden ccommand! ❌`);
                    }
                    if (tag && tag.author != msg.author.id) {
                        bu.send(msg, `❌ You don't own this custom command! ❌`);
                        break;
                    }
                    await r.table('guild').get(msg.guild.id).update({
                        ccommands: { [title]: { cooldown: r.literal(cooldown) } }
                    });
                    bu.send(msg, `✅ The cooldown for Custom Command \`${title}\` has been set to \`${cooldown || 0}ms\`. ✅`);
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
                case 'add':
                case 'create':
                    if (words.length > 3) {
                        title = filterTitle(words[2]);
                        if (title == 'cc' || title == 'ccommand') {
                            bu.send(msg, 'You cannot overwrite the `ccommand` command!');
                            break;
                        }
                        tag = await bu.ccommand.get(msg.channel.guild.id, title);
                        if (tag) {
                            bu.send(msg, 'That ccommand already exists!');
                            break;
                        }
                        content = bu.splitInput(text, true).slice(3).join(' ');
                        await bu.ccommand.set(msg.channel.guild.id, title, {
                            content,
                            author: msg.author.id,
                            authorizer: msg.author.id
                        });
                        result = bbtag.addAnalysis(content, `✅ Custom command \`${title}\` created. ✅`);
                        bu.send(msg, result);
                    } else {
                        bu.send(msg, 'Not enough arguments! Do `help ccommand` for more information.');
                    }
                    break;
                case 'flag':
                    let input = bu.parseInput([], words);
                    if (input.undefined.length >= 3) {
                        let title = filterTitle(input.undefined[2]);
                        tag = await bu.ccommand.get(msg.guild.id, title);
                        if (!tag) {
                            bu.send(msg, `❌ That custom command doesn't exist! ❌`);
                            break;
                        }
                        if (tag.hidden) {
                            return await bu.send(msg, `❌ You can't put flags on a hidden ccommand! ❌`);
                        }
                        if (tag.alias) {
                            bu.send(msg, 'That ccommand is imported, and cannot be edited.');
                            break;
                        }
                        if (!Array.isArray(tag.flags))
                            tag.flags = [];
                        switch (input.undefined[1].toLowerCase()) {
                            case 'add':
                            case 'create':
                                for (const key in input) {
                                    if (key !== 'undefined') {
                                        if (!input[key][0]) {
                                            bu.send(msg, 'No word was specified for flag `' + key + '`');
                                            return;
                                        }
                                        let word = (input[key][0]).replace(/[^a-z]/g, '').toLowerCase();
                                        if (tag.flags.filter(f => f.word === word).length > 0)
                                            return bu.send(msg, `A flag with the word \`${word}\` has already been specified.`);
                                        let desc = input[key].slice(1).join(' ').replace(/\n/g, ' ');
                                        tag.flags.push({ flag: key, word, desc });
                                    }
                                }
                                await bu.ccommand.set(msg.guild.id, title, tag);
                                bu.send(msg, 'The flags have been modified.');
                                break;
                            case 'remove':
                            case 'delete':
                                let keys = Object.keys(input).filter(k => k !== 'undefined');
                                tag.flags = tag.flags.filter(f => !keys.includes(f.flag));
                                await bu.ccommand.set(msg.guild.id, title, tag);
                                bu.send(msg, 'The flags have been modified.');
                                break;
                            default:
                                bu.send(msg, 'Usage: `cc flag add|delete [flags]`');
                                break;
                        }
                    } else if (input.undefined.length === 2) {
                        let title = filterTitle(input.undefined[1]);
                        tag = await bu.ccommand.get(msg.guild.id, title);
                        if (!tag) {
                            bu.send(msg, `❌ That custom command doesn't exist! ❌`);
                            break;
                        }
                        if (Array.isArray(tag.flags) && tag.flags.length > 0) {
                            let out = 'Here are the flags for that custom command:\n\n';
                            for (const flag of tag.flags) {
                                out += `  \`-${flag.flag}\`/\`--${flag.word}\`: ${flag.desc || 'No description.'}\n `;
                            }
                            bu.send(msg, out);
                        } else {
                            bu.send(msg, 'That custom command has no flags.');
                        }
                    }
                    break;
                case 'edit':
                    if (words.length > 3) {
                        title = filterTitle(words[2]);
                        tag = await bu.ccommand.get(msg.channel.guild.id, title);
                        if (!tag) {
                            bu.send(msg, 'That ccommand doesn\'t exist!');
                            break;
                        }
                        if (tag.alias) {
                            bu.send(msg, 'That ccommand is imported, and cannot be edited.');
                            break;
                        }
                        content = bu.splitInput(text, true).slice(3).join(' ');
                        await bu.ccommand.set(msg.channel.guild.id, title, {
                            content,
                            author: msg.author.id,
                            authorizer: (tag ? tag.authorizer : undefined) || msg.author.id,
                            lang: tag.lang
                        });
                        result = bbtag.addAnalysis(content, `✅ Custom command \`${title}\` edited. ✅`);
                        bu.send(msg, result);
                    } else {
                        bu.send(msg, 'Not enough arguments! Do `help ccommand` for more information.');
                    }
                    break;
                case 'set':
                    if (words.length > 3) {
                        title = filterTitle(words[2]);
                        if (title == 'cc' || title == 'ccommand') {
                            bu.send(msg, 'You cannot overwrite the `ccommand` command!');
                            break;
                        }
                        content = bu.splitInput(text, true).slice(3).join(' ');
                        tag = await bu.ccommand.get(msg.channel.guild.id, title);
                        await bu.ccommand.set(msg.channel.guild.id, title, {
                            content,
                            author: msg.author.id,
                            authorizer: (tag ? tag.authorizer : undefined) || msg.author.id
                        });
                        result = bbtag.addAnalysis(content, `✅ Custom command \`${title}\` set. ✅`);
                        bu.send(msg, result);
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
                case 'remove':
                case 'delete':
                    if (words.length > 2) {
                        title = filterTitle(words[2]);
                        tag = await bu.ccommand.get(msg.channel.guild.id, title);
                        if (!tag) {
                            bu.send(msg, 'That ccommand doesn\'t exist!');
                            break;
                        }
                        if (tag.hidden) {
                            return await bu.send(msg, `❌ You can't delete a hidden ccommand! Delete it from the autoresponse command instead. ❌`);
                        }
                        await bu.ccommand.remove(msg.channel.guild.id, title);
                        bu.send(msg, `✅ Custom command \`${title}\` deleted. ✅`);
                    } else {
                        bu.send(msg, 'Not enough arguments! Do `help ccommand` for more information.');
                    }
                    break;
                case 'rename':
                    if (words.length > 3) {
                        title = words[2];
                        tag = await bu.ccommand.get(msg.channel.guild.id, title);
                        if (!tag) {
                            title = filterTitle(words[2]);
                            tag = await bu.ccommand.get(msg.channel.guild.id, title);
                            if (!tag) {
                                bu.send(msg, `The ccommand ${title} doesn\'t exist!`);
                                break;
                            }
                        }
                        if (tag.hidden) {
                            return await bu.send(msg, `❌ You can't rename a hidden ccommand! ❌`);
                        }
                        let newTitle = filterTitle(words[3]);
                        let newTag = await bu.ccommand.get(msg.channel.guild.id, newTitle);
                        if (newTag) {
                            bu.send(msg, `The ccommand ${newTitle} already exists!`);
                        }
                        await bu.ccommand.rename(msg.channel.guild.id, title, newTitle);
                        bu.send(msg, `✅ Custom command \`${title}\` renamed. ✅`);
                    } else {
                        bu.send(msg, 'Not enough arguments! Do `help ccommand` for more information.');
                    }
                    break;
                case 'raw':
                    if (words.length > 2) {
                        title = filterTitle(words[2]);
                        tag = await bu.ccommand.get(msg.channel.guild.id, title);
                        if (!tag) {
                            bu.send(msg, 'That ccommand doesn\'t exist!');
                            break;
                        }
                        if (tag.alias) {
                            bu.send(msg, `That ccommand is imported. The raw source is available from the \`${tag.alias}\` tag.`);
                            break;
                        }
                        lang = tag.lang || '';
                        if (typeof tag === 'string') tag = { content: tag };
                        content = `The raw code for ${title} is\`\`\`${lang}\n${tag.content}\n\`\`\``;
                        if (content.length > 2000 || tag.content.match(/`{3}/g)) {
                            bu.send(msg, `The raw code for ${title} is attached`, {
                                name: title + '.bbtag',
                                file: tag.content
                            });
                        } else {
                            bu.send(msg, content);
                        }
                    } else {
                        bu.send(msg, 'Not enough arguments! Do `help ccommand` for more information.');
                    }
                    break;
                case 'list':
                    let storedGuild = await bu.getGuild(msg.guild.id);
                    let ccommands = Object.keys(storedGuild.ccommands);
                    let output = (ccommands && ccommands.length > 0)
                        ? `Here are a list of the custom commands on this guild:\`\`\`${ccommands.join(', ')}\`\`\` `
                        : `There are no custom commands on this guild.`;
                    bu.send(msg, output);
                case 'sethelp':
                    if (words.length > 3) {
                        title = filterTitle(words[2]);
                        tag = await bu.ccommand.get(msg.channel.guild.id, title);
                        if (!tag) {
                            bu.send(msg, 'That ccommand doesn\'t exist!');
                            break;
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
                            return s.name == words[2].toLowerCase() || s.aliases.includes(words[2].toLowerCase());
                        });
                        if (command.length > 0) {
                            await bu.send(msg, `Subcommand: **${command[0].name}**
Aliases: **${command[0].aliases.join('**, **')}**
Args:\`${command[0].args}\`

${command[0].desc}`);
                        } else {
                            await bu.send(msg, 'That subcommand was not found!');
                        }
                    } else {
                        bu.send(msg, this.info);
                    }
                    break;
                case 'author':
                case 'owner':
                case 'authorizer':
                    if (words[2]) {
                        title = filterTitle(words[2]);
                        tag = await bu.ccommand.get(msg.channel.guild.id, title);
                        if (!tag) {
                            bu.send(msg, `❌ That ccommand doesn't exist! ❌`);
                            break;
                        }
                        author = await r.table('user').get(tag.author).run();
                        let toSend = `The ccommand \`${title}\` is owned by **${author.username}#${author.discriminator}**`;
                        if (tag.authorizer && tag.authorizer != author.id) {
                            let authorizer = await r.table('user').get(tag.authorizer).run();
                            toSend += ` and is authorized by **${authorizer.username}#${authorizer.discriminator}`;
                        }
                        toSend += '.';
                        bu.send(msg, toSend);
                    }
                    break;
                case 'docs':
                    bbtag.docs(msg, words[0], words.slice(2).join(' '));
                    break;
                case 'exec':
                case 'eval':
                case 'test':
                    let args = words.slice(2), debug = false;
                    if (args.length == 0) break;
                    if (args[0].toLowerCase() == 'debug') {
                        debug = true;
                        args.shift();
                    }
                    if (args.length > 0) {
                        await bbEngine.runTag({
                            msg,
                            limits: new bbtag.limits.ccommand(),
                            tagContent: args.join(' '),
                            input: '',
                            tagName: 'test',
                            isCC: true,
                            author: msg.author.id,
                            authorizer: msg.author.id,
                            modResult(context, text) {
                                function formatDuration(duration) {
                                    return duration.asSeconds() >= 5 ?
                                        duration.asSeconds() + 's' : duration.asMilliseconds() + 'ms';
                                }
                                let lines = [
                                    '```js',
                                    `         Execution Time: ${formatDuration(context.execTimer.duration)}`,
                                    `    Variables Committed: ${context.dbObjectsCommitted}`,
                                    `Database Execution Time: ${formatDuration(context.dbTimer.duration)}`,
                                    `   Total Execution Time: ${formatDuration(context.totalDuration)}`,
                                    '```',
                                    `${text}`
                                ];
                                return lines.join('\n');
                            },
                            attach: debug ? bbtag.generateDebug(args.join(' ')) : null
                        });
                    }
                    break;
                case 'debug':
                    result = await bbtag.executeCC(msg, filterTitle(words[2]), words.slice(3));
                    await bu.send(result.context.msg, undefined, bbtag.generateDebug(result.code, result.context));

                    break;
                case 'setlang':
                    if (words.length == 3 || words.length == 4) {
                        title = filterTitle(words[2]);
                        tag = await bu.ccommand.get(msg.channel.guild.id, title);
                        if (!tag) {
                            bu.send(msg, 'That ccommand doesn\'t exist!');
                            break;
                        }
                        await bu.ccommand.setlang(msg.channel.guild.id, title, words[3]);
                        bu.send(msg, `✅ Lang for custom command \`${title}\` set. ✅`);
                    } else if (words.length > 4) {
                        bu.send(msg, 'Too many arguments! Do `help ccommand` for more information.');
                    } else {
                        bu.send(msg, 'Not enough arguments! Do `help ccommand` for more information.');
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
