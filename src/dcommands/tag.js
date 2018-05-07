const BaseCommand = require('../structures/BaseCommand'),
    bbtag = require('../core/bbtag'),
    bbEngine = require('../structures/BBTagEngine'),
    { Message } = require('eris');

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
        desc: 'Creates a new tag with the given name and content'
    },
    {
        name: 'edit',
        args: '<name> <content>',
        desc: 'Edits an existing tag with given content, provided that you were the one who created it'
    },
    {
        name: 'delete',
        args: '<name>',
        desc: 'Deletes the tag with the given name, provided that you were the one who created it'
    },
    {
        name: 'rename',
        args: '<tag> <name>',
        desc: 'Renames the tag with the name of of the provided tag to the given name'
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
    }
];
const tagNameMsg = 'Enter the name of the tag:';
const tagContentsMsg = 'Enter the tag\'s contents:';
var searchTags = async function (msg, originalTagList, query, page, deleteMsg) {
    let tagList = originalTagList.map(m => m.name);
    let maxPages = Math.floor(originalTagList.length / results) + 1;
    tagList.sort();
    tagList = tagList.slice((page - 1) * results, ((page - 1) * results) + results);
    if (tagList.length != 0) {
        if (deleteMsg) await bot.deleteMessage(deleteMsg.channel.id, deleteMsg.id);
        var message = `Found ${tagList.length}/${originalTagList.length} tags matching '${query}'.\nPage **#${page}/${maxPages}**\n\`\`\`fix\n${tagList.join(', ').trim()}\n\`\`\`\nType a number between 1-${maxPages} to view that page, or type \`c\` to cancel.`;
        let newPage = (await bu.awaitMessage(msg, message, m => {
            let page = parseInt(m.content);
            return m.content.toLowerCase() == 'c' || (!isNaN(page) && page <= maxPages);
        })).content;
        if (newPage.toLowerCase() == 'c') {
            bu.send(msg, 'I hope you found what you were looking for!');
            return;
        }
        let choice = parseInt(newPage);
        deleteMsg = bu.awaitMessages[msg.channel.id][msg.author.id].botmsg;
        if (!isNaN(choice) && choice >= 1 && choice <= maxPages) {
            return searchTags(msg, originalTagList, query, choice, deleteMsg);
        } else {
            originalTagList = await r.table('tag').filter(
                r.row('name').match('(?i)' + escapeRegex(newPage))
            ).run();
            if (originalTagList.length == 0) {
                bu.send(msg, 'No results found!');
                return;
            }
            return searchTags(msg, originalTagList, newPage, 1, deleteMsg);
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
        let newPage = (await bu.awaitMessage(msg, message, m => {
            let page = parseInt(m.content);
            return m.content.toLowerCase() == 'c' || (!isNaN(page) && page <= maxPages);
        })).content;
        if (newPage.toLowerCase() == 'c') {
            bu.send(msg, 'I hope you found what you were looking for!');
            return;
        }
        let choice = parseInt(newPage);
        deleteMsg = bu.awaitMessages[msg.channel.id][msg.author.id].botmsg;
        if (!isNaN(choice) && choice >= 1 && choice <= maxPages) {
            return listTags(msg, originalTagList, choice, author, deleteMsg);
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
            category: bu.CommandType.GENERAL,
            usage: 'tag [<name> | create | edit | delete | rename | raw | info | top | author | search | list | favorite | report | test | debug | help | docs]',
            info: 'Tags are a system of public commands that anyone can create or run, using the BBTag language.\n\n**Subcommands**:\n**<name>**, **create**, **edit**, **delete**, **rename**, **raw**, **info**, **top**, **author**, **search**, **list**, **favorite**, **report**, **test**, **debug**, **help**, **docs**\n\nFor more information about a subcommand, do `b!tag help <subcommand>`\nFor more information about BBTag, visit <https://blargbot.xyz/tags>\nBy creating a tag, you acknowledge that you agree to the Terms of Service (<https://blargbot.xyz/tags/tos>)'
        });
    }

    async execute(msg, words, text) {
        let page = 0;
        let title, content, tag, author, originalTagList;
        if (words[1]) {
            switch (words[1].toLowerCase()) {
                case 'add':
                case 'create':
                    if (words[2]) title = words[2];
                    if (words[3]) content = bu.splitInput(text, true).slice(3).join(' ');
                    if (!title)
                        title = (await bu.awaitMessage(msg, tagNameMsg)).content;

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
                        content = (await bu.awaitMessage(msg, tagContentsMsg)).content;

                    //    content = bu.fixContent(content);

                    await r.table('tag').insert({
                        name: title,
                        author: msg.author.id,
                        content: content,
                        lastmodified: r.epochTime(dep.moment() / 1000),
                        uses: 0
                    }).run();
                    bu.send(msg, `✅ Tag \`${title}\` created. ✅`);
                    logChange('Create', msg, {
                        tag: title,
                        content: content
                    });
                    break;
                case 'rename':
                    let oldTagName, newTagName;
                    if (words[2]) oldTagName = words[2];

                    if (words[3]) newTagName = words[3];

                    if (!oldTagName) oldTagName = (await bu.awaitMessage(msg, `Enter the name of the tag you wish to rename:`)).content;
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

                    if (!newTagName) newTagName = (await bu.awaitMessage(msg, `Enter the new name.`)).content;
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
                        title = await bu.awaitMessage(msg, tagNameMsg).content;

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
                        content = await bu.awaitMessage(msg, tagContentsMsg).content;

                    //  content = bu.fixContent(content);

                    await r.table('tag').get(title).update({
                        content: content,
                        lastmodified: r.epochTime(dep.moment() / 1000)
                    }).run();
                    bu.send(msg, `✅ Tag \`${title}\` edited. ✅`);
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
                        title = await bu.awaitMessage(msg, tagNameMsg).content;

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
                        content = (await bu.awaitMessage(msg, tagContentsMsg)).content;

                    //    content = content.replace(/(?:^)(\s+)|(?:\n)(\s+)/g, '');
                    //console.debug('First:', content, words);
                    //  content = bu.fixContent(content);
                    //console.debug('Second:', content);
                    await r.table('tag').get(title).replace({
                        name: title,
                        author: msg.author.id,
                        content: content,
                        lastmodified: r.epochTime(dep.moment() / 1000),
                        uses: tag ? tag.uses : 0
                    }).run();
                    bu.send(msg, `✅ Tag \`${title}\` ${tag ? 'edited' : 'created'}. ✅`);
                    logChange(tag ? 'Edit' : 'Create', msg, {
                        tag: title,
                        content: content
                    });

                    break;
                case 'remove':
                case 'delete':
                    if (words[2]) title = words[2];
                    if (!title) title = await bu.awaitMessage(msg, tagNameMsg);

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
                            return s.name == words[2].toLowerCase() || s.alias == words[2].toLowerCase();
                        });
                        if (command.length > 0) {
                            await bu.send(msg, `Subcommand: **${command[0].name}**
Args: \`${command[0].args}\`

${command[0].desc}`);
                        } else {
                            await bu.send(msg, 'That subcommand was not found!');
                        }
                    } else
                        await bu.send(msg, e.info);
                    break;
                case 'raw':
                    if (words[2]) title = words[2];
                    if (!title) title = await bu.awaitMessage(msg, tagNameMsg);

                    tag = await r.table('tag').get(words[2]).run();
                    if (!tag) {
                        bu.send(msg, `❌ That tag doesn't exist! ❌`);
                        break;
                    }
                    if (tag.deleted) {
                        bu.send(msg, `❌ That tag has been permanently deleted! ❌`);
                        break;
                    }
                    let lang = '';
                    if (/\{lang;.*?}/i.test(tag.content)) {
                        lang = tag.content.match(/\{lang;(.*?)}/i)[1];
                    }
                    content = tag.content.replace(/`/g, '`\u200B');
                    bu.send(msg, `The code for ${words[2]} is:
\`\`\`${lang}
${content}
\`\`\``);
                    break;
                case 'author':
                    if (words[2]) title = words[2];
                    if (!title) title = await bu.awaitMessage(msg, tagNameMsg);

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
                    bu.send(msg, `The tag \`${title}\` was made by **${author.username}#${author.discriminator}**`);
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
                    if (!title) title = await bu.awaitMessage(msg, tagNameMsg);
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
                    let output = `__**Tag | ${title}** __
Author: **${author.username}#${author.discriminator}**
It was last modified **${dep.moment(tag.lastmodified).format('LLLL')}**.
It has been used a total of **${tag.uses} time${tag.uses == 1 ? '' : 's'}**!
It has been favourited **${tag.favourites || 0} time${(tag.favourites || 0) == 1 ? '' : 's'}**!`;
                    if (tag.reports && tag.reports > 0)
                        output += `\n:warning: It has been reported ${tag.reports || 0} **time${(tag.reports == 1 || 0) ? '' : 's'}**!`;
                    bu.send(msg, output);
                    break;
                case 'search':
                    let query;
                    if (words[2]) query = words[2];
                    if (!query) query = await bu.awaitMessage(msg, `What would you like to search for?`).content;

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
                            tagContent: args.join(' '),
                            input: '',
                            tagName: 'test',
                            author: msg.author.id,
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
                            }, attach: debug ? bbtag.generateDebug(args.join(' ')) : null
                        });
                    }
                    break;
                case 'debug':
                    let result = await bbtag.executeTag(msg, filterTitle(words[2]), words.slice(3));
                    let dmChannel = await result.context.user.getDMChannel();

                    if (dmChannel == null)
                        break;
                    if (result.context.author != result.context.user.id)
                        await bu.send(dmChannel.id, "Oops! I cant send a debug output for someone elses tag!");
                    else
                        await bu.send(dmChannel.id, null, bbtag.generateDebug(result.code, result.context, result.result));

                    break;
                case 'favourite':
                case 'favorite':
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
                        if (!tag.favourites) tag.favourites = 0;
                        let user = await r.table('user').get(msg.author.id).run();
                        if (!user.favourites) user.favourites = {};
                        let output;
                        if (!user.favourites[title]) {
                            user.favourites[title] = true;
                            tag.favourites++;
                            output = `The tag \`${title}\` is now on your favourites list!`;
                        } else {
                            user.favourites[title] = undefined;
                            tag.favourites--;
                            output = `The tag \`${title}\` is no longer on your favourites list!`;
                        }
                        await r.table('tag').get(title).update({
                            favourites: r.literal(tag.favourites)
                        });
                        await r.table('user').get(msg.author.id).update({
                            favourites: r.literal(user.favourites)
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
                            tag.favourites = 0;
                            await r.table('tag').get(title).replace(tag);
                            await bu.send(msg, 'The tag has been deleted.');
                        } else {
                            await bu.send(msg, 'You must provide a reason.');
                        }
                    break;
                case 'docs':
                    bbtag.docs(msg, words[0], words.slice(2).join(' '));
                    break;
                default:
                    await bbtag.executeTag(msg, filterTitle(words[1]), words.slice(2));
                    break;
            }
        } else {
            bu.send(msg, e.info);
        }
    }

    async event(args) {
        // Migrate from the old version of timer structure
        if (args.version !== 2) {
            args.context = {
                msg: JSON.parse(args.msg),
                isCC: args.params.ccommand,
                state: {
                    return: 0,
                    stackSize: 0,
                    repeats: 0,
                    embed: null,
                    reactions: args.params.reactions,
                    nsfw: null,
                    dmCount: 0,
                    timerCount: 0,
                    replace: null,
                    break: 0,
                    continue: 0
                },
                scope: {},
                input: args.params.words,
                tagName: args.params.tagName,
                author: args.params.author
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
        }

        let context = await bbEngine.Context.deserialize(args.context),
            content = args.content;

        context.state.timerCount = -1;
        context.state.embed = null;
        context.state.reactions = [];
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
            timestamp: dep.moment(msg.timestamp),
            footer: {
                text: `MsgID: ${msg.id}`
            }
        }
    }, file);
}


module.exports = TagCommand;
