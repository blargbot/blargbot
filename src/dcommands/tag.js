const BaseCommand = require('../structures/BaseCommand');
const moment = require('moment-timezone');
const bbtag = require('../core/bbtag');
const bbEngine = require('../structures/bbtag/Engine');
const Context = require('../structures/bbtag/Context');
const { Message } = require('eris');

const results = 100;
const reportChannel = '290890240011534337';
const subcommands = [
    {
        name: '<name>',
        args: '<args>',
        desc: 'Executes a tag with the given name'
    },
    {
        name: 'create',
        args: '<name> <content>',
        desc: 'Creates a new tag with the given name and content',
        aliases: ['add']
    },
    {
        name: 'edit',
        args: '<name> <content>',
        desc: 'Edits an existing tag with given content, provided that you were the one who created it'
    },
    {
        name: 'delete',
        args: '<name>',
        desc: 'Deletes the tag with the given name, provided that you were the one who created it',
        aliases: ['remove']
    },
    {
        name: 'rename',
        args: '<tag> <name>',
        desc: 'Renames the tag with the name of of the provided tag to the given name'
    },
    {
        name: 'cooldown',
        args: '<name> [time]',
        desc: 'Sets the cooldown of a tag, in milliseconds.'
    },
    {
        name: 'raw',
        args: '<name>',
        desc: 'Displays the raw code of a tag'
    },
    {
        name: 'info',
        args: '<name>',
        desc: 'Displays information about a tag'
    },
    {
        name: 'top',
        args: '',
        desc: 'Displays the top 5 tags'
    },
    {
        name: 'author',
        args: '<tag>',
        desc: 'Displays the name of the tag\'s author'
    },
    {
        name: 'search',
        args: '<name>',
        desc: 'Searches for a tag based on the provided name'
    },
    {
        name: 'list',
        args: '[author]',
        desc: 'Lists all tags, or tags made by a specific author'
    },
    {
        name: 'favorite',
        alias: 'favourite',
        args: '[tag]',
        desc: 'Adds a tag to your favourite list, or displays your favourite tags'
    },
    {
        name: 'report',
        args: '<tag> <reason>',
        desc: 'Reports a tag as violating the ToS'
    },
    {
        name: 'test',
        args: '[debug] <code>',
        desc: 'Executes code in a tag sandbox. If debug is included, the result will have a debug file attached'
    },
    {
        name: 'debug',
        args: '<name> <args>',
        desc: 'Executes the specified tag and will DM you a file containg all the debug information. Debug information wont be sent if you dont own the tag.'
    },
    {
        name: 'help',
        args: '[command]',
        desc: 'Returns general help, or help for the specified subcommand.'
    },
    {
        name: 'docs',
        args: '[topic]',
        desc: 'Returns helpful information about the specified topic.'
    },
    {
        name: 'flag',
        args: '<tag> | <add|remove> <name> <flags>',
        desc: 'Retrieves or sets the flags for a tag.'
    },
    {
        name: 'setlang',
        args: '<tag> <lang>',
        desc: 'Sets the language to use when returning the raw text of your tag'
    },
    {
        name: 'test',
        args: '<content>',
        desc: 'Uses the BBTag engine to execute the content as it was a tag',
        aliases: ['eval', 'exec', 'vtest']
    }
];
const tagNameMsg = 'Enter the name of the tag:';
const tagContentsMsg = 'Enter the tag\'s contents:';
var searchTags = async function (msg, originalTagList, search, page, deleteMsg) {
    let tagList = originalTagList.map(m => m.name);
    let maxPages = Math.floor(originalTagList.length / results) + 1;
    tagList.sort();
    tagList = tagList.slice((page - 1) * results, ((page - 1) * results) + results);
    if (tagList.length != 0) {
        if (deleteMsg) await bot.deleteMessage(deleteMsg.channel.id, deleteMsg.id);
        var message = `Found ${tagList.length}/${originalTagList.length} tags matching '${search}'.\nPage **#${page}/${maxPages}**\n\`\`\`fix\n${tagList.join(', ').trim()}\n\`\`\`\nType a number between 1-${maxPages} to view that page, or type \`c\` to cancel.`;
        let query = await bu.createQuery(msg, message, m => {
            let page = parseInt(m.content);
            return m.content.toLowerCase() == 'c' || (!isNaN(page) && page <= maxPages);
        });
        let response = await query.response;
        if (response.content.toLowerCase() == 'c') {
            bu.send(msg, 'I hope you found what you were looking for!');
            return;
        }
        let choice = parseInt(response.content);
        if (!isNaN(choice) && choice >= 1 && choice <= maxPages) {
            return searchTags(msg, originalTagList, search, choice, query.prompt);
        } else {
            originalTagList = await r.table('tag').filter(
                r.row('name').match('(?i)' + escapeRegex(response.content))
            ).run();
            if (originalTagList.length == 0) {
                bu.send(msg, 'No results found!');
                return;
            }
            return searchTags(msg, originalTagList, response.content, 1, query.prompt);
        }
    } else {
        bu.send(msg, 'No results found!');
        return;
    }
};
var listTags = async function (msg, originalTagList, page, author, deleteMsg) {
    let tagList = [];
    if (originalTagList.length == 0) {
        bu.send(msg, 'No results found!');
        return;
    }
    let maxPages = Math.floor(originalTagList.length / results) + 1;
    tagList = originalTagList.map(m => m.name);
    tagList.sort();
    tagList = tagList.slice((page - 1) * results, ((page - 1) * results) + results);
    if (tagList.length != 0) {
        if (deleteMsg) await bot.deleteMessage(deleteMsg.channel.id, deleteMsg.id);
        let message = `Found ${tagList.length}/${originalTagList.length} tags${author ? ' made by **' + bu.getFullName(author) + '**' : ''}.\nPage **#${page}/${maxPages}**\n\`\`\`fix\n${tagList.length == 0 ? 'No results found.' : tagList.join(', ').trim()}\n\`\`\`Type a number between 1-${maxPages} to view that page, or type \`c\` to cancel.`;
        console.debug(message, message.length);
        let query = await bu.createQuery(msg, message, m => {
            let page = parseInt(m.content);
            return m.content.toLowerCase() == 'c' || (!isNaN(page) && page <= maxPages);
        });
        let response = await query.response;
        if (response.content.toLowerCase() == 'c') {
            bu.send(msg, 'I hope you found what you were looking for!');
            return;
        }
        let choice = parseInt(response.content);
        if (!isNaN(choice) && choice >= 1 && choice <= maxPages) {
            return listTags(msg, originalTagList, choice, author, query.prompt);
        }
    } else {
        bu.send(msg, 'No results found!');
        return;
    }
};
function filterTitle(title) {
    return title.replace(/[^\d\w .,\/#!$%\^&\*;:{}[\]=\-_~()]/gi, '');
}

class TagCommand extends BaseCommand {
    constructor() {
        super({
            name: 'tag',
            aliases: ['t'],
            category: bu.CommandType.GENERAL,
            usage: `tag [${subcommands.map(x => `${x.name}${x.args ? ' ' + x.args : ''}`).join(' | ')}]`,
            info: 'Tags are a system of public commands that anyone can create or run, using the BBTag language.\n'
                + '\n__**Subcommands:**__\n'
                + `${subcommands.map(x => `**${x.name}**`).join(', ')}`
                + '\nFor more information about a subcommand, do `b!tag help <subcommand>`.\n'
                + '\nFor more information about BBTag, visit <https://blargbot.xyz/tags>.\n'
                + 'By creating a tag, you acknowledge that you agree to the Terms of Service (<https://blargbot.xyz/tags/tos>)'
        });
    }

    async execute(msg, words, text) {
        let page = 0;
        let title, content, tag, author, authorizer, originalTagList, lang, result;
        if (words[1]) {
            switch (words[1].toLowerCase()) {
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
                    tag = await r.table('tag').get(title).run();
                    if (!tag) {
                        bu.send(msg, `❌ That tag doesn't exist! ❌`);
                        break;
                    }
                    if (tag && tag.author != msg.author.id) {
                        bu.send(msg, `❌ You don't own this tag! ❌`);
                        break;
                    }
                    await r.table('tag').get(title).update({
                        cooldown: r.literal(cooldown)
                    });
                    bu.send(msg, `✅ The cooldown for Tag \`${title}\` has been set to \`${cooldown || 0}ms\`. ✅`);
                    break;
                case 'add':
                case 'create':
                    if (words[2]) title = words[2];
                    if (words[3]) content = bu.splitInput(text, true).slice(3).join(' ');
                    if (!title)
                        title = (await bu.awaitQuery(msg, tagNameMsg)).content;

                    title = filterTitle(title);
                    tag = await r.table('tag').get(title).run();
                    if (tag) {
                        if (tag.deleted) {
                            bu.send(msg, `❌ That tag has been permanently deleted! ❌`);
                        } else
                            bu.send(msg, `❌ That tag already exists! ❌`);
                        break;
                    }

                    if (!content)
                        content = (await bu.awaitQuery(msg, tagContentsMsg)).content;

                    //    content = bu.fixContent(content);

                    await r.table('tag').insert({
                        name: title,
                        author: msg.author.id,
                        authorizer: msg.author.id,
                        content: content,
                        lastmodified: r.epochTime(moment() / 1000),
                        uses: 0
                    }).run();
                    result = bbtag.addAnalysis(content, `✅ Tag \`${title}\` created. ✅`);
                    bu.send(msg, result);
                    logChange('Create', msg, {
                        tag: title,
                        content: content
                    });
                    break;
                case 'rename':
                    let oldTagName, newTagName;
                    if (words[2]) oldTagName = words[2];

                    if (words[3]) newTagName = words[3];

                    if (!oldTagName) oldTagName = (await bu.awaitQuery(msg, `Enter the name of the tag you wish to rename:`)).content;
                    oldTagName = filterTitle(oldTagName);
                    let oldTag = await r.table('tag').get(oldTagName).run();
                    if (!oldTag) {
                        bu.send(msg, `❌ That tag doesn't exist! ❌`);
                        break;
                    }
                    if (oldTag.deleted) {
                        bu.send(msg, `❌ That tag has been permanently deleted! ❌`);
                        break;
                    }
                    if (oldTag.author != msg.author.id) {
                        bu.send(msg, `❌ You don't own this tag! ❌`);
                        break;
                    }

                    if (!newTagName) newTagName = (await bu.awaitQuery(msg, `Enter the new name.`)).content;
                    newTagName = filterTitle(newTagName);
                    let newTag = await r.table('tag').get(newTagName).run();
                    if (newTag) {
                        bu.send(msg, `❌ The tag \`${words[3]}\` already exist! ❌`);
                        break;
                    }

                    oldTag.name = newTagName;
                    await r.table('tag').get(oldTagName).delete().run();
                    await r.table('tag').insert(oldTag).run();

                    bu.send(msg, `✅ Tag \`${oldTagName}\` has been renamed to \`${newTagName}\`. ✅`);
                    logChange('Rename', msg, {
                        oldName: oldTagName,
                        newName: newTagName
                    });
                    break;
                case 'edit':
                    if (words[2]) title = words[2];
                    if (words[3]) content = bu.splitInput(text, true).slice(3).join(' ');

                    if (!title)
                        title = (await bu.awaitQuery(msg, tagNameMsg)).content;

                    title = filterTitle(title);
                    tag = await r.table('tag').get(title).run();
                    if (!tag) {
                        bu.send(msg, `❌ That tag doesn't exist! ❌`);
                        break;
                    }
                    if (tag.deleted) {
                        bu.send(msg, `❌ That tag has been permanently deleted! ❌`);
                        break;
                    }
                    if (tag.author != msg.author.id) {
                        bu.send(msg, `❌ You don't own this tag! ❌`);
                        break;
                    }

                    if (!content)
                        content = (await bu.awaitQuery(msg, tagContentsMsg)).content;

                    //  content = bu.fixContent(content);

                    await r.table('tag').get(title).update({
                        content: content,
                        lastmodified: r.epochTime(moment() / 1000)
                    }).run();
                    result = bbtag.addAnalysis(content, `✅ Tag \`${title}\` edited. ✅`);
                    bu.send(msg, result);
                    logChange('Edit', msg, {
                        tag: title,
                        content: content
                    });
                    break;
                case 'set':
                    if (words[2]) title = words[2];
                    if (words[3]) content = bu.splitInput(text, true).slice(3).join(' ');
                    //                if (words[3]) content = text.replace(words[0], '').trim().replace(words[1], '').trim().replace(words[2], '').trim();

                    if (!title)
                        title = (await bu.awaitQuery(msg, tagNameMsg)).content;

                    title = filterTitle(title);
                    tag = await r.table('tag').get(title).run();
                    if (tag && tag.deleted) {
                        bu.send(msg, `❌ That tag has been permanently deleted! ❌`);
                        break;
                    }
                    if (tag && tag.author != msg.author.id) {
                        bu.send(msg, `❌ You don't own this tag! ❌`);
                        break;
                    }


                    if (!content)
                        content = (await bu.awaitQuery(msg, tagContentsMsg)).content;

                    //    content = content.replace(/(?:^)(\s+)|(?:\n)(\s+)/g, '');
                    //console.debug('First:', content, words);
                    //  content = bu.fixContent(content);
                    //console.debug('Second:', content);
                    await r.table('tag').get(title).replace({
                        name: title,
                        author: msg.author.id,
                        authorizer: (tag ? tag.authorizer : undefined) || msg.author.id,
                        content: content,
                        lastmodified: r.epochTime(moment() / 1000),
                        uses: tag ? tag.uses : 0,
                        flags: [],
                        lang: tag ? tag.lang : ''
                    }).run();
                    result = bbtag.addAnalysis(content, `✅ Tag \`${title}\` set. ✅`);
                    bu.send(msg, result);
                    logChange(tag ? 'Edit' : 'Create', msg, {
                        tag: title,
                        content: content
                    });

                    break;
                case 'remove':
                case 'delete':
                    if (words[2]) title = words[2];
                    if (!title) title = (await bu.awaitQuery(msg, tagNameMsg)).content;

                    tag = await r.table('tag').get(title).run();
                    if (!tag) {
                        bu.send(msg, `❌ That tag doesn't exist! ❌`);
                        break;
                    }
                    if (tag.deleted) {
                        bu.send(msg, `❌ That tag has been permanently deleted! ❌`);
                        break;
                    }
                    if (tag.author != msg.author.id && msg.author.id != bu.CAT_ID) {
                        bu.send(msg, `❌ You don't own this tag! ❌`);
                        break;
                    }
                    await r.table('tag').get(words[2]).delete();
                    bu.send(msg, `✅ Tag \`${title}\` is gone forever! ✅`);
                    logChange('Delete', msg, {
                        author: `${tag.author == msg.author.id ? msg.author.username : (await r.table('user').get(tag.author)).username} (${tag.author})`,
                        tag: title,
                        content: tag.content
                    });
                    break;
                case 'help':
                    if (words.length > 2) {
                        let command = subcommands.filter(s => {
                            return s.name == words[2].toLowerCase() || (s.aliases || []).includes(words[2].toLowerCase());
                        });
                        if (command.length > 0) {
                            await bu.send(msg, `**Subcommand:** ${command[0].name}${
                                command[0].aliases && command[0].aliases.length > 0
                                    ? `\n**Aliases:** ${(command[0].aliases || []).join(', ')}`
                                    : ''
                                }${
                                command[0].args ? `**Args:** \`${command[0].args}\`` : ''
                                }
${command[0].desc}`);
                        } else {
                            await bu.send(msg, 'That subcommand was not found!');
                        }
                    } else
                        await bu.send(msg, this.info);
                    break;
                case 'flag':
                    let input = bu.parseInput([], words);
                    if (input.undefined.length >= 3) {
                        let title = filterTitle(input.undefined[2]);
                        let tag = await r.table('tag').get(title).run();
                        if (!tag) {
                            bu.send(msg, `❌ That tag doesn't exist! ❌`);
                            break;
                        }
                        if (tag && tag.author != msg.author.id) {
                            bu.send(msg, `❌ You don't own this tag! ❌`);
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
                                await r.table('tag').get(title).update({
                                    flags: tag.flags,
                                    lastmodified: r.epochTime(moment() / 1000)
                                });
                                bu.send(msg, 'The flags have been modified.');
                                break;
                            case 'remove':
                            case 'delete':
                                let keys = Object.keys(input).filter(k => k !== 'undefined');
                                tag.flags = tag.flags.filter(f => !keys.includes(f.flag));
                                await r.table('tag').get(title).update({
                                    flags: tag.flags,
                                    lastmodified: r.epochTime(moment() / 1000)
                                });
                                bu.send(msg, 'The flags have been modified.');
                                break;
                            default:
                                bu.send(msg, 'Usage: `tag flag <add|delete> <name> [flags]`');
                                break;
                        }
                    } else if (input.undefined.length === 2) {
                        console.log(input.undefined);
                        let title = filterTitle(input.undefined[1]);
                        let tag = await r.table('tag').get(title).run();
                        if (!tag) {
                            bu.send(msg, `❌ That tag doesn't exist! ❌`);
                            break;
                        }
                        if (Array.isArray(tag.flags) && tag.flags.length > 0) {
                            let out = 'Here are the flags for that tag:\n\n';
                            for (const flag of tag.flags) {
                                out += `  \`-${flag.flag}\`/\`--${flag.word}\`: ${flag.desc || 'No description.'}\n `;
                            }
                            bu.send(msg, out);
                        } else {
                            bu.send(msg, 'That tag has no flags.');
                        }
                    }
                    break;
                case 'raw':
                    if (words[2]) title = words[2];
                    if (!title) title = (await bu.awaitQuery(msg, tagNameMsg)).content;

                    tag = await r.table('tag').get(words[2]).run();
                    if (!tag) {
                        bu.send(msg, `❌ That tag doesn't exist! ❌`);
                        break;
                    }
                    if (tag.deleted) {
                        bu.send(msg, `❌ That tag has been permanently deleted! ❌`);
                        break;
                    }
                    lang = tag.lang || '';
                    content = `The raw code for ${words[2]} is:\n\`\`\`${lang}\n${tag.content}\n\`\`\``;
                    if (content.length > 2000 || tag.content.match(/`{3}/)) {
                        bu.send(msg, `The raw code for ${title} is attached`, {
                            name: title + '.bbtag',
                            file: tag.content
                        });
                    } else {
                        bu.send(msg, content);
                    }

                    break;
                case 'author':
                    if (words[2]) title = words[2];
                    if (!title) title = (await bu.awaitQuery(msg, tagNameMsg)).content;

                    tag = await r.table('tag').get(words[2]).run();
                    if (!tag) {
                        bu.send(msg, `❌ That tag doesn't exist! ❌`);
                        break;
                    }
                    if (tag.deleted) {
                        bu.send(msg, `❌ That tag has been permanently deleted! ❌`);
                        break;
                    }
                    author = await r.table('user').get(tag.author).run();
                    let toSend = `The tag \`${title}\` was made by **${author.username}#${author.discriminator}**`;
                    if (tag.authorizer && tag.authorizer != author.id) {
                        authorizer = await r.table('user').get(tag.authorizer).run();
                        toSend += ` and is authorized by **${authorizer.username}#${authorizer.discriminator}`;
                    }
                    bu.send(msg, toSend);
                    break;
                case 'top':
                    let topTags = await r.table('tag').orderBy(r.desc(r.row('uses'))).limit(10).run();
                    let returnMsg = '__Here are the top 10 tags:__\n';
                    for (let i = 0; i < topTags.length; i++) {
                        let author = await r.table('user').get(topTags[i].author);
                        returnMsg += `**${i + 1}.** **${topTags[i].name}** (**${author.username}#${author.discriminator}**) - used **${topTags[i].uses} time${topTags[i].uses == 1 ? '' : 's'}**\n`;
                    }
                    bu.send(msg, returnMsg);
                    break;
                case 'info':
                    if (words[2]) title = words[2];
                    if (!title) title = (await bu.awaitQuery(msg, tagNameMsg)).content;
                    tag = await r.table('tag').get(words[2]).run();
                    if (!tag) {
                        bu.send(msg, `❌ That tag doesn't exist! ❌`);
                        break;
                    }
                    if (tag.deleted) {
                        bu.send(msg, `❌ That tag has been permanently deleted! ❌`);
                        break;
                    }
                    author = await r.table('user').get(tag.author).run();
                    authorizer = await r.table('user').get(tag.authorizer || tag.author).run();
                    let count = Object.keys(tag.favourites || {}).filter(id => tag.favourites[id]).length;
                    // let count = await r.table('user').getAll(tag.name, { index: 'favourite_tag' }).count();

                    let output = `__**Tag | ${title}** __
Author: **${author.username}#${author.discriminator}**
Authorizer: **${authorizer.username}#${authorizer.discriminator}**
Cooldown: ${tag.cooldown || 0}ms
It was last modified **${moment(tag.lastmodified).format('LLLL')}**.
It has been used a total of **${tag.uses} time${tag.uses == 1 ? '' : 's'}**!
It has been favourited **${count || 0} time${(count || 0) == 1 ? '' : 's'}**!`;
                    if (tag.reports && tag.reports > 0)
                        output += `\n:warning: It has been reported ${tag.reports || 0} **time${(tag.reports == 1 || 0) ? '' : 's'}**!`;
                    if (Array.isArray(tag.flags) && tag.flags.length > 0) {
                        output += '\n\n**Flags**:\n';
                        for (const flag of tag.flags) {
                            output += `  \`-${flag.flag}\`/\`--${flag.word}\`: ${flag.desc || 'No description.'}\n `;
                        }
                    }
                    bu.send(msg, output);
                    break;
                case 'search':
                    let query;
                    if (words[2]) query = words[2];
                    if (!query) query = (await bu.awaitQuery(msg, `What would you like to search for?`)).content;

                    page = 1;

                    originalTagList = await r.table('tag').filter(
                        r.row('name').match('(?i)' + query)
                    ).run();
                    if (originalTagList.length == 0) {
                        bu.send(msg, 'No results found!');
                        return;
                    }

                    searchTags(msg, originalTagList, query, page);
                    break;
                case 'list':
                    let user;
                    if (words[2]) {
                        user = await bu.getUser(msg, words[2]);
                    }
                    if (user)
                        originalTagList = await r.table('tag').getAll(user.id, {
                            index: 'author'
                        }).run();
                    else originalTagList = await r.table('tag').run();

                    listTags(msg, originalTagList, 1, user);
                    break;
                case 'eval':
                case 'exec':
                case 'test':
                case 'vtest':
                    let args = words.slice(2), debug = false;
                    if (args.length == 0) break;
                    if (args[0].toLowerCase() == 'debug') {
                        debug = true;
                        args.shift();
                    }
                    if (args.length > 0) {
                        if (await r.table('tag').get('test').run() == null)
                            await r.table('tag').get('test').replace(systemTag('test')).run();
                        await bbEngine.runTag({
                            msg,
                            limits: new bbtag.limits.tag(),
                            tagContent: args.join(' '),
                            input: '',
                            tagName: 'test',
                            author: msg.author.id,
                            authorizer: msg.author.id,
                            outputModify(context, text) {
                                function formatDuration(duration) {
                                    return duration.asSeconds() >= 5 ?
                                        duration.asSeconds() + 's' : duration.asMilliseconds() + 'ms';
                                }
                                let lines = [];
                                if (words[1] === 'vtest') {
                                    lines.push('```js',
                                        `         Execution Time: ${formatDuration(context.execTimer.duration)}`,
                                        `    Variables Committed: ${context.dbObjectsCommitted}`,
                                        `Database Execution Time: ${formatDuration(context.dbTimer.duration)}`,
                                        `   Total Execution Time: ${formatDuration(context.totalDuration)}`,
                                        '```'
                                    );
                                }
                                lines.push(text);
                                return bbtag.escapeMentions(context, lines.join('\n'));
                            }, attach: debug ? bbtag.generateDebug(args.join(' ')) : null
                        });
                    }
                    break;
                case 'debug':
                    result = await bbtag.executeTag(msg, filterTitle(words[2]), words.slice(3));
                    let dmChannel = await result.context.user.getDMChannel();

                    if (dmChannel == null)
                        break;
                    if (result.context.author != result.context.user.id)
                        await bu.send(dmChannel.id, "Oops! I cant send a debug output for someone elses tag!");
                    else
                        await bu.send(dmChannel.id, undefined, bbtag.generateDebug(result.code, result.context));

                    break;
                case 'favourite':
                case 'favorite':
                    if (words.length > 2) {
                        title = filterTitle(words[2]);
                        tag = await r.table('tag').get(title).run();
                        if (!tag) {
                            bu.send(msg, `❌ That tag doesn't exist! ❌`);
                            break;
                        }
                        if (tag.deleted) {
                            bu.send(msg, `❌ That tag has been permanently deleted! ❌`);
                            break;
                        }
                        if (!tag.favourites) tag.favourites = {};
                        let output;
                        if (!tag.favourites[msg.author.id]) {
                            tag.favourites[msg.author.id] = true;
                            output = `The tag \`${title}\` is now on your favourites list!\n\nNote: there is no way for a tag to tell if you've favourited it, and thus it's impossible to give rewards for favouriting. Any tag that claims otherwise is lying, and should be reported.`;
                        } else {
                            tag.favourites[msg.author.id] = false;
                            output = `The tag \`${title}\` is no longer on your favourites list!`;
                        }
                        await r.table('tag').get(tag.name).update({
                            favourites: tag.favourites
                        });
                        await bu.send(msg, output);
                    } else {
                        let user = await r.table('user').get(msg.author.id);
                        let tags = await r.table('tag').getAll(msg.author.id, { index: 'user_favourite' });
                        let output = `You have ${tags.length} favourite tags. \`\`\`fix
${tags.map(t => t.name).join(', ')}              
\`\`\` `;
                        await bu.send(msg, output);
                    }

                    break;
                case 'report':
                    if (words.length > 2) {
                        title = filterTitle(words[2]);
                        tag = await r.table('tag').get(words[2]).run();
                        if (!tag) {
                            bu.send(msg, `❌ That tag doesn't exist! ❌`);
                            break;
                        }
                        if (tag.deleted) {
                            bu.send(msg, `❌ That tag has been permanently deleted! ❌`);
                            break;
                        }
                        if (!tag.reports) tag.reports = 0;
                        let user = await r.table('user').get(msg.author.id).run();
                        if (user.reportblock) {
                            return await bu.send(msg, user.reportblock);
                        }
                        if (!user.reports) user.reports = {};
                        let output;
                        if (words.length > 3) {
                            if (user.reports[title] == undefined)
                                tag.reports++;
                            user.reports[title] = words.slice(3).join(' ');
                            output = `The tag \`${title}\` has been reported.`;
                            await bu.send(reportChannel, `**${bu.getFullName(msg.author)}** has reported the tag: ${title}

${user.reports[title]}`);
                        } else if (user.reports[title] != undefined) {
                            user.reports[title] = undefined;
                            tag.reports--;
                            output = `The tag \`${title}\` is no longer being reported by you.`;
                            await bu.send(reportChannel, `**${bu.getFullName(msg.author)}** is no longer reporting the tag: ${title}`);
                        } else {
                            output = `Please provide a reason for your report.`;
                        }
                        await r.table('tag').get(title).update({
                            reports: r.literal(tag.reports)
                        });
                        await r.table('user').get(msg.author.id).update({
                            reports: r.literal(user.reports)
                        });
                        await bu.send(msg, output);
                    } else {
                        let user = await r.table('user').get(msg.author.id);
                        if (!user.favourites) user.favourites = {};
                        let output = `You have ${Object.keys(user.favourites).length} favourite tags. \`\`\`fix
${Object.keys(user.favourites).join(', ')}              
\`\`\` `;
                        await bu.send(msg, output);
                    }

                    break;
                case 'permdelete':
                    if (msg.author.id == bu.CAT_ID)
                        if (words.length > 3) {
                            title = filterTitle(words[2]);
                            tag = await r.table('tag').get(words[2]).run();
                            if (!tag) {
                                bu.send(msg, `❌ That tag doesn't exist! ❌`);
                                break;
                            }
                            tag.deleter = msg.author.id;
                            tag.reason = words.slice(3).join(' ');
                            tag.deleted = true;
                            tag.uses = 0;
                            tag.favourites = {};
                            await r.table('tag').get(title).replace(tag);
                            await bu.send(msg, 'The tag has been deleted.');
                        } else {
                            await bu.send(msg, 'You must provide a reason.');
                        }
                    break;
                case 'docs':
                    bbtag.docs(msg, words[0], words.slice(2).join(' '));
                    break;
                case 'setlang':
                    if (words.length == 3 || words.length == 4) {
                        title = filterTitle(words[2]);
                        tag = await r.table('tag').get(words[2]).run();
                        if (!tag) {
                            bu.send(msg, 'That tag doesn\'t exist!');
                            break;
                        }
                        await r.table('tag').get(title).update({ lang: words[3] }).run();
                        bu.send(msg, `✅ Lang for tag \`${title}\` set. ✅`);
                    } else if (words.length > 4) {
                        bu.send(msg, 'Too many arguments! Do `help tag` for more information.');
                    } else {
                        bu.send(msg, 'Not enough arguments! Do `help tag` for more information.');
                    }
                    break;
                default:
                    await bbtag.executeTag(msg, filterTitle(words[1]), words.slice(2));
                    break;
            }
        } else {
            bu.send(msg, this.info);
        }
    }

    async event(args) {
        // Migrate from the old version of timer structure
        if (typeof args.version !== 'number' || args.version < 2) {
            args.context = {
                msg: JSON.parse(args.msg),
                isCC: args.params.ccommand,
                state: {
                    count: {
                        dm: 0,
                        send: 0,
                        edit: 0,
                        delete: 0,
                        react: 0,
                        reactRemove: 0,
                        timer: 0,
                        loop: 0,
                        foreach: 0
                    },
                    return: 0,
                    stackSize: 0,
                    embed: null,
                    reactions: args.params.reactions,
                    nsfw: null,
                    replace: null,
                    break: 0,
                    continue: 0
                },
                scope: {},
                input: args.params.words,
                tagName: args.params.tagName,
                author: args.params.author,
                authorizer: args.params.author
            };
            let channel = bot.getChannel(args.channel);
            args.context.msg.channel = {
                id: args.channel,
                serialized: JSON.stringify(channel)
            };
            args.context.msg.member = {
                id: args.context.msg.author.id,
                serialized: JSON.stringify(channel.guild.members.get(args.context.msg.author.id))
            };

            args.content = args.params.args[1];
            args.tempVars = args.params.vars;
            args.version = 2;
        }

        let context = await Context.deserialize(args.context),
            content = args.content;

        if (!context.state.count) context.state.count = {};

        context.state.embed = null;
        context.state.reactions = [];

        if (args.version == 2) {
            context.state.count.loop = context.state.repeats;
            context.state.count.foreach = context.state.foreach;
            context.state.count.dm = context.state.dm;
            delete context.state.timerCount;
            delete context.state.dmCount;
            delete context.state.repeats;
            delete context.state.foreach;

            args.version = 3;
        }

        if (args.version < 4) {
            function reduceLimit(key, count, attribute = 'count') {
                if (context.state.limits[key] && attribute in context.state.limits[key]) {
                    context.state.limits[key][attribute] -= count;
                }
            }

            context.state.limits = context.isCC ? new bbtag.limits.ccommand() : new bbtag.limits.tag();
            reduceLimit('dm', context.state.count.dm || 0);
            reduceLimit('send', context.state.count.send || 0);
            reduceLimit('edit', context.state.count.edit || 0);
            reduceLimit('delete', context.state.count.delete || 0);
            (context.state.limits.timer || (context.state.limits.timer = {})).disabled = true;
            reduceLimit('for', context.state.count.loop || 0, 'loops');
            reduceLimit('foreach', context.state.count.foreach || 0, 'loops');
            (context.state.limits.output || (context.state.limits.output = {})).disabled = true;

            args.version = 4;
        }

        try {
            await bbEngine.runTag(content, context);
        } catch (err) {
            console.error(err);
            throw err;
        }
    };
}

function escapeRegex(str) {
    return (str + '').replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
}

function systemTag(name) {
    return {
        name,
        content: 'System Generated Tag',
        author: '1',
        lastmodified: r.epochTime(0),
        uses: 0,
        systemOwned: true
    };
}

function logChange(action, msg, actionObj) {
    let actionArray = [];
    let file = actionObj.content ? { name: actionObj.tag + '.bbtag', file: actionObj.content } : undefined;
    for (let key in actionObj) {
        if (actionObj[key].length > 1000) actionObj[key] = actionObj[key].substring(0, 1000) + '... (too long)';
        actionArray.push({
            name: key,
            value: actionObj[key],
            inline: true
        });
    }
    let color = 0x000000;
    switch (action.split(' ')[0].toLowerCase()) {
        case 'create':
            color = 0x0eed24;
            break;
        case 'edit':
            color = 0x6b0eed;
            break;
        case 'delete':
            color = 0xf20212;
            break;
        case 'rename':
            color = 0x02f2ee;
            break;
    }
    bu.send('230810364164440065', {
        embed: {
            title: action,
            color: color,
            fields: actionArray,
            author: {
                name: bu.getFullName(msg.author),
                icon_url: msg.author.avatarURL,
                url: `https://blargbot.xyz/user/${msg.author.id}`
            },
            timestamp: moment(msg.timestamp),
            footer: {
                text: `MsgID: ${msg.id}`
            }
        }
    }, file);
}


module.exports = TagCommand;
